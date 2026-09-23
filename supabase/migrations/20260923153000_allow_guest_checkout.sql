-- Allow guest checkouts by removing the NOT NULL constraint on user_id
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.checkout_shipping_quotes ALTER COLUMN user_id DROP NOT NULL;
