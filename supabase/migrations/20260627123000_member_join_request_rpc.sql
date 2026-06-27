create or replace function public.request_member_join(
  invited_community_id uuid,
  requested_username text default null,
  requested_full_name text default null,
  requested_unit_number text default null
)
returns table (
  id uuid,
  community_id uuid,
  membership_status text,
  is_verified boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  actor_email text;
begin
  actor_id := auth.uid();
  if actor_id is null then
    raise exception 'Sign in before requesting to join a community.';
  end if;

  if invited_community_id is null then
    raise exception 'This community invite is invalid.';
  end if;

  if not exists (
    select 1
    from public.community_settings c
    where c.id = invited_community_id
      and c.status = 'approved'
  ) then
    raise exception 'This community invite is no longer available.';
  end if;

  select email into actor_email
  from auth.users
  where id = actor_id;

  insert into public.profiles (
    id,
    email,
    display_name,
    full_name,
    unit_number,
    membership_status,
    is_verified,
    community_id,
    updated_at
  )
  values (
    actor_id,
    actor_email,
    nullif(trim(coalesce(requested_username, '')), ''),
    nullif(trim(coalesce(requested_full_name, '')), ''),
    nullif(trim(coalesce(requested_unit_number, '')), ''),
    'pending',
    false,
    invited_community_id,
    now()
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    unit_number = coalesce(excluded.unit_number, public.profiles.unit_number),
    membership_status = 'pending',
    is_verified = false,
    community_id = excluded.community_id,
    updated_at = now();

  insert into public.private_profiles (id)
  values (actor_id)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (actor_id, 'user'::public.app_role)
  on conflict (user_id, role) do nothing;

  insert into public.notification_preferences (user_id)
  values (actor_id)
  on conflict (user_id) do nothing;

  return query
  select p.id, p.community_id, p.membership_status, p.is_verified
  from public.profiles p
  where p.id = actor_id;
end;
$$;

revoke execute on function public.request_member_join(uuid, text, text, text) from public, anon;
grant execute on function public.request_member_join(uuid, text, text, text) to authenticated;

create or replace function public.my_member_status()
returns table (
  id uuid,
  email text,
  display_name text,
  full_name text,
  unit_number text,
  membership_status text,
  is_verified boolean,
  community_id uuid,
  community_name text,
  community_area text,
  community_city text,
  community_status text,
  logo_url text,
  rejection_reason text,
  suspended_reason text,
  theme_primary_color text,
  theme_secondary_color text,
  theme_background_color text,
  theme_banner_color text,
  theme_sidebar_color text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    coalesce(p.email, u.email) as email,
    p.display_name,
    p.full_name,
    p.unit_number,
    p.membership_status,
    p.is_verified,
    p.community_id,
    c.name as community_name,
    c.description as community_area,
    c.welcome_message as community_city,
    c.status as community_status,
    c.logo_url,
    c.rejection_reason,
    c.suspended_reason,
    c.theme_primary_color,
    c.theme_secondary_color,
    c.theme_background_color,
    c.theme_banner_color,
    c.theme_sidebar_color
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.community_settings c on c.id = p.community_id
  where p.id = auth.uid()
  limit 1
$$;

revoke execute on function public.my_member_status() from public, anon;
grant execute on function public.my_member_status() to authenticated;
