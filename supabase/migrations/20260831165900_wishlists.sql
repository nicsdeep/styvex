create table if not exists public.wishlists (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, product_id)
);

alter table public.wishlists enable row level security;

create policy "Users can view their own wishlists."
    on public.wishlists for select
    using (auth.uid() = user_id);

create policy "Users can insert into their own wishlists."
    on public.wishlists for insert
    with check (auth.uid() = user_id);

create policy "Users can delete from their own wishlists."
    on public.wishlists for delete
    using (auth.uid() = user_id);
