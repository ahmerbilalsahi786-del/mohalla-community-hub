-- Store uploaded image dimensions beside legacy URL columns so cards can render
-- crop-safe, Facebook-style layouts across every postable surface.

alter table public.posts
  add column if not exists image_meta jsonb[] not null default '{}'::jsonb[];

alter table public.events
  add column if not exists cover_image_meta jsonb,
  add column if not exists gallery_urls text[] not null default '{}'::text[],
  add column if not exists gallery_meta jsonb[] not null default '{}'::jsonb[];

alter table public.safety_alerts
  add column if not exists image_url text,
  add column if not exists image_urls text[] not null default '{}'::text[],
  add column if not exists image_meta jsonb[] not null default '{}'::jsonb[];

alter table public.listings
  add column if not exists image_meta jsonb[] not null default '{}'::jsonb[];

alter table public.places
  add column if not exists image_urls text[] not null default '{}'::text[],
  add column if not exists image_meta jsonb[] not null default '{}'::jsonb[];

alter table public.city_publications
  add column if not exists image_meta jsonb[] not null default '{}'::jsonb[];

update public.posts
set image_meta = array(
  select jsonb_build_object('url', url)
  from unnest(image_urls) as url
  where nullif(url, '') is not null
)
where coalesce(array_length(image_meta, 1), 0) = 0
  and coalesce(array_length(image_urls, 1), 0) > 0;

update public.listings
set image_meta = array(
  select jsonb_build_object('url', url)
  from unnest(image_urls) as url
  where nullif(url, '') is not null
)
where coalesce(array_length(image_meta, 1), 0) = 0
  and coalesce(array_length(image_urls, 1), 0) > 0;

update public.events
set cover_image_meta = jsonb_build_object('url', image_url)
where cover_image_meta is null
  and nullif(image_url, '') is not null;

update public.safety_alerts
set image_urls = array[image_url]
where coalesce(array_length(image_urls, 1), 0) = 0
  and nullif(image_url, '') is not null;

update public.safety_alerts
set image_meta = array(
  select jsonb_build_object('url', url)
  from unnest(image_urls) as url
  where nullif(url, '') is not null
)
where coalesce(array_length(image_meta, 1), 0) = 0
  and coalesce(array_length(image_urls, 1), 0) > 0;

update public.places
set image_meta = array(
  select jsonb_build_object('url', url)
  from unnest(image_urls) as url
  where nullif(url, '') is not null
)
where coalesce(array_length(image_meta, 1), 0) = 0
  and coalesce(array_length(image_urls, 1), 0) > 0;

update public.city_publications
set image_meta = array[jsonb_build_object('url', image_url)]
where coalesce(array_length(image_meta, 1), 0) = 0
  and nullif(image_url, '') is not null;
