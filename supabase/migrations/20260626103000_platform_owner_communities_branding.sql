do $$
begin
  alter type public.app_role add value if not exists 'super_admin';
exception
  when duplicate_object then null;
end $$;

alter table public.community_settings
  add column if not exists status text not null default 'pending',
  add column if not exists logo_url text,
  add column if not exists theme_primary_color text not null default '#1B5E20',
  add column if not exists theme_secondary_color text not null default '#0288D1',
  add column if not exists theme_background_color text not null default '#FAFDF8',
  add column if not exists theme_banner_color text not null default '#FFFFFF',
  add column if not exists theme_sidebar_color text not null default '#FFFFFF',
  add column if not exists requested_by_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists requested_by_email text,
  add column if not exists approved_by_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists suspended_reason text,
  add column if not exists created_at timestamptz not null default now();

alter table public.community_settings
  drop constraint if exists community_settings_status_check;
alter table public.community_settings
  add constraint community_settings_status_check
  check (status in ('pending', 'approved', 'rejected', 'suspended'));

alter table public.profiles
  add column if not exists community_id uuid references public.community_settings(id) on delete set null,
  add column if not exists email text;

create index if not exists community_settings_status_created_idx
on public.community_settings (status, created_at desc);
create index if not exists profiles_community_status_idx
on public.profiles (community_id, membership_status);

create or replace function public.enforce_single_super_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role::text = 'super_admin'
    and exists (
      select 1
      from public.user_roles
      where role::text = 'super_admin'
        and user_id is distinct from new.user_id
    )
  then
    raise exception 'Only one super admin is allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists user_roles_single_super_admin on public.user_roles;
create trigger user_roles_single_super_admin
before insert or update on public.user_roles
for each row execute function public.enforce_single_super_admin();

update public.community_settings
set status = 'approved'
where status = 'pending'
  and requested_by_user_id is null;

update public.profiles
set community_id = (select id from public.community_settings order by created_at nulls last, id limit 1)
where community_id is null
  and exists (select 1 from public.community_settings);

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

alter table public.posts add column if not exists community_id uuid references public.community_settings(id) on delete cascade;
alter table public.listings add column if not exists community_id uuid references public.community_settings(id) on delete cascade;
alter table public.safety_alerts add column if not exists community_id uuid references public.community_settings(id) on delete cascade;
alter table public.events add column if not exists community_id uuid references public.community_settings(id) on delete cascade;
alter table public.polls add column if not exists community_id uuid references public.community_settings(id) on delete cascade;
alter table public.places add column if not exists community_id uuid references public.community_settings(id) on delete cascade;
alter table public.volunteer_opportunities add column if not exists community_id uuid references public.community_settings(id) on delete cascade;
alter table public.moderation_reports add column if not exists community_id uuid references public.community_settings(id) on delete cascade;

update public.posts set community_id = (select community_id from public.profiles where profiles.id = posts.user_id) where community_id is null;
update public.listings set community_id = (select community_id from public.profiles where profiles.id = listings.user_id) where community_id is null;
update public.safety_alerts set community_id = (select community_id from public.profiles where profiles.id = safety_alerts.user_id) where community_id is null;
update public.events set community_id = (select community_id from public.profiles where profiles.id = events.user_id) where community_id is null;
update public.polls set community_id = (select community_id from public.profiles where profiles.id = polls.user_id) where community_id is null;
update public.places set community_id = (select id from public.community_settings order by created_at nulls last, id limit 1) where community_id is null;
update public.volunteer_opportunities set community_id = (select id from public.community_settings order by created_at nulls last, id limit 1) where community_id is null;
update public.moderation_reports set community_id = (select community_id from public.profiles where profiles.id = moderation_reports.reporter_id) where community_id is null;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text = 'super_admin'
  )
$$;

create or replace function public.my_community_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select community_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_community_is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.community_settings c on c.id = p.community_id
    where p.id = auth.uid()
      and p.membership_status = 'approved'
      and c.status = 'approved'
  )
$$;

create or replace function public.is_approved_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin() or public.my_community_is_approved()
$$;

