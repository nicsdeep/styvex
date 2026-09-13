-- Track supplier catalog mappings and paid-order fulfillment without exposing
-- supplier credentials to the browser.

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS supplier TEXT NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS supplier_product_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS products_supplier_product_id_key
    ON public.products (supplier, supplier_product_id)
    WHERE supplier_product_id IS NOT NULL;

ALTER TABLE public.product_variants
    ADD COLUMN IF NOT EXISTS supplier_variant_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS product_variants_supplier_variant_id_key
    ON public.product_variants (supplier_variant_id)
    WHERE supplier_variant_id IS NOT NULL;

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS customer_email TEXT,
    ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'usd',
    ADD COLUMN IF NOT EXISTS shipping_address JSONB,
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS fulfillment_provider TEXT,
    ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'unsubmitted',
    ADD COLUMN IF NOT EXISTS supplier_order_id TEXT,
    ADD COLUMN IF NOT EXISTS fulfillment_error TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS variant_id UUID,
    ADD COLUMN IF NOT EXISTS supplier TEXT NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS supplier_variant_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_supplier_order_id_key
    ON public.orders (fulfillment_provider, supplier_order_id)
    WHERE supplier_order_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_orders_modtime ON public.orders;
CREATE TRIGGER update_orders_modtime
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

