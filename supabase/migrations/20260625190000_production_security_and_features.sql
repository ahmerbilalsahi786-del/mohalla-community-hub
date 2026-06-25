alter table public.profiles
  add column if not exists membership_status text not null default 'pending';

update public.profiles
set membership_status = case when is_verified then 'approved' else 'pending' end
where membership_status not in ('pending', 'approved', 'rejected');

alter table public.profiles
  drop constraint if exists profiles_membership_status_check;
alter table public.profiles
  add constraint profiles_membership_status_check
  check (membership_status in ('pending', 'approved', 'rejected'));

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notify_comments boolean not null default true,
  notify_likes boolean not null default true,
  notify_safety boolean not null default true,
  notify_announcements boolean not null default true,
  notify_marketplace boolean not null default true,
  notify_approvals boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null default '',
  location text,
  hours text,
  phone text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.volunteer_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null default 'Community',
  schedule text not null,
  location text,
  capacity integer check (capacity is null or capacity > 0),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.volunteer_signups (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.volunteer_opportunities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (opportunity_id, user_id)
);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'listing', 'alert', 'profile')),
  target_id text not null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists posts_user_created_idx on public.posts (user_id, created_at desc);
create index if not exists comments_post_created_idx on public.comments (post_id, created_at);
create index if not exists listings_status_created_idx on public.listings (status, created_at desc);
create index if not exists alerts_resolved_created_idx on public.safety_alerts (is_resolved, created_at desc);
create index if not exists events_date_idx on public.events (event_date);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists reports_status_created_idx on public.moderation_reports (status, created_at desc);
create index if not exists volunteer_active_created_idx on public.volunteer_opportunities (is_active, created_at desc);

create or replace function public.is_approved_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and membership_status = 'approved'
  )
$$;

create or replace function public.can_manage_community()
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
      and role in ('admin', 'moderator')
  )
$$;

revoke execute on function public.is_approved_member() from public, anon;
revoke execute on function public.can_manage_community() from public, anon;
grant execute on function public.is_approved_member() to authenticated;
grant execute on function public.can_manage_community() to authenticated;

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
begin
  if not public.can_manage_community() then
    raise exception 'Administrator access required';
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
    if requested_role = 'admin' and not public.has_role(auth.uid(), 'admin') then
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
begin
  if not public.can_manage_community() then
    raise exception 'Administrator access required';
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
begin
  if not public.can_manage_community() then
    raise exception 'Administrator access required';
  end if;
  if requested_status not in ('reviewing', 'resolved', 'dismissed') then
    raise exception 'Unsupported report status';
  end if;

  update public.moderation_reports
  set status = requested_status, reviewed_by = auth.uid(), reviewed_at = now()
  where id = target_report;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id)
  values (auth.uid(), requested_status, 'report', target_report::text);
