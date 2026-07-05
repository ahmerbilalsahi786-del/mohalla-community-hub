alter table public.notification_preferences
  add column if not exists notify_events boolean not null default true,
  add column if not exists notify_messages boolean not null default true;

create table if not exists public.mobile_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists mobile_push_subscriptions_user_enabled_idx
on public.mobile_push_subscriptions (user_id, is_enabled);

grant select, insert, update, delete on public.mobile_push_subscriptions to authenticated;

alter table public.mobile_push_subscriptions enable row level security;

drop policy if exists "Members can manage their own push subscriptions" on public.mobile_push_subscriptions;
create policy "Members can manage their own push subscriptions"
on public.mobile_push_subscriptions
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