create or replace function public.can_manage_community()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin() or exists (
    select 1
    from public.user_roles r
    join public.profiles p on p.id = r.user_id
    join public.community_settings c on c.id = p.community_id
    where r.user_id = auth.uid()
      and r.role::text in ('admin', 'moderator')
      and p.membership_status = 'approved'
      and c.status = 'approved'
  )
$$;

create or replace function public.can_manage_own_community()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles r
    join public.profiles p on p.id = r.user_id
    join public.community_settings c on c.id = p.community_id
    where r.user_id = auth.uid()
      and r.role::text in ('admin', 'moderator')
      and p.membership_status = 'approved'
      and c.status = 'approved'
  )
$$;

revoke execute on function public.is_super_admin() from public, anon;
revoke execute on function public.my_community_id() from public, anon;
revoke execute on function public.my_community_is_approved() from public, anon;
revoke execute on function public.can_manage_own_community() from public, anon;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.my_community_id() to authenticated;
grant execute on function public.my_community_is_approved() to authenticated;
grant execute on function public.can_manage_own_community() to authenticated;

create or replace function public.set_row_community_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.community_id is null then
    new.community_id := public.my_community_id();
  end if;
  return new;
end;
$$;

drop trigger if exists posts_set_community on public.posts;
create trigger posts_set_community before insert on public.posts for each row execute function public.set_row_community_id();
drop trigger if exists listings_set_community on public.listings;
create trigger listings_set_community before insert on public.listings for each row execute function public.set_row_community_id();
drop trigger if exists alerts_set_community on public.safety_alerts;
create trigger alerts_set_community before insert on public.safety_alerts for each row execute function public.set_row_community_id();
drop trigger if exists events_set_community on public.events;
create trigger events_set_community before insert on public.events for each row execute function public.set_row_community_id();
drop trigger if exists polls_set_community on public.polls;
create trigger polls_set_community before insert on public.polls for each row execute function public.set_row_community_id();
drop trigger if exists places_set_community on public.places;
create trigger places_set_community before insert on public.places for each row execute function public.set_row_community_id();
drop trigger if exists volunteer_set_community on public.volunteer_opportunities;
create trigger volunteer_set_community before insert on public.volunteer_opportunities for each row execute function public.set_row_community_id();
drop trigger if exists moderation_reports_set_community on public.moderation_reports;
create trigger moderation_reports_set_community before insert on public.moderation_reports for each row execute function public.set_row_community_id();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_community uuid;
  requested_name text;
begin
  requested_name := nullif(trim(coalesce(new.raw_user_meta_data->>'community_name', '')), '');

  if requested_name is not null then
    insert into public.community_settings (
      name,
      description,
      welcome_message,
      rules,
      status,
      requested_by_user_id,
      requested_by_email
    )
    values (
      requested_name,
      nullif(trim(coalesce(new.raw_user_meta_data->>'community_area', '')), ''),
      nullif(trim(coalesce(new.raw_user_meta_data->>'community_city', '')), ''),
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

  insert into public.profiles (id, email, display_name, full_name, unit_number, membership_status, community_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'unit_number',
    case when requested_name is not null then 'pending' else 'pending' end,
    requested_community
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    unit_number = coalesce(excluded.unit_number, public.profiles.unit_number),
    community_id = coalesce(excluded.community_id, public.profiles.community_id),
    updated_at = now();

  if requested_name is not null then
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
    case when requested_name is not null then 'admin'::public.app_role else 'user'::public.app_role end
  )
  on conflict (user_id, role) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.platform_update_community_status(
  target_community uuid,
  requested_status text,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_name text;
  requester uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Super admin access required';
  end if;

  if requested_status not in ('approved', 'rejected', 'suspended') then
    raise exception 'Unsupported community status';
  end if;

  if requested_status in ('rejected', 'suspended') and nullif(trim(coalesce(reason, '')), '') is null then
    raise exception 'Reason is required';
  end if;

  select name, requested_by_user_id into target_name, requester
  from public.community_settings
  where id = target_community;

  update public.community_settings
  set
    status = requested_status,
    approved_by_user_id = case when requested_status = 'approved' then auth.uid() else approved_by_user_id end,
    approved_at = case when requested_status = 'approved' then now() else approved_at end,
    rejection_reason = case when requested_status = 'rejected' then reason else null end,
    suspended_reason = case when requested_status = 'suspended' then reason else null end,
    updated_at = now()
  where id = target_community;

  if requested_status = 'approved' then
    update public.profiles
    set membership_status = 'approved', is_verified = true, updated_at = now()
    where id = requester;
  end if;

  if requester is not null then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      requester,
      'community_status',
      case
        when requested_status = 'approved' then 'Community approved'
        when requested_status = 'rejected' then 'Community request rejected'
        else 'Community suspended'
      end,
      case
        when requested_status = 'approved' then 'Your community ' || coalesce(target_name, 'Mohalla') || ' has been approved on Mohalla. Log in to get started.'
        when requested_status = 'rejected' then 'Your community request was rejected. Reason: ' || reason
        else 'Your community has been suspended. Reason: ' || reason
      end,
      jsonb_build_object('communityId', target_community, 'status', requested_status)
    );
  end if;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id, details)
  values (
    auth.uid(),
    'community_' || requested_status,
    'community',
    target_community::text,
    jsonb_build_object('reason', reason)
  );
