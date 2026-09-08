-- Add full text search column to products
ALTER TABLE public.products
ADD COLUMN fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

-- Create GIN index for fast search
CREATE INDEX products_fts_idx ON public.products USING GIN (fts);
