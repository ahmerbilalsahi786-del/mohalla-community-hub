create table if not exists public.community_contacts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.community_settings(id) on delete cascade,
  category text not null,
  type text not null,
  name text not null,
  phone_number text,
  description text,
  display_order integer not null default 0,
  is_emergency boolean not null default false,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint community_contacts_category_check check (category in ('emergency', 'services')),
  constraint community_contacts_type_not_blank check (length(trim(type)) > 0),
  constraint community_contacts_name_not_blank check (length(trim(name)) > 0)
);

create index if not exists community_contacts_community_order_idx
on public.community_contacts (community_id, is_emergency desc, display_order, name);

create unique index if not exists community_contacts_default_type_idx
on public.community_contacts (community_id, type)
where type in ('ambulance', 'police', 'fire_brigade', 'security', 'admin_office');

alter table public.community_contacts enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.community_contacts to authenticated;

alter table public.community_contacts
  alter column created_by_user_id set default auth.uid();

create or replace function public.can_manage_community_contacts(target_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin() or exists (
    select 1
    from public.user_roles r
    join public.profiles p on p.id = r.user_id
    left join public.community_settings c on c.id = p.community_id
    where r.user_id = auth.uid()
      and r.role::text in ('admin', 'moderator')
      and p.community_id = target_community_id
      and coalesce(c.status, 'approved') = 'approved'
  )
$$;

revoke execute on function public.can_manage_community_contacts(uuid) from public, anon;
grant execute on function public.can_manage_community_contacts(uuid) to authenticated;

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
before insert or update on public.community_contacts
for each row execute function public.set_community_contact_defaults();

drop policy if exists "Members view own community contacts" on public.community_contacts;
create policy "Members view own community contacts"
on public.community_contacts for select
to authenticated
using (
  public.is_super_admin()
  or public.can_manage_community_contacts(community_id)
  or (community_id = public.my_community_id() and public.my_community_is_approved())
);

drop policy if exists "Admins manage own community contacts" on public.community_contacts;
create policy "Admins manage own community contacts"
on public.community_contacts for all
to authenticated
using (public.can_manage_community_contacts(community_id))
with check (public.can_manage_community_contacts(community_id));
