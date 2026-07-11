alter table public.city_publications
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

create index if not exists city_publications_city_map_idx
on public.city_publications (lower(trim(city)), is_active)
where latitude is not null and longitude is not null;

grant select, insert, update, delete on table public.city_publications to authenticated;
notify pgrst, 'reload schema';
