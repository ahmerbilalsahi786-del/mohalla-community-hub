create or replace function public.search_joinable_communities(
  search_name text default null,
  search_area text default null,
  search_city text default null
)
returns table (
  id uuid,
  name text,
  area text,
  city text
)
language sql
stable
security definer
set search_path = ''
as $$
  with args as (
    select
      nullif(trim(search_name), '') as q_name,
      nullif(trim(search_area), '') as q_area,
      nullif(trim(search_city), '') as q_city
  )
  select
    c.id,
    c.name,
    coalesce(c.description, '') as area,
    coalesce(c.welcome_message, '') as city
  from public.community_settings c
  cross join args a
  where c.status = 'approved'
    and (a.q_name is not null or a.q_area is not null or a.q_city is not null)
    and (a.q_name is null or c.name ilike '%' || a.q_name || '%')
    and (a.q_area is null or coalesce(c.description, '') ilike '%' || a.q_area || '%')
    and (a.q_city is null or coalesce(c.welcome_message, '') ilike '%' || a.q_city || '%')
  order by
    case
      when a.q_name is not null
        and lower(c.name) = lower(a.q_name)
        and (a.q_area is null or lower(coalesce(c.description, '')) = lower(a.q_area))
        and (a.q_city is null or lower(coalesce(c.welcome_message, '')) = lower(a.q_city))
      then 0
      when a.q_name is not null
        and lower(c.name) = lower(a.q_name)
        and (a.q_area is null or lower(coalesce(c.description, '')) = lower(a.q_area))
      then 1
      when a.q_name is not null
        and lower(c.name) = lower(a.q_name)
      then 2
      else 3
    end,
    c.name asc,
    coalesce(c.description, '') asc,
    coalesce(c.welcome_message, '') asc
  limit 8;
$$;

revoke execute on function public.search_joinable_communities(text, text, text) from public;
grant execute on function public.search_joinable_communities(text, text, text) to anon, authenticated;