end;
$$;

revoke execute on function public.platform_update_community_status(uuid, text, text) from public, anon;
grant execute on function public.platform_update_community_status(uuid, text, text) to authenticated;

create or replace function public.protect_community_settings_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_super_admin() then
    return new;
  end if;

  if new.status is distinct from old.status
    or new.requested_by_user_id is distinct from old.requested_by_user_id
    or new.requested_by_email is distinct from old.requested_by_email
    or new.approved_by_user_id is distinct from old.approved_by_user_id
    or new.approved_at is distinct from old.approved_at
    or new.rejection_reason is distinct from old.rejection_reason
    or new.suspended_reason is distinct from old.suspended_reason
  then
    raise exception 'Only the platform owner can change community approval status';
  end if;

  return new;
end;
$$;

drop trigger if exists community_settings_protect_status_fields on public.community_settings;
create trigger community_settings_protect_status_fields
before update on public.community_settings
for each row execute function public.protect_community_settings_update();

create or replace function public.admin_manage_member(
  target_user uuid,
  requested_action text,
  requested_role public.app_role default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_community uuid;
  target_community uuid;
begin
  if not public.can_manage_community() then
    raise exception 'Administrator access required';
  end if;

  actor_community := public.my_community_id();
  select community_id into target_community from public.profiles where id = target_user;

  if not public.is_super_admin() and target_community is distinct from actor_community then
    raise exception 'You can only manage members in your own community';
  end if;

  if target_user = auth.uid() and requested_action in ('reject', 'remove') then
    raise exception 'You cannot remove your own membership';
  end if;

  if requested_action = 'approve' then
    update public.profiles
    set membership_status = 'approved', is_verified = true, updated_at = now()
    where id = target_user;
    insert into public.notifications (user_id, type, title, body, data)
    select target_user, 'approved', 'Membership approved', 'Your Mohalla membership has been approved.', jsonb_build_object('link', '/')
    where coalesce((select notify_approvals from public.notification_preferences where user_id = target_user), true);
  elsif requested_action = 'reject' then
    update public.profiles
    set membership_status = 'rejected', is_verified = false, updated_at = now()
    where id = target_user;
  elsif requested_action = 'verify' then
    update public.profiles
    set is_verified = not is_verified, updated_at = now()
    where id = target_user;
  elsif requested_action = 'role' then
    if requested_role is null then
      raise exception 'Role is required';
    end if;
    if requested_role::text = 'super_admin' then
      raise exception 'Use the platform owner setup step for super admin access';
    end if;
    if requested_role::text = 'admin' and not public.has_role(auth.uid(), 'admin') and not public.is_super_admin() then
      raise exception 'Only administrators can grant administrator access';
    end if;
    delete from public.user_roles where user_id = target_user;
    insert into public.user_roles (user_id, role) values (target_user, requested_role);
  elsif requested_action = 'remove' then
    delete from auth.users where id = target_user;
  else
    raise exception 'Unsupported member action';
  end if;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id, details)
  values (
    auth.uid(),
    requested_action,
    'member',
    target_user::text,
    jsonb_build_object('role', requested_role)
  );
