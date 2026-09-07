create table public.store_settings (
  id integer primary key default 1 check (id = 1),
  header_logo text not null default '/styvex_logo2.svg' check (header_logo ~ '^/styvex[-_a-zA-Z0-9]*\.svg$'),
  footer_logo text not null default '/styvex-footer-white.svg' check (footer_logo ~ '^/styvex[-_a-zA-Z0-9]*\.svg$'),
  header_height integer not null default 40 check (header_height between 24 and 48),
  footer_height integer not null default 40 check (footer_height between 24 and 80)
);
grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;
alter table public.store_settings enable row level security;
create policy "Read brand settings" on public.store_settings for select using (true);
create policy "Admins update brand settings" on public.store_settings for update to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
insert into public.store_settings (id) values (1);
grant insert, update, delete on public.products, public.categories, public.product_images, public.product_variants to authenticated;
