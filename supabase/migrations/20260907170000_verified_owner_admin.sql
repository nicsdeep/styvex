-- Provision only after the Auth service verifies the owner's email.
create function public.sync_verified_owner_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' then
    if lower(OLD.email) = 'nicsdavid@gmail.com' and
       (lower(NEW.email) is distinct from 'nicsdavid@gmail.com' or NEW.email_confirmed_at is null) then
      delete from public.user_roles where user_id = NEW.id and role = 'admin';
    end if;
  end if;
  if lower(NEW.email) = 'nicsdavid@gmail.com' and NEW.email_confirmed_at is not null then
    insert into public.user_roles (user_id, role) values (NEW.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return NEW;
end;
$$;
revoke all on function public.sync_verified_owner_role() from public, anon, authenticated;
create trigger sync_verified_owner_role
after insert or update of email, email_confirmed_at on auth.users
for each row execute function public.sync_verified_owner_role();
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where lower(email) = 'nicsdavid@gmail.com' and email_confirmed_at is not null
on conflict (user_id, role) do nothing;
