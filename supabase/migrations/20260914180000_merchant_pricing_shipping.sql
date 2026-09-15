-- Merchant-controlled retail and shipping. Supplier costs never determine a
-- customer charge without the merchant's rules.
ALTER TABLE public.products ADD COLUMN retail_price_override numeric(10,2)
  CHECK (retail_price_override IS NULL OR retail_price_override > 0);

CREATE OR REPLACE FUNCTION public.calculate_retail_price()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE markup numeric;
BEGIN
  IF NEW.retail_price_override IS NOT NULL THEN
    NEW.price := NEW.retail_price_override;
  ELSIF NEW.supplier_cost IS NOT NULL THEN
    SELECT retail_markup_percentage INTO markup FROM categories WHERE id = NEW.category_id;
    IF markup IS NOT NULL THEN
      NEW.price := round(NEW.supplier_cost * (1 + markup / 100), 2);
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER calculate_product_price ON public.products;
CREATE TRIGGER calculate_product_price BEFORE INSERT OR UPDATE OF supplier_cost, category_id, retail_price_override, price
ON public.products FOR EACH ROW EXECUTE FUNCTION public.calculate_retail_price();
CREATE OR REPLACE FUNCTION public.update_category_prices()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.retail_markup_percentage IS DISTINCT FROM NEW.retail_markup_percentage THEN
    UPDATE products SET supplier_cost = supplier_cost
    WHERE category_id = NEW.id AND supplier_cost IS NOT NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE TABLE public.supplier_shipping_rules (
  supplier text PRIMARY KEY,
  markup_percentage numeric(7,2) NOT NULL DEFAULT 25 CHECK (markup_percentage BETWEEN 0 AND 1000),
  handling_fee numeric(10,2) NOT NULL DEFAULT 1.50 CHECK (handling_fee BETWEEN 0 AND 1000),
  enabled boolean NOT NULL DEFAULT false
);
ALTER TABLE public.supplier_shipping_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supplier_shipping_rules FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.supplier_shipping_rules TO authenticated;
GRANT ALL ON public.supplier_shipping_rules TO service_role;
CREATE POLICY admin_shipping_rules ON public.supplier_shipping_rules FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.supplier_shipping_rules(supplier, enabled) VALUES ('cj', true);

-- Public policy; threshold changes must ship with matching policy/banner tests.
CREATE TABLE public.checkout_policy (
  id integer PRIMARY KEY CHECK (id = 1),
  free_shipping_threshold numeric NOT NULL CHECK (free_shipping_threshold = 600),
  free_shipping_country text NOT NULL CHECK (free_shipping_country = 'US'),
  handling_scope text NOT NULL CHECK (handling_scope = 'order')
);
INSERT INTO public.checkout_policy VALUES (1,600,'US','order');
ALTER TABLE public.checkout_policy ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_checkout_policy ON public.checkout_policy FOR SELECT USING (true);
GRANT SELECT ON public.checkout_policy TO anon, authenticated;
GRANT ALL ON public.checkout_policy TO service_role;

CREATE TABLE public.checkout_shipping_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  fingerprint text NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  customer_shipping numeric(10,2) NOT NULL,
  supplier_shipping numeric(10,2) NOT NULL,
  details jsonb NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes'
);
ALTER TABLE public.checkout_shipping_quotes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_shipping_quotes FROM anon, authenticated;
GRANT ALL ON public.checkout_shipping_quotes TO service_role;
ALTER TABLE public.orders ADD COLUMN shipping_quote_id uuid REFERENCES public.checkout_shipping_quotes(id);
COMMENT ON TABLE public.checkout_policy IS 'Owner approved: separate merchant shipping, US standard free strictly above $600 after discounts excluding tax/shipping. Supplier always paid in full. See docs/commerce-rules.md.';
