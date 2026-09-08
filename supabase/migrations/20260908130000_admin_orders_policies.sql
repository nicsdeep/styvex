-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
    ON public.orders FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Admins can update orders
CREATE POLICY "Admins can update orders"
    ON public.orders FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
    ON public.order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
