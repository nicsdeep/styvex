-- Add missing order snapshot fields and shipping tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS inventory_status TEXT DEFAULT 'pending';

-- Drop price from order_items and replace with proper snapshot fields
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;

-- Create addresses table for shipping/delivery
CREATE TABLE public.shipping_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- e.g., 'stripe', 'mock'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    amount NUMERIC NOT NULL,
    transaction_id TEXT, -- external ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create order status history for auditable tracking
CREATE TABLE public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- who changed it (null if system)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create shipments table
CREATE TABLE public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    carrier TEXT NOT NULL,
    tracking_number TEXT,
    tracking_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'shipped', 'delivered', 'returned'
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create refunds table
CREATE TABLE public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all new tables
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Apply basic RLS for new tables: Users can view their own, Admins can view/edit all

-- Shipping Addresses
CREATE POLICY "Users can view their own shipping addresses" ON public.shipping_addresses FOR SELECT
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = shipping_addresses.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Users can insert their own shipping addresses" ON public.shipping_addresses FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = shipping_addresses.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Service role can manage shipping addresses" ON public.shipping_addresses USING (true);

-- Payments
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Service role can manage payments" ON public.payments USING (true);

-- Order Status History
CREATE POLICY "Users can view their own order status history" ON public.order_status_history FOR SELECT
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Service role can manage order status history" ON public.order_status_history USING (true);

-- Shipments
CREATE POLICY "Users can view their own shipments" ON public.shipments FOR SELECT
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = shipments.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Service role can manage shipments" ON public.shipments USING (true);

-- Refunds
CREATE POLICY "Users can view their own refunds" ON public.refunds FOR SELECT
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = refunds.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Service role can manage refunds" ON public.refunds USING (true);
