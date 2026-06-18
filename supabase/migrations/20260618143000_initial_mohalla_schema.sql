do $$
begin
  create type public.app_role as enum ('admin', 'moderator', 'user');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  full_name text,
  unit_number text,
  avatar_url text,
  bio text,
  is_verified boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.private_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  whatsapp_number text,
  address text,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  unique (user_id, role)
);

create table if not exists public.community_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mohalla Community Hub',
  description text,
  welcome_message text,
  rules text,
  updated_at timestamptz default now()
);

insert into public.community_settings (name, description, welcome_message, rules)
select 'Mohalla Community Hub', 'A private community space for neighbours.', 'Welcome to Mohalla!', 'Be respectful. Keep posts relevant. Use safety alerts responsibly.'
where not exists (select 1 from public.community_settings);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'general',
  title text not null,
  body text not null,
  image_urls text[] default '{}',
  is_pinned boolean default false,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  price_pkr integer,
  category text not null default 'other',
  condition text not null default 'good',
  image_urls text[] default '{}',
  status text not null default 'available',
  whatsapp_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.safety_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_type text not null default 'general',
  title text not null,
  description text not null,
  location text,
  severity text not null default 'medium',
  is_resolved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.alert_comments (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.safety_alerts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  event_date date not null,
  event_time text,
  location text,
  image_url text,
  max_attendees integer,
  rsvp_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'going',
  created_at timestamptz default now(),
  unique (event_id, user_id)
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  description text,
  ends_at timestamptz,
  total_votes integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_text text not null,
  votes_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (poll_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'announcement',
  title text not null,
  body text not null,
  data jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, full_name, unit_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'unit_number'
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
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

alter table public.profiles enable row level security;
alter table public.private_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.community_settings enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.listings enable row level security;
alter table public.safety_alerts enable row level security;
alter table public.alert_comments enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.notifications enable row level security;

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;

drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable" on public.profiles for select using (true);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Users can read own private profile" on public.private_profiles;
create policy "Users can read own private profile" on public.private_profiles for select using (id = auth.uid());
drop policy if exists "Users can insert own private profile" on public.private_profiles;
create policy "Users can insert own private profile" on public.private_profiles for insert with check (id = auth.uid());
drop policy if exists "Users can update own private profile" on public.private_profiles;
create policy "Users can update own private profile" on public.private_profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Roles are readable" on public.user_roles;
create policy "Roles are readable" on public.user_roles for select using (true);
drop policy if exists "Community settings are readable" on public.community_settings;
create policy "Community settings are readable" on public.community_settings for select using (true);
drop policy if exists "Admins can manage community settings" on public.community_settings;
create policy "Admins can manage community settings" on public.community_settings for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Posts are readable" on public.posts;
create policy "Posts are readable" on public.posts for select using (true);
drop policy if exists "Users can create own posts" on public.posts;
create policy "Users can create own posts" on public.posts for insert with check (user_id = auth.uid());
drop policy if exists "Users can update own posts" on public.posts;
create policy "Users can update own posts" on public.posts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users can delete own posts" on public.posts;
create policy "Users can delete own posts" on public.posts for delete using (user_id = auth.uid());

drop policy if exists "Comments are readable" on public.comments;
create policy "Comments are readable" on public.comments for select using (true);
drop policy if exists "Users can create own comments" on public.comments;
create policy "Users can create own comments" on public.comments for insert with check (user_id = auth.uid());
drop policy if exists "Users can update own comments" on public.comments;
create policy "Users can update own comments" on public.comments for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users can delete own comments" on public.comments;
create policy "Users can delete own comments" on public.comments for delete using (user_id = auth.uid());

drop policy if exists "Likes are readable" on public.post_likes;
create policy "Likes are readable" on public.post_likes for select using (true);
drop policy if exists "Users can like as themselves" on public.post_likes;
create policy "Users can like as themselves" on public.post_likes for insert with check (user_id = auth.uid());
drop policy if exists "Users can remove own likes" on public.post_likes;
create policy "Users can remove own likes" on public.post_likes for delete using (user_id = auth.uid());

drop policy if exists "Listings are readable" on public.listings;
create policy "Listings are readable" on public.listings for select using (true);
drop policy if exists "Users can create own listings" on public.listings;
create policy "Users can create own listings" on public.listings for insert with check (user_id = auth.uid());
drop policy if exists "Users can update own listings" on public.listings;
create policy "Users can update own listings" on public.listings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users can delete own listings" on public.listings;
create policy "Users can delete own listings" on public.listings for delete using (user_id = auth.uid());

drop policy if exists "Safety alerts are readable" on public.safety_alerts;
create policy "Safety alerts are readable" on public.safety_alerts for select using (true);
drop policy if exists "Users can create own safety alerts" on public.safety_alerts;
create policy "Users can create own safety alerts" on public.safety_alerts for insert with check (user_id = auth.uid());
drop policy if exists "Users can update own safety alerts" on public.safety_alerts;
create policy "Users can update own safety alerts" on public.safety_alerts for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Alert comments are readable" on public.alert_comments;
create policy "Alert comments are readable" on public.alert_comments for select using (true);
drop policy if exists "Users can create own alert comments" on public.alert_comments;
create policy "Users can create own alert comments" on public.alert_comments for insert with check (user_id = auth.uid());

drop policy if exists "Events are readable" on public.events;
create policy "Events are readable" on public.events for select using (true);
drop policy if exists "Users can create own events" on public.events;
create policy "Users can create own events" on public.events for insert with check (user_id = auth.uid());
drop policy if exists "Users can update own events" on public.events;
create policy "Users can update own events" on public.events for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users can delete own events" on public.events;
create policy "Users can delete own events" on public.events for delete using (user_id = auth.uid());

drop policy if exists "RSVPs are readable" on public.event_rsvps;
create policy "RSVPs are readable" on public.event_rsvps for select using (true);
drop policy if exists "Users can create own RSVPs" on public.event_rsvps;
create policy "Users can create own RSVPs" on public.event_rsvps for insert with check (user_id = auth.uid());
drop policy if exists "Users can update own RSVPs" on public.event_rsvps;
create policy "Users can update own RSVPs" on public.event_rsvps for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Polls are readable" on public.polls;
create policy "Polls are readable" on public.polls for select using (true);
drop policy if exists "Users can create own polls" on public.polls;
create policy "Users can create own polls" on public.polls for insert with check (user_id = auth.uid());
drop policy if exists "Users can update own polls" on public.polls;
create policy "Users can update own polls" on public.polls for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Poll options are readable" on public.poll_options;
create policy "Poll options are readable" on public.poll_options for select using (true);
drop policy if exists "Users can create options for own polls" on public.poll_options;
create policy "Users can create options for own polls" on public.poll_options for insert with check (exists (select 1 from public.polls where polls.id = poll_id and polls.user_id = auth.uid()));

drop policy if exists "Poll votes are readable" on public.poll_votes;
create policy "Poll votes are readable" on public.poll_votes for select using (true);
drop policy if exists "Users can vote as themselves" on public.poll_votes;
create policy "Users can vote as themselves" on public.poll_votes for insert with check (user_id = auth.uid());

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do update set public = true;

drop policy if exists "Authenticated users can upload" on storage.objects;
create policy "Authenticated users can upload" on storage.objects for insert to authenticated with check (bucket_id = 'uploads');
drop policy if exists "Authenticated users can update uploads" on storage.objects;
create policy "Authenticated users can update uploads" on storage.objects for update to authenticated using (bucket_id = 'uploads') with check (bucket_id = 'uploads');
drop policy if exists "Authenticated users can delete uploads" on storage.objects;
create policy "Authenticated users can delete uploads" on storage.objects for delete to authenticated using (bucket_id = 'uploads');