end;
$$;

create or replace function public.admin_moderate_post(
  target_post uuid,
  requested_action text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_community uuid;
begin
  if not public.can_manage_community() then
    raise exception 'Administrator access required';
  end if;

  select community_id into target_community from public.posts where id = target_post;
  if not public.is_super_admin() and target_community is distinct from public.my_community_id() then
    raise exception 'You can only moderate posts in your own community';
  end if;

  if requested_action = 'delete' then
    delete from public.posts where id = target_post;
  elsif requested_action = 'toggle_pin' then
    update public.posts
    set is_pinned = not coalesce(is_pinned, false), updated_at = now()
    where id = target_post;
  else
    raise exception 'Unsupported post action';
  end if;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id)
  values (auth.uid(), requested_action, 'post', target_post::text);
end;
$$;

create or replace function public.admin_update_report(
  target_report uuid,
  requested_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_community uuid;
begin
  if not public.can_manage_community() then
    raise exception 'Administrator access required';
  end if;
  if requested_status not in ('reviewing', 'resolved', 'dismissed') then
    raise exception 'Unsupported report status';
  end if;

  select community_id into target_community from public.moderation_reports where id = target_report;
  if not public.is_super_admin() and target_community is distinct from public.my_community_id() then
    raise exception 'You can only update reports in your own community';
  end if;

  update public.moderation_reports
  set status = requested_status, reviewed_by = auth.uid(), reviewed_at = now()
  where id = target_report;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id)
  values (auth.uid(), requested_status, 'report', target_report::text);
end;
$$;

drop policy if exists "Community settings are readable" on public.community_settings;
drop policy if exists "Approved members can read community settings" on public.community_settings;
create policy "Members read own approved community and super admins read all"
on public.community_settings for select to authenticated
using (
  public.is_super_admin()
  or (id = public.my_community_id())
);

drop policy if exists "Admins can manage community settings" on public.community_settings;
create policy "Admins update own community branding"
on public.community_settings for update to authenticated
using (
  public.is_super_admin()
  or (id = public.my_community_id() and public.can_manage_own_community())
)
with check (
  public.is_super_admin()
  or (id = public.my_community_id() and public.can_manage_own_community())
);

drop policy if exists "Approved members can read profiles" on public.profiles;
create policy "Approved members read same community profiles"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.is_super_admin()
  or (community_id = public.my_community_id() and public.my_community_is_approved())
);

drop policy if exists "Users and admins can read private profiles" on public.private_profiles;
create policy "Users and community admins can read scoped private profiles"
on public.private_profiles for select to authenticated
using (
  id = auth.uid()
  or public.is_super_admin()
  or (
    public.can_manage_own_community()
    and exists (
      select 1 from public.profiles p
      where p.id = private_profiles.id
        and p.community_id = public.my_community_id()
    )
  )
);

drop policy if exists "Approved members can read roles" on public.user_roles;
create policy "Roles are scoped to self community and super admin"
on public.user_roles for select to authenticated
using (
  user_id = auth.uid()
  or public.is_super_admin()
  or exists (
    select 1 from public.profiles p
    where p.id = user_roles.user_id
      and p.community_id = public.my_community_id()
      and public.my_community_is_approved()
  )
);

drop policy if exists "Approved members can read posts" on public.posts;
create policy "Approved community members can read posts"
on public.posts for select to authenticated
using (public.is_super_admin() or (community_id = public.my_community_id() and public.my_community_is_approved()));
drop policy if exists "Approved members can create own posts" on public.posts;
create policy "Approved community members can create posts"
on public.posts for insert to authenticated
with check (user_id = auth.uid() and public.my_community_is_approved());

