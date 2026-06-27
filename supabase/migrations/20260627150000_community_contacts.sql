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

grant select on public.community_contacts to authenticated;
grant insert, update, delete on public.community_contacts to authenticated;

create or replace function public.seed_default_community_contacts(target_community_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.community_contacts (
    community_id,
    category,
    type,
    name,
    phone_number,
    description,
    display_order,
    is_emergency
  )
  values
    (target_community_id, 'emergency', 'ambulance', 'Ambulance', '1122', 'Emergency ambulance helpline', 10, true),
    (target_community_id, 'emergency', 'police', 'Police', '15', 'Police emergency helpline', 20, true),
    (target_community_id, 'emergency', 'fire_brigade', 'Fire Brigade', '16', 'Fire and rescue emergency helpline', 30, true),
    (target_community_id, 'emergency', 'security', 'Community Security', null, 'Community security desk', 40, true),
    (target_community_id, 'emergency', 'admin_office', 'Community Admin Office', null, 'Community administration office', 50, true)
  on conflict (community_id, type) where type in ('ambulance', 'police', 'fire_brigade', 'security', 'admin_office')
  do nothing;
$$;

create or replace function public.seed_contacts_when_community_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved'
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
  then
    perform public.seed_default_community_contacts(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists community_contacts_seed_on_approval on public.community_settings;
create trigger community_contacts_seed_on_approval
after insert or update of status on public.community_settings
for each row execute function public.seed_contacts_when_community_approved();

select public.seed_default_community_contacts(id)
from public.community_settings
where status = 'approved';

drop policy if exists "Members view own community contacts" on public.community_contacts;
create policy "Members view own community contacts"
on public.community_contacts for select
to authenticated
using (
  community_id = (
    select p.community_id
    from public.profiles p
    where p.id = auth.uid()
      and p.membership_status = 'approved'
  )
);

drop policy if exists "Admins manage own community contacts" on public.community_contacts;
create policy "Admins manage own community contacts"
on public.community_contacts for all
to authenticated
using (
  public.is_super_admin()
  or (
    community_id = (
      select p.community_id
      from public.profiles p
      where p.id = auth.uid()
        and p.membership_status = 'approved'
    )
    and exists (
      select 1
      from public.user_roles r
      where r.user_id = auth.uid()
        and r.role::text in ('admin', 'moderator')
    )
  )
)
with check (
  public.is_super_admin()
  or (
    community_id = (
      select p.community_id
      from public.profiles p
      where p.id = auth.uid()
        and p.membership_status = 'approved'
    )
    and exists (
      select 1
      from public.user_roles r
      where r.user_id = auth.uid()
        and r.role::text in ('admin', 'moderator')
    )
  )
);
