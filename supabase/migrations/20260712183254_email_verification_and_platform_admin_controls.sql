alter table public.profiles
  add column if not exists email_verified_at timestamptz,
  add column if not exists email_verification_token_hash text,
  add column if not exists email_verification_sent_at timestamptz,
  add column if not exists email_verification_expires_at timestamptz;

create index if not exists profiles_email_verification_token_idx
on public.profiles (email_verification_token_hash)
where email_verification_token_hash is not null;

update public.profiles p
set email_verified_at = coalesce(p.email_verified_at, p.created_at, now())
where p.email_verified_at is null
  and (
    p.membership_status = 'approved'
    or exists (
      select 1
      from public.user_roles r
      where r.user_id = p.id
        and r.role::text = 'super_admin'
    )
  );

create or replace function public.platform_remove_community_admin(
  target_community uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_name text;
  admin_user uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Super admin access required';
  end if;

  select name, requested_by_user_id
    into target_name, admin_user
  from public.community_settings
  where id = target_community;

  if target_name is null then
    raise exception 'Community not found';
  end if;

  if admin_user is null then
    raise exception 'This community does not have an assigned admin';
  end if;

  if exists (
    select 1
    from public.user_roles
    where user_id = admin_user
      and role::text = 'super_admin'
  ) then
    raise exception 'The platform owner cannot be removed as a community admin';
  end if;

  delete from public.user_roles
  where user_id = admin_user
    and role::text in ('admin', 'moderator');

  insert into public.user_roles (user_id, role)
  values (admin_user, 'user'::public.app_role)
  on conflict (user_id, role) do nothing;

  update public.community_settings
  set
    requested_by_user_id = null,
    requested_by_email = null,
    updated_at = now()
  where id = target_community;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    admin_user,
    'admin_removed',
    'Admin access removed',
    'Your administrator access for ' || coalesce(target_name, 'this society') || ' has been removed by Mohalla.',
    jsonb_build_object('communityId', target_community)
  );

  insert into public.admin_audit_log (actor_id, action, target_type, target_id, details)
  values (
    auth.uid(),
    'community_admin_removed',
    'community',
    target_community::text,
    jsonb_build_object('adminUserId', admin_user, 'communityName', target_name)
  );
end;
$$;

revoke execute on function public.platform_remove_community_admin(uuid) from public, anon;
grant execute on function public.platform_remove_community_admin(uuid) to authenticated;

create or replace function public.platform_delete_community(
  target_community uuid,
  confirm_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_name text;
begin
  if not public.is_super_admin() then
    raise exception 'Super admin access required';
  end if;

  select name
    into target_name
  from public.community_settings
  where id = target_community;

  if target_name is null then
    raise exception 'Community not found';
  end if;

  if trim(coalesce(confirm_name, '')) <> target_name then
    raise exception 'Type the society name exactly to delete it';
  end if;

  delete from public.user_roles r
  using public.profiles p
  where r.user_id = p.id
    and p.community_id = target_community
    and r.role::text in ('admin', 'moderator');

  insert into public.user_roles (user_id, role)
  select p.id, 'user'::public.app_role
  from public.profiles p
  where p.community_id = target_community
  on conflict (user_id, role) do nothing;

  update public.profiles
  set
    community_id = null,
    membership_status = 'rejected',
    is_verified = false,
    updated_at = now()
  where community_id = target_community;

  delete from public.community_settings
  where id = target_community;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id, details)
  values (
    auth.uid(),
    'community_deleted',
    'community',
    target_community::text,
    jsonb_build_object('communityName', target_name)
  );
end;
$$;

revoke execute on function public.platform_delete_community(uuid, text) from public, anon;
grant execute on function public.platform_delete_community(uuid, text) to authenticated;