drop policy if exists "Approved members can read listings" on public.listings;
create policy "Approved community members can read listings"
on public.listings for select to authenticated
using (public.is_super_admin() or (community_id = public.my_community_id() and public.my_community_is_approved()));
drop policy if exists "Approved members can create listings" on public.listings;
create policy "Approved community members can create listings"
on public.listings for insert to authenticated
with check (user_id = auth.uid() and public.my_community_is_approved());

drop policy if exists "Approved members can read safety alerts" on public.safety_alerts;
create policy "Approved community members can read safety alerts"
on public.safety_alerts for select to authenticated
using (public.is_super_admin() or (community_id = public.my_community_id() and public.my_community_is_approved()));
drop policy if exists "Approved members can create safety alerts" on public.safety_alerts;
create policy "Approved community members can create safety alerts"
on public.safety_alerts for insert to authenticated
with check (user_id = auth.uid() and public.my_community_is_approved());

drop policy if exists "Approved members can read events" on public.events;
create policy "Approved community members can read events"
on public.events for select to authenticated
using (public.is_super_admin() or (community_id = public.my_community_id() and public.my_community_is_approved()));
drop policy if exists "Approved members can create events" on public.events;
create policy "Approved community members can create events"
on public.events for insert to authenticated
with check (user_id = auth.uid() and public.my_community_is_approved());

drop policy if exists "Approved members can read polls" on public.polls;
create policy "Approved community members can read polls"
on public.polls for select to authenticated
using (public.is_super_admin() or (community_id = public.my_community_id() and public.my_community_is_approved()));
drop policy if exists "Approved members can create polls" on public.polls;
create policy "Approved community members can create polls"
on public.polls for insert to authenticated
with check (user_id = auth.uid() and public.my_community_is_approved());

drop policy if exists "Owners can update posts" on public.posts;
create policy "Owners can update posts in approved communities"
on public.posts for update to authenticated
using (public.is_super_admin() or (user_id = auth.uid() and community_id = public.my_community_id() and public.my_community_is_approved()))
with check (public.is_super_admin() or (user_id = auth.uid() and community_id = public.my_community_id() and public.my_community_is_approved()));
drop policy if exists "Owners can delete posts" on public.posts;
create policy "Owners can delete posts in approved communities"
on public.posts for delete to authenticated
using (public.is_super_admin() or (user_id = auth.uid() and community_id = public.my_community_id() and public.my_community_is_approved()));

drop policy if exists "Owners can update listings" on public.listings;
create policy "Owners can update listings in approved communities"
on public.listings for update to authenticated
using (public.is_super_admin() or (user_id = auth.uid() and community_id = public.my_community_id() and public.my_community_is_approved()))
with check (public.is_super_admin() or (user_id = auth.uid() and community_id = public.my_community_id() and public.my_community_is_approved()));
drop policy if exists "Owners can delete listings" on public.listings;
create policy "Owners can delete listings in approved communities"
on public.listings for delete to authenticated
using (public.is_super_admin() or (user_id = auth.uid() and community_id = public.my_community_id() and public.my_community_is_approved()));

drop policy if exists "Owners and admins can update safety alerts" on public.safety_alerts;
create policy "Owners and admins update safety alerts in approved communities"
on public.safety_alerts for update to authenticated
using (public.is_super_admin() or (community_id = public.my_community_id() and public.my_community_is_approved() and (user_id = auth.uid() or public.can_manage_own_community())))
with check (public.is_super_admin() or (community_id = public.my_community_id() and public.my_community_is_approved() and (user_id = auth.uid() or public.can_manage_own_community())));

drop policy if exists "Owners can update events" on public.events;
create policy "Owners can update events in approved communities"
on public.events for update to authenticated
using (public.is_super_admin() or (user_id = auth.uid() and community_id = public.my_community_id() and public.my_community_is_approved()))
with check (public.is_super_admin() or (user_id = auth.uid() and community_id = public.my_community_id() and public.my_community_is_approved()));
drop policy if exists "Owners can delete events" on public.events;
create policy "Owners can delete events in approved communities"
on public.events for delete to authenticated
using (public.is_super_admin() or (user_id = auth.uid() and community_id = public.my_community_id() and public.my_community_is_approved()));

