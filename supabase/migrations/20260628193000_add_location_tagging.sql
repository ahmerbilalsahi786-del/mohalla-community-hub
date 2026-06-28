alter table public.events
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.places
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.volunteer_opportunities
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.community_contacts
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.community_contacts
  drop constraint if exists community_contacts_category_check;

alter table public.community_contacts
  add constraint community_contacts_category_check
  check (category in ('emergency', 'services', 'medical'));

do $$
begin
  if to_regclass('public.volunteers') is not null then
    execute 'alter table public.volunteers add column if not exists latitude numeric';
    execute 'alter table public.volunteers add column if not exists longitude numeric';
  end if;
end $$;
