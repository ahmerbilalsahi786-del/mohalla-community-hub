create table if not exists public.city_publications (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.community_settings(id) on delete cascade,
  city text not null,
  source_type text not null check (
    source_type in (
      'post',
      'event',
      'listing',
      'poll',
      'safety_alert',
      'place',
      'volunteer'
    )
  ),
  source_id text not null,
  title text not null,
  summary text not null default '',
  image_url text,
  href text not null default '',
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'Resident',
  community_name text not null,
  community_area text,
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz not null default now(),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, source_type, source_id)
);

create index if not exists city_publications_city_active_published_idx
on public.city_publications (lower(trim(city)), is_active, published_at desc);

create index if not exists city_publications_source_idx
on public.city_publications (community_id, source_type, source_id);

create or replace function public.my_community_city_key()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(trim(coalesce(c.welcome_message, '')))
  from public.profiles p
  join public.community_settings c on c.id = p.community_id
  where p.id = auth.uid()
$$;

create or replace function public.touch_city_publications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists city_publications_touch on public.city_publications;
create trigger city_publications_touch
before insert or update on public.city_publications
for each row execute function public.touch_city_publications();

revoke execute on function public.my_community_city_key() from public, anon;
grant execute on function public.my_community_city_key() to authenticated;

grant select, insert, update, delete on public.city_publications to authenticated;

alter table public.city_publications enable row level security;

drop policy if exists "Approved city members can read public city publications" on public.city_publications;
create policy "Approved city members can read public city publications"
on public.city_publications for select to authenticated
using (
  public.is_super_admin()
  or (
    public.my_community_is_approved()
    and lower(trim(city)) = public.my_community_city_key()
    and (
      is_active
      or (community_id = public.my_community_id() and public.can_manage_own_community())
    )
  )
);

drop policy if exists "Community admins can publish to own city feed" on public.city_publications;
create policy "Community admins can publish to own city feed"
on public.city_publications for insert to authenticated
with check (
  public.is_super_admin()
  or (
    community_id = public.my_community_id()
    and public.can_manage_own_community()
    and lower(trim(city)) = public.my_community_city_key()
  )
);

drop policy if exists "Community admins can update own city publications" on public.city_publications;
create policy "Community admins can update own city publications"
on public.city_publications for update to authenticated
using (
  public.is_super_admin()
  or (
    community_id = public.my_community_id()
    and public.can_manage_own_community()
  )
)
with check (
  public.is_super_admin()
  or (
    community_id = public.my_community_id()
    and public.can_manage_own_community()
    and lower(trim(city)) = public.my_community_city_key()
  )
);

drop policy if exists "Community admins can delete own city publications" on public.city_publications;
create policy "Community admins can delete own city publications"
on public.city_publications for delete to authenticated
using (
  public.is_super_admin()
  or (
    community_id = public.my_community_id()
    and public.can_manage_own_community()
  )
);