drop policy if exists "Owners can update polls" on public.polls;
create policy "Owners can update polls in approved communities"
on public.polls for update to authenticated
using (public.is_super_admin() or (user_id = auth.uid() and community_id = public.my_community_id() and public.my_community_is_approved()))
with check (public.is_super_admin() or (user_id = auth.uid() and community_id = public.my_community_id() and public.my_community_is_approved()));

drop policy if exists "Approved members can read comments" on public.comments;
create policy "Approved community members can read comments"
on public.comments for select to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1 from public.posts p
    where p.id = comments.post_id
      and p.community_id = public.my_community_id()
      and public.my_community_is_approved()
  )
);
drop policy if exists "Approved members can create own comments" on public.comments;
create policy "Approved community members can create comments"
on public.comments for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.posts p
    where p.id = comments.post_id
      and p.community_id = public.my_community_id()
      and public.my_community_is_approved()
  )
);
drop policy if exists "Owners can update comments" on public.comments;
create policy "Owners can update comments in approved communities"
on public.comments for update to authenticated
using (
  public.is_super_admin()
  or (
    user_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = comments.post_id and p.community_id = public.my_community_id() and public.my_community_is_approved())
  )
)
with check (
  public.is_super_admin()
  or (
    user_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = comments.post_id and p.community_id = public.my_community_id() and public.my_community_is_approved())
  )
);
drop policy if exists "Owners can delete comments" on public.comments;
create policy "Owners can delete comments in approved communities"
on public.comments for delete to authenticated
using (
  public.is_super_admin()
  or (
    user_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = comments.post_id and p.community_id = public.my_community_id() and public.my_community_is_approved())
  )
);

drop policy if exists "Approved members can read likes" on public.post_likes;
create policy "Approved community members can read likes"
on public.post_likes for select to authenticated
using (
  public.is_super_admin()
  or exists (select 1 from public.posts p where p.id = post_likes.post_id and p.community_id = public.my_community_id() and public.my_community_is_approved())
);
drop policy if exists "Approved members can like as themselves" on public.post_likes;
create policy "Approved community members can like as themselves"
on public.post_likes for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.posts p where p.id = post_likes.post_id and p.community_id = public.my_community_id() and public.my_community_is_approved())
);

drop policy if exists "Approved members can read RSVPs" on public.event_rsvps;
create policy "Approved community members can read RSVPs"
on public.event_rsvps for select to authenticated
using (
  public.is_super_admin()
  or exists (select 1 from public.events e where e.id = event_rsvps.event_id and e.community_id = public.my_community_id() and public.my_community_is_approved())
);
drop policy if exists "Approved members can create RSVPs" on public.event_rsvps;
create policy "Approved community members can create RSVPs"
on public.event_rsvps for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.events e where e.id = event_rsvps.event_id and e.community_id = public.my_community_id() and public.my_community_is_approved())
);
drop policy if exists "Users can update own RSVPs" on public.event_rsvps;
create policy "Users update own RSVPs in approved communities"
on public.event_rsvps for update to authenticated
using (
  user_id = auth.uid()
  and exists (select 1 from public.events e where e.id = event_rsvps.event_id and e.community_id = public.my_community_id() and public.my_community_is_approved())
)
with check (
  user_id = auth.uid()
  and exists (select 1 from public.events e where e.id = event_rsvps.event_id and e.community_id = public.my_community_id() and public.my_community_is_approved())
);

drop policy if exists "Approved members can read poll options" on public.poll_options;
create policy "Approved community members can read poll options"
on public.poll_options for select to authenticated
using (
  public.is_super_admin()
  or exists (select 1 from public.polls p where p.id = poll_options.poll_id and p.community_id = public.my_community_id() and public.my_community_is_approved())
);