end;
$$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.admin_manage_member(uuid, text, public.app_role) from public, anon;
revoke execute on function public.admin_moderate_post(uuid, text) from public, anon;
revoke execute on function public.admin_update_report(uuid, text) from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.admin_manage_member(uuid, text, public.app_role) to authenticated;
grant execute on function public.admin_moderate_post(uuid, text) to authenticated;
grant execute on function public.admin_update_report(uuid, text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

create or replace function public.sync_post_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_post uuid;
begin
  target_post := coalesce(new.post_id, old.post_id);
  update public.posts
  set
    likes_count = (select count(*) from public.post_likes where post_id = target_post),
    comments_count = (select count(*) from public.comments where post_id = target_post),
    updated_at = now()
  where id = target_post;
  return coalesce(new, old);
end;
$$;

create or replace function public.sync_event_rsvp_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event uuid;
begin
  target_event := coalesce(new.event_id, old.event_id);
  update public.events
  set rsvp_count = (
    select count(*) from public.event_rsvps
    where event_id = target_event and status = 'going'
  ), updated_at = now()
  where id = target_event;
  return coalesce(new, old);
end;
$$;

create or replace function public.create_activity_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
  pref_enabled boolean;
begin
  if tg_table_name = 'comments' then
    select user_id into recipient from public.posts where id = new.post_id;
    select notify_comments into pref_enabled
    from public.notification_preferences where user_id = recipient;
    if recipient is distinct from new.user_id and coalesce(pref_enabled, true) then
      insert into public.notifications (user_id, type, title, body, data)
      values (recipient, 'comment', 'New comment', 'Someone commented on your post.', jsonb_build_object('link', '/feed'));
    end if;
  elsif tg_table_name = 'post_likes' then
    select user_id into recipient from public.posts where id = new.post_id;
    select notify_likes into pref_enabled
    from public.notification_preferences where user_id = recipient;
    if recipient is distinct from new.user_id and coalesce(pref_enabled, true) then
      insert into public.notifications (user_id, type, title, body, data)
      values (recipient, 'like', 'New like', 'Someone liked your post.', jsonb_build_object('link', '/feed'));
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists comments_sync_post_counts on public.comments;
create trigger comments_sync_post_counts
after insert or delete on public.comments
for each row execute function public.sync_post_counts();

drop trigger if exists likes_sync_post_counts on public.post_likes;
create trigger likes_sync_post_counts
after insert or delete on public.post_likes
for each row execute function public.sync_post_counts();

drop trigger if exists rsvps_sync_event_count on public.event_rsvps;
create trigger rsvps_sync_event_count
after insert or update or delete on public.event_rsvps
for each row execute function public.sync_event_rsvp_count();

drop trigger if exists comments_create_notification on public.comments;
create trigger comments_create_notification
after insert on public.comments
for each row execute function public.create_activity_notification();

drop trigger if exists likes_create_notification on public.post_likes;
create trigger likes_create_notification
after insert on public.post_likes
for each row execute function public.create_activity_notification();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, full_name, unit_number, membership_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'unit_number',
    case
      when not exists (select 1 from public.user_roles where role = 'admin') then 'approved'
      else 'pending'
    end
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    unit_number = coalesce(excluded.unit_number, public.profiles.unit_number),
    updated_at = now();

  insert into public.private_profiles (id, phone, whatsapp_number)
  values (new.id, new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'whatsapp_number')
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case
      when not exists (select 1 from public.user_roles where role = 'admin') then 'admin'::public.app_role
      else 'user'::public.app_role
    end
  )
  on conflict (user_id, role) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.notification_preferences enable row level security;
alter table public.places enable row level security;
alter table public.volunteer_opportunities enable row level security;
alter table public.volunteer_signups enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.user_blocks enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "Profiles are readable" on public.profiles;
drop policy if exists "Approved members can read profiles" on public.profiles;
create policy "Approved members can read profiles"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_approved_member() or public.can_manage_community());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can read own private profile" on public.private_profiles;
create policy "Users and admins can read private profiles"
on public.private_profiles for select to authenticated
using (id = auth.uid() or public.can_manage_community());

drop policy if exists "Users can insert own private profile" on public.private_profiles;
create policy "Users can insert own private profile"
on public.private_profiles for insert to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update own private profile" on public.private_profiles;
create policy "Users can update own private profile"
on public.private_profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Roles are readable" on public.user_roles;
create policy "Approved members can read roles"
on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.is_approved_member() or public.can_manage_community());

drop policy if exists "Community settings are readable" on public.community_settings;
create policy "Approved members can read community settings"
on public.community_settings for select to authenticated
using (public.is_approved_member() or public.can_manage_community());

drop policy if exists "Admins can manage community settings" on public.community_settings;
create policy "Admins can manage community settings"
on public.community_settings for all to authenticated
using (public.can_manage_community())
with check (public.can_manage_community());

