-- Add supplier_cost column to products table
ALTER TABLE public.products
ADD COLUMN supplier_cost NUMERIC(10, 2) DEFAULT NULL;

-- Create function to calculate retail price based on supplier cost and category markup
CREATE OR REPLACE FUNCTION public.calculate_retail_price()
RETURNS TRIGGER AS $$
DECLARE
    markup_percentage NUMERIC(5, 2);
BEGIN
    -- Only calculate if supplier_cost is provided
    IF NEW.supplier_cost IS NOT NULL THEN
        -- Get the retail_markup_percentage from the associated category
        SELECT retail_markup_percentage INTO markup_percentage 
        FROM public.categories 
        WHERE id = NEW.category_id;
        
        -- If markup is found, calculate the new price
        IF markup_percentage IS NOT NULL THEN
            NEW.price = ROUND(NEW.supplier_cost * (1 + markup_percentage / 100), 2);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate price when a product is created or updated
CREATE TRIGGER calculate_product_price
BEFORE INSERT OR UPDATE OF supplier_cost, category_id ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.calculate_retail_price();

-- Create function to update all product prices when a category's markup changes
CREATE OR REPLACE FUNCTION public.update_category_prices()
RETURNS TRIGGER AS $$
BEGIN
    -- If the markup percentage has changed
    IF OLD.retail_markup_percentage IS DISTINCT FROM NEW.retail_markup_percentage THEN
        -- Update all products in this category that have a supplier_cost
        UPDATE public.products 
        SET price = ROUND(supplier_cost * (1 + NEW.retail_markup_percentage / 100), 2)
        WHERE category_id = NEW.id AND supplier_cost IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate prices when category markup is updated
CREATE TRIGGER category_markup_update
AFTER UPDATE OF retail_markup_percentage ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_category_prices();
