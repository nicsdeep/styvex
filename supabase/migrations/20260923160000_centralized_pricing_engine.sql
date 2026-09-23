-- 1. Create global pricing config table
CREATE TABLE public.store_pricing_config (
  id integer PRIMARY KEY CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  markup_multiplier numeric(10,2) NOT NULL DEFAULT 1.0,
  fixed_markup numeric(10,2) NOT NULL DEFAULT 0.00,
  minimum_retail_price numeric(10,2) NOT NULL DEFAULT 0.00,
  rounding_rule text NOT NULL DEFAULT 'none' CHECK (rounding_rule IN ('none', '99_cents', '00_cents')),
  currency text NOT NULL DEFAULT 'USD',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Initialize default row (e.g., 2.0x markup + $5)
INSERT INTO public.store_pricing_config (id, enabled, markup_multiplier, fixed_markup, minimum_retail_price, rounding_rule)
VALUES (1, true, 2.0, 5.00, 10.00, '99_cents');

-- Security for config
ALTER TABLE public.store_pricing_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_store_pricing_config ON public.store_pricing_config FOR SELECT USING (true);
CREATE POLICY admin_store_pricing_config ON public.store_pricing_config FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.store_pricing_config TO anon, authenticated;
GRANT ALL ON public.store_pricing_config TO service_role;

-- 2. Add override columns to categories
ALTER TABLE public.categories ADD COLUMN override_markup_multiplier numeric(10,2);
ALTER TABLE public.categories ADD COLUMN override_fixed_markup numeric(10,2);
ALTER TABLE public.categories ADD COLUMN override_rounding_rule text CHECK (override_rounding_rule IN ('none', '99_cents', '00_cents'));

-- 3. Create Pricing Engine Function
CREATE OR REPLACE FUNCTION public.calculate_styvex_retail_price(
  p_supplier_cost numeric,
  p_category_id uuid,
  p_retail_price_override numeric
) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_config store_pricing_config%ROWTYPE;
  v_cat record;
  v_mult numeric;
  v_fixed numeric;
  v_round text;
  v_price numeric;
BEGIN
  -- 1. Check Product-Level Override
  IF p_retail_price_override IS NOT NULL THEN
    RETURN p_retail_price_override;
  END IF;

  -- 2. If no supplier cost, fallback to 0 (or null)
  IF p_supplier_cost IS NULL THEN
    RETURN 0.00;
  END IF;

  -- 3. Load Global Config
  SELECT * INTO v_config FROM public.store_pricing_config WHERE id = 1;

  -- 4. Load Category Overrides
  v_mult := v_config.markup_multiplier;
  v_fixed := v_config.fixed_markup;
  v_round := v_config.rounding_rule;

  IF p_category_id IS NOT NULL THEN
    SELECT override_markup_multiplier, override_fixed_markup, override_rounding_rule 
    INTO v_cat FROM public.categories WHERE id = p_category_id;
    
    IF v_cat.override_markup_multiplier IS NOT NULL THEN v_mult := v_cat.override_markup_multiplier; END IF;
    IF v_cat.override_fixed_markup IS NOT NULL THEN v_fixed := v_cat.override_fixed_markup; END IF;
    IF v_cat.override_rounding_rule IS NOT NULL THEN v_round := v_cat.override_rounding_rule; END IF;
  END IF;

  -- 5. Calculate Base Price
  IF v_config.enabled THEN
    v_price := (p_supplier_cost * v_mult) + v_fixed;
  ELSE
    v_price := p_supplier_cost;
  END IF;

  -- 6. Minimum Price Guard
  IF v_price < v_config.minimum_retail_price THEN
    v_price := v_config.minimum_retail_price;
  END IF;

  -- 7. Apply Rounding
  IF v_round = '99_cents' THEN
    v_price := floor(v_price) + 0.99;
  ELSIF v_round = '00_cents' THEN
    v_price := ceil(v_price);
  ELSE
    v_price := round(v_price, 2);
  END IF;

  RETURN v_price;
END;
$$;

-- 4. Create secure storefront_products view
-- We must drop the view if it exists in case we are replacing
DROP VIEW IF EXISTS public.storefront_products;
CREATE VIEW public.storefront_products AS
SELECT
  id,
  category_id,
  name,
  slug,
  description,
  public.calculate_styvex_retail_price(supplier_cost, category_id, retail_price_override) AS price,
  is_featured,
  created_at,
  updated_at
FROM public.products;

-- Setup View Security
GRANT SELECT ON public.storefront_products TO anon, authenticated, service_role;

-- Revoke raw access from anon/authenticated so they can't see supplier_cost
REVOKE SELECT ON public.products FROM anon, authenticated;

-- Clean up old obsolete trigger
DROP TRIGGER IF EXISTS calculate_product_price ON public.products;
DROP FUNCTION IF EXISTS public.calculate_retail_price();
DROP FUNCTION IF EXISTS public.update_category_prices() CASCADE;