drop policy if exists "Posts are readable" on public.posts;
create policy "Approved members can read posts"
on public.posts for select to authenticated
using (public.is_approved_member() or public.can_manage_community());
drop policy if exists "Users can create own posts" on public.posts;
create policy "Approved members can create own posts"
on public.posts for insert to authenticated
with check ((public.is_approved_member() or public.can_manage_community()) and user_id = auth.uid());
drop policy if exists "Users can update own posts" on public.posts;
create policy "Owners can update posts"
on public.posts for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
drop policy if exists "Users can delete own posts" on public.posts;
create policy "Owners can delete posts"
on public.posts for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "Comments are readable" on public.comments;
create policy "Approved members can read comments"
on public.comments for select to authenticated
using (public.is_approved_member() or public.can_manage_community());
drop policy if exists "Users can create own comments" on public.comments;
create policy "Approved members can create own comments"
on public.comments for insert to authenticated
with check ((public.is_approved_member() or public.can_manage_community()) and user_id = auth.uid());
drop policy if exists "Users can update own comments" on public.comments;
create policy "Owners can update comments"
on public.comments for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
drop policy if exists "Users can delete own comments" on public.comments;
create policy "Owners can delete comments"
on public.comments for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "Likes are readable" on public.post_likes;
create policy "Approved members can read likes"
on public.post_likes for select to authenticated
using (public.is_approved_member() or public.can_manage_community());
drop policy if exists "Users can like as themselves" on public.post_likes;
create policy "Approved members can like as themselves"
on public.post_likes for insert to authenticated
with check ((public.is_approved_member() or public.can_manage_community()) and user_id = auth.uid());
drop policy if exists "Users can remove own likes" on public.post_likes;
create policy "Users can remove own likes"
on public.post_likes for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "Listings are readable" on public.listings;
create policy "Approved members can read listings"
on public.listings for select to authenticated
using (public.is_approved_member() or public.can_manage_community());
drop policy if exists "Users can create own listings" on public.listings;
create policy "Approved members can create listings"
on public.listings for insert to authenticated
with check ((public.is_approved_member() or public.can_manage_community()) and user_id = auth.uid());
drop policy if exists "Users can update own listings" on public.listings;
create policy "Owners can update listings"
on public.listings for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
drop policy if exists "Users can delete own listings" on public.listings;
create policy "Owners can delete listings"
on public.listings for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "Safety alerts are readable" on public.safety_alerts;
create policy "Approved members can read safety alerts"
on public.safety_alerts for select to authenticated
using (public.is_approved_member() or public.can_manage_community());
drop policy if exists "Users can create own safety alerts" on public.safety_alerts;
create policy "Approved members can create safety alerts"
on public.safety_alerts for insert to authenticated
with check ((public.is_approved_member() or public.can_manage_community()) and user_id = auth.uid());
drop policy if exists "Users can update own safety alerts" on public.safety_alerts;
create policy "Owners and admins can update safety alerts"
on public.safety_alerts for update to authenticated
using (user_id = auth.uid() or public.can_manage_community())
with check (user_id = auth.uid() or public.can_manage_community());

drop policy if exists "Alert comments are readable" on public.alert_comments;
create policy "Approved members can read alert comments"
on public.alert_comments for select to authenticated
using (public.is_approved_member() or public.can_manage_community());
drop policy if exists "Users can create own alert comments" on public.alert_comments;
create policy "Approved members can create alert comments"
on public.alert_comments for insert to authenticated
with check ((public.is_approved_member() or public.can_manage_community()) and user_id = auth.uid());

drop policy if exists "Events are readable" on public.events;
create policy "Approved members can read events"
on public.events for select to authenticated
using (public.is_approved_member() or public.can_manage_community());
drop policy if exists "Users can create own events" on public.events;
create policy "Approved members can create events"
on public.events for insert to authenticated
with check ((public.is_approved_member() or public.can_manage_community()) and user_id = auth.uid());
drop policy if exists "Users can update own events" on public.events;
create policy "Owners can update events"
on public.events for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
drop policy if exists "Users can delete own events" on public.events;
create policy "Owners can delete events"
on public.events for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "RSVPs are readable" on public.event_rsvps;
create policy "Approved members can read RSVPs"
on public.event_rsvps for select to authenticated
using (public.is_approved_member() or public.can_manage_community());
drop policy if exists "Users can create own RSVPs" on public.event_rsvps;
create policy "Approved members can create RSVPs"
on public.event_rsvps for insert to authenticated
with check ((public.is_approved_member() or public.can_manage_community()) and user_id = auth.uid());
drop policy if exists "Users can update own RSVPs" on public.event_rsvps;
create policy "Users can update own RSVPs"
on public.event_rsvps for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Polls are readable" on public.polls;
create policy "Approved members can read polls"
on public.polls for select to authenticated
using (public.is_approved_member() or public.can_manage_community());
drop policy if exists "Users can create own polls" on public.polls;
create policy "Approved members can create polls"
on public.polls for insert to authenticated
with check ((public.is_approved_member() or public.can_manage_community()) and user_id = auth.uid());
drop policy if exists "Users can update own polls" on public.polls;
create policy "Owners can update polls"
on public.polls for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Poll options are readable" on public.poll_options;
create policy "Approved members can read poll options"
on public.poll_options for select to authenticated
using (public.is_approved_member() or public.can_manage_community());
drop policy if exists "Users can create options for own polls" on public.poll_options;
create policy "Users can create options for own polls"
on public.poll_options for insert to authenticated
with check (
  exists (
    select 1 from public.polls
    where polls.id = poll_id and polls.user_id = auth.uid()
  )
);

