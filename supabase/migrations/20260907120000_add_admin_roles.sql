-- Secure role model for the STYVEX administration area. Roles deliberately
-- live outside user profiles and are only checked through this helper.
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

grant usage on type public.app_role to authenticated;
grant select on public.user_roles to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
alter table public.user_roles enable row level security;

create policy "Users can view their own roles"
on public.user_roles for select to authenticated
using (user_id = auth.uid());

-- Administrators may maintain the live catalogue without exposing write access
-- to shoppers. The existing public read policies remain untouched.
create policy "Admins manage categories"
on public.categories for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins manage products"
on public.products for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins manage product variants"
on public.product_variants for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins manage product images"
on public.product_images for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Grant the first admin only if that email already belongs to a Supabase Auth user.
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('nicsdavid@gmail.com')
on conflict (user_id, role) do nothing;
