alter table public.community_settings
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.listings
  add column if not exists listing_kind text not null default 'listing',
  add column if not exists location text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.listings
  drop constraint if exists listings_listing_kind_check;
alter table public.listings
  add constraint listings_listing_kind_check
  check (listing_kind in ('listing', 'shop'));

create index if not exists listings_community_kind_created_idx
  on public.listings (community_id, listing_kind, created_at desc);

grant select, insert, update, delete on table public.listings to authenticated;
grant select, update on table public.community_settings to authenticated;

notify pgrst, 'reload schema';
