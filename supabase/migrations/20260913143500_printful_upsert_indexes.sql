-- PostgREST upserts require non-partial unique indexes for ON CONFLICT inference.
-- PostgreSQL still permits multiple NULL values in these indexes.

DROP INDEX IF EXISTS public.products_supplier_product_id_key;
CREATE UNIQUE INDEX products_supplier_product_id_key
    ON public.products (supplier, supplier_product_id);

DROP INDEX IF EXISTS public.product_variants_supplier_variant_id_key;
CREATE UNIQUE INDEX product_variants_supplier_variant_id_key
    ON public.product_variants (supplier_variant_id);