drop policy if exists "Poll votes are readable" on public.poll_votes;
create policy "Approved members can read poll votes"
on public.poll_votes for select to authenticated
using (public.is_approved_member() or public.can_manage_community());
drop policy if exists "Users can vote as themselves" on public.poll_votes;
create policy "Approved members can vote as themselves"
on public.poll_votes for insert to authenticated
with check ((public.is_approved_member() or public.can_manage_community()) and user_id = auth.uid());

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
on public.notifications for select to authenticated
using (user_id = auth.uid());
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users manage own notification preferences"
on public.notification_preferences for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Approved members can read places"
on public.places for select to authenticated
using ((public.is_approved_member() or public.can_manage_community()) and is_active);
create policy "Admins can manage places"
on public.places for all to authenticated
using (public.can_manage_community())
with check (public.can_manage_community());

create policy "Approved members can read volunteer opportunities"
on public.volunteer_opportunities for select to authenticated
using ((public.is_approved_member() or public.can_manage_community()) and is_active);
create policy "Admins can manage volunteer opportunities"
on public.volunteer_opportunities for all to authenticated
using (public.can_manage_community())
with check (public.can_manage_community());

create policy "Approved members can read volunteer signups"
on public.volunteer_signups for select to authenticated
using (public.is_approved_member() or public.can_manage_community());
create policy "Members manage own volunteer signups"
on public.volunteer_signups for all to authenticated
using (user_id = auth.uid())
with check ((public.is_approved_member() or public.can_manage_community()) and user_id = auth.uid());

create policy "Users can create reports"
on public.moderation_reports for insert to authenticated
with check (reporter_id = auth.uid());
create policy "Users and admins can read reports"
on public.moderation_reports for select to authenticated
using (reporter_id = auth.uid() or public.can_manage_community());

create policy "Users manage own blocks"
on public.user_blocks for all to authenticated
using (blocker_id = auth.uid())
with check (blocker_id = auth.uid());

create policy "Admins can read audit log"
on public.admin_audit_log for select to authenticated
using (public.can_manage_community());

drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Authenticated users can update uploads" on storage.objects;
drop policy if exists "Authenticated users can delete uploads" on storage.objects;
create policy "Users upload into own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Users update own uploads"
on storage.objects for update to authenticated
using (bucket_id = 'uploads' and owner_id = auth.uid()::text)
with check (bucket_id = 'uploads' and owner_id = auth.uid()::text);
create policy "Users delete own uploads"
on storage.objects for delete to authenticated
using (bucket_id = 'uploads' and owner_id = auth.uid()::text);

insert into public.places (name, category, description, location, hours)
select *
from (
  values
    ('Main Gate Reception', 'Essentials', 'Security and visitor assistance.', 'Ground Floor', 'Open 24/7'),
    ('Management Office', 'Essentials', 'Community administration and resident support.', 'Block A', 'Mon-Sat 9am-5pm'),
    ('Central Park', 'Green Spaces', 'Open space for walks, play and community gatherings.', 'Central courtyard', 'Dawn to dusk'),
    ('Mini Mart', 'Shopping & Food', 'Everyday groceries and household essentials.', 'Ground Floor', '8am-11pm'),
    ('Community Clinic', 'Health & Education', 'Primary health support for residents.', 'Block D', 'Mon-Fri 9am-6pm'),
    ('Learning Centre', 'Health & Education', 'After-school learning and community workshops.', 'Block B', 'After school hours')
) as seed(name, category, description, location, hours)
where not exists (select 1 from public.places);

insert into public.volunteer_opportunities (title, description, category, schedule, location, capacity)
select *
from (
  values
    ('Park Cleanup Drive', 'Help clean and maintain the community park. Supplies are provided.', 'Environment', 'First Saturday, 7am-10am', 'Central Park', 20),
    ('Food Distribution', 'Support the monthly community food distribution.', 'Social', 'Second Sunday, 10am-1pm', 'Community Hall', 15),
    ('Senior Resident Support', 'Help senior residents with errands and basic technology.', 'Care', 'Every Saturday, 3pm-5pm', 'Management Office', 10),
    ('Kids Tutoring', 'Volunteer for primary-school tutoring sessions.', 'Education', 'Monday and Wednesday, 4pm-6pm', 'Learning Centre', 12)
) as seed(title, description, category, schedule, location, capacity)
where not exists (select 1 from public.volunteer_opportunities);