drop policy if exists "Approved members can read poll votes" on public.poll_votes;
create policy "Approved community members can read poll votes"
on public.poll_votes for select to authenticated
using (
  public.is_super_admin()
  or exists (select 1 from public.polls p where p.id = poll_votes.poll_id and p.community_id = public.my_community_id() and public.my_community_is_approved())
);
drop policy if exists "Approved members can vote as themselves" on public.poll_votes;
create policy "Approved community members can vote as themselves"
on public.poll_votes for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.polls p where p.id = poll_votes.poll_id and p.community_id = public.my_community_id() and public.my_community_is_approved())
);
drop policy if exists "Users can remove own likes" on public.post_likes;
create policy "Users remove own likes in approved communities"
on public.post_likes for delete to authenticated
using (
  user_id = auth.uid()
  and exists (select 1 from public.posts p where p.id = post_likes.post_id and p.community_id = public.my_community_id() and public.my_community_is_approved())
);

drop policy if exists "Users can create options for own polls" on public.poll_options;
create policy "Users create options for own polls in approved communities"
on public.poll_options for insert to authenticated
with check (
  exists (
    select 1 from public.polls p
    where p.id = poll_options.poll_id
      and p.user_id = auth.uid()
      and p.community_id = public.my_community_id()
      and public.my_community_is_approved()
  )
);

drop policy if exists "Approved members can read alert comments" on public.alert_comments;
create policy "Approved community members can read alert comments"
on public.alert_comments for select to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1 from public.safety_alerts a
    where a.id = alert_comments.alert_id
      and a.community_id = public.my_community_id()
      and public.my_community_is_approved()
  )
);
drop policy if exists "Approved members can create alert comments" on public.alert_comments;
create policy "Approved community members can create alert comments"
on public.alert_comments for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.safety_alerts a
    where a.id = alert_comments.alert_id
      and a.community_id = public.my_community_id()
      and public.my_community_is_approved()
  )
);

drop policy if exists "Approved members can read volunteer signups" on public.volunteer_signups;
create policy "Approved community members can read volunteer signups"
on public.volunteer_signups for select to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1 from public.volunteer_opportunities v
    where v.id = volunteer_signups.opportunity_id
      and v.community_id = public.my_community_id()
      and public.my_community_is_approved()
  )
);
drop policy if exists "Members manage own volunteer signups" on public.volunteer_signups;
create policy "Members manage own volunteer signups in approved communities"
on public.volunteer_signups for all to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.volunteer_opportunities v
    where v.id = volunteer_signups.opportunity_id
      and v.community_id = public.my_community_id()
      and public.my_community_is_approved()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.volunteer_opportunities v
    where v.id = volunteer_signups.opportunity_id
      and v.community_id = public.my_community_id()
      and public.my_community_is_approved()
  )
);

drop policy if exists "Approved members can read places" on public.places;
create policy "Approved community members can read places"
on public.places for select to authenticated
using (public.is_super_admin() or (community_id = public.my_community_id() and public.my_community_is_approved() and is_active));

drop policy if exists "Approved members can read volunteer opportunities" on public.volunteer_opportunities;
create policy "Approved community members can read volunteer opportunities"
on public.volunteer_opportunities for select to authenticated
using (public.is_super_admin() or (community_id = public.my_community_id() and public.my_community_is_approved() and is_active));

drop policy if exists "Users can create reports" on public.moderation_reports;
create policy "Approved community members can create reports"
on public.moderation_reports for insert to authenticated
with check (reporter_id = auth.uid() and public.my_community_is_approved());
drop policy if exists "Users and admins can read reports" on public.moderation_reports;
create policy "Users and community admins can read scoped reports"
on public.moderation_reports for select to authenticated
using (
  reporter_id = auth.uid()
  or public.is_super_admin()
  or (community_id = public.my_community_id() and public.can_manage_own_community())
);

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
on public.notifications for select to authenticated
using (user_id = auth.uid() or public.is_super_admin());
drop policy if exists "Super admins can create notifications" on public.notifications;
create policy "Super admins can create notifications"
on public.notifications for insert to authenticated
with check (public.is_super_admin());

drop policy if exists "Admins can read audit log" on public.admin_audit_log;
create policy "Admins can read scoped audit log"
on public.admin_audit_log for select to authenticated
using (public.is_super_admin() or public.can_manage_own_community());
