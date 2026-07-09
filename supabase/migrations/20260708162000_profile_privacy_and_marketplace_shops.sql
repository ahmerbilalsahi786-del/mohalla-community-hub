alter table public.listings
  add column if not exists listing_kind text not null default 'listing',
  add column if not exists location text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.private_profiles
  add column if not exists show_unit boolean not null default true,
  add column if not exists show_phone boolean not null default true,
  add column if not exists show_activity boolean not null default true,
  add column if not exists receive_texts boolean not null default true;

alter table public.notification_preferences
  add column if not exists notify_texts boolean not null default true;
