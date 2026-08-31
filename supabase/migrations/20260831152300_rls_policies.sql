-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Categories are visible to everyone" 
ON public.categories FOR SELECT 
USING (true);

-- Products policies
CREATE POLICY "Products are visible to everyone" 
ON public.products FOR SELECT 
USING (true);

-- Product variants policies
CREATE POLICY "Product variants are visible to everyone" 
ON public.product_variants FOR SELECT 
USING (true);

-- Product images policies
CREATE POLICY "Product images are visible to everyone" 
ON public.product_images FOR SELECT 
USING (true);
