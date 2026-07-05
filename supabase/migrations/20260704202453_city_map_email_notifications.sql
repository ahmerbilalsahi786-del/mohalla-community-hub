alter table public.community_settings
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.safety_alerts
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.city_publications
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

create index if not exists community_settings_city_map_idx
on public.community_settings (lower(trim(welcome_message)), status)
where latitude is not null and longitude is not null;

create index if not exists city_publications_city_map_idx
on public.city_publications (lower(trim(city)), is_active)
where latitude is not null and longitude is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_community uuid;
  requested_name text;
  requested_latitude numeric;
  requested_longitude numeric;
  registration_type text;
  invite_community_raw text;
  invite_community_id uuid;
  is_community_admin_request boolean;
begin
  registration_type := coalesce(new.raw_user_meta_data->>'registration_type', '');
  requested_name := nullif(trim(coalesce(new.raw_user_meta_data->>'community_name', '')), '');
  invite_community_raw := nullif(trim(coalesce(new.raw_user_meta_data->>'join_community_id', '')), '');

  if nullif(trim(coalesce(new.raw_user_meta_data->>'community_latitude', '')), '') ~ '^-?[0-9]+(\.[0-9]+)?$' then
    requested_latitude := (new.raw_user_meta_data->>'community_latitude')::numeric;
  end if;

  if nullif(trim(coalesce(new.raw_user_meta_data->>'community_longitude', '')), '') ~ '^-?[0-9]+(\.[0-9]+)?$' then
    requested_longitude := (new.raw_user_meta_data->>'community_longitude')::numeric;
  end if;

  if registration_type = 'member' then
    if invite_community_raw is null or invite_community_raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'This community invite is invalid.';
    end if;

    invite_community_id := invite_community_raw::uuid;

    select id into requested_community
    from public.community_settings
    where id = invite_community_id
      and status = 'approved'
    limit 1;

    if requested_community is null then
      raise exception 'This community invite is no longer available.';
    end if;
  elsif requested_name is not null then
    insert into public.community_settings (
      name,
      description,
      welcome_message,
      latitude,
      longitude,
      rules,
      status,
      requested_by_user_id,
      requested_by_email
    )
    values (
      requested_name,
      nullif(trim(coalesce(new.raw_user_meta_data->>'community_area', '')), ''),
      nullif(trim(coalesce(new.raw_user_meta_data->>'community_city', '')), ''),
      requested_latitude,
      requested_longitude,
      'Be respectful. Keep posts relevant. Use safety alerts responsibly.',
      'pending',
      null,
      new.email
    )
    returning id into requested_community;
  else
    select id into requested_community
    from public.community_settings
    where status = 'approved'
    order by created_at nulls last, id
    limit 1;
  end if;

  is_community_admin_request := requested_name is not null and registration_type <> 'member';

  insert into public.profiles (id, email, display_name, full_name, unit_number, membership_status, community_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'unit_number',
    'pending',
    requested_community
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    unit_number = coalesce(excluded.unit_number, public.profiles.unit_number),
    community_id = case
      when registration_type = 'member' then excluded.community_id
      else coalesce(excluded.community_id, public.profiles.community_id)
    end,
    membership_status = case
      when registration_type = 'member' then 'pending'
      else public.profiles.membership_status
    end,
    is_verified = case
      when registration_type = 'member' then false
      else public.profiles.is_verified
    end,
    updated_at = now();

  if is_community_admin_request then
    update public.community_settings
    set requested_by_user_id = new.id
    where id = requested_community;
  end if;

  insert into public.private_profiles (id, phone, whatsapp_number)
  values (new.id, new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'whatsapp_number')
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case when is_community_admin_request then 'admin'::public.app_role else 'user'::public.app_role end
  )
  on conflict (user_id, role) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
