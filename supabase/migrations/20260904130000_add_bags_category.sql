-- Add the Bags collection as a durable catalog category.
-- This remains safe to run more than once.
INSERT INTO public.categories (name, slug, description)
VALUES (
  'Bags',
  'bags',
  'Handbags, everyday carry pieces, and refined accessories.'
)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;
