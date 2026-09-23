-- Keep supplier economics inaccessible to anonymous and customer API clients.
-- Service integrations retain access; verified admins use a role-checked RPC.
CREATE FUNCTION public.admin_catalog_products()
RETURNS SETOF public.products LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.products;
END $$;
REVOKE ALL ON FUNCTION public.admin_catalog_products() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_catalog_products() TO authenticated;
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id,name,slug,price,description,category_id,is_featured,created_at,updated_at,base_review_count,fts)
ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
