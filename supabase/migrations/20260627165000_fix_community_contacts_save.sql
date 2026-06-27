grant usage on schema public to authenticated;
grant select, insert, update, delete on public.community_contacts to authenticated;

alter table public.community_contacts
  alter column created_by_user_id set default auth.uid();

create or replace function public.set_community_contact_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.community_id is null then
    new.community_id := public.my_community_id();
  end if;

  if new.created_by_user_id is null then
    new.created_by_user_id := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists community_contacts_set_defaults on public.community_contacts;
create trigger community_contacts_set_defaults
before insert on public.community_contacts
for each row execute function public.set_community_contact_defaults();

drop policy if exists "Members view own community contacts" on public.community_contacts;
create policy "Members view own community contacts"
on public.community_contacts for select
to authenticated
using (
  public.is_super_admin()
  or (community_id = public.my_community_id() and public.my_community_is_approved())
);

drop policy if exists "Admins manage own community contacts" on public.community_contacts;
create policy "Admins manage own community contacts"
on public.community_contacts for all
to authenticated
using (
  public.is_super_admin()
  or (community_id = public.my_community_id() and public.can_manage_own_community())
)
with check (
  public.is_super_admin()
  or (community_id = public.my_community_id() and public.can_manage_own_community())
);
