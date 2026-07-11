alter table public.safety_alerts
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

create index if not exists safety_alerts_community_map_idx
  on public.safety_alerts (community_id, created_at desc)
  where latitude is not null and longitude is not null;

grant select, insert, update on table public.safety_alerts to authenticated;

notify pgrst, 'reload schema';
