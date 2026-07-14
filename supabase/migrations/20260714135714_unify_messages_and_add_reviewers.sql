-- Keep direct messages as one thread per pair. Existing post-specific threads
-- are folded into the most recently active conversation before the unique
-- constraint is replaced.
drop index if exists public.message_conversations_pair_post_unique;

do $$
declare
  duplicate_row record;
begin
  for duplicate_row in
    with ranked as (
      select
        id,
        first_value(id) over (
          partition by least(participant_one, participant_two), greatest(participant_one, participant_two)
          order by updated_at desc, created_at desc, id
        ) as keeper_id
      from public.message_conversations
    )
    select id, keeper_id
    from ranked
    where id <> keeper_id
  loop
    update public.conversation_messages
    set conversation_id = duplicate_row.keeper_id
    where conversation_id = duplicate_row.id;

    insert into public.message_reads (conversation_id, user_id, last_read_at)
    select duplicate_row.keeper_id, user_id, last_read_at
    from public.message_reads
    where conversation_id = duplicate_row.id
    on conflict (conversation_id, user_id) do update
    set last_read_at = greatest(public.message_reads.last_read_at, excluded.last_read_at);

    delete from public.message_reads where conversation_id = duplicate_row.id;
    delete from public.message_conversations where id = duplicate_row.id;
  end loop;
end
$$;

update public.message_conversations
set post_id = null,
    post_title = null;

create unique index if not exists message_conversations_pair_unique
on public.message_conversations (
  least(participant_one, participant_two),
  greatest(participant_one, participant_two)
);

revoke update on public.message_conversations from authenticated;
grant update (updated_at) on public.message_conversations to authenticated;

create or replace function public.can_start_message_with(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and target_user is not null
    and target_user <> (select auth.uid())
    and exists (
      select 1
      from public.profiles actor
      join public.community_settings actor_community on actor_community.id = actor.community_id
      join public.profiles recipient on recipient.id = target_user
      join public.community_settings recipient_community on recipient_community.id = recipient.community_id
      where actor.id = (select auth.uid())
        and actor.membership_status = 'approved'
        and actor_community.status = 'approved'
        and recipient.membership_status = 'approved'
        and recipient_community.status = 'approved'
        and (
          actor.community_id = recipient.community_id
          or (
            exists (
              select 1 from public.user_roles actor_role
              where actor_role.user_id = actor.id
                and actor_role.role::text in ('admin', 'moderator')
            )
            and exists (
              select 1 from public.user_roles recipient_role
              where recipient_role.user_id = recipient.id
                and recipient_role.role::text in ('admin', 'moderator')
            )
          )
        )
    );
$$;

revoke execute on function public.can_start_message_with(uuid) from public, anon;
grant execute on function public.can_start_message_with(uuid) to authenticated;

drop policy if exists "Managers can read cross community reviewer profiles" on public.profiles;
create policy "Managers can read cross community reviewer profiles"
on public.profiles
for select
to authenticated
using (public.can_start_message_with(id));

create or replace function public.list_society_reviewers(search_text text default null)
returns table (
  user_id uuid,
  display_name text,
  full_name text,
  unit_number text,
  avatar_url text,
  role text,
  community_id uuid,
  community_name text,
  community_logo_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  with caller as (
    select p.id
    from public.profiles p
    join public.community_settings c on c.id = p.community_id
    where p.id = (select auth.uid())
      and p.membership_status = 'approved'
      and c.status = 'approved'
      and exists (
        select 1 from public.user_roles caller_role
        where caller_role.user_id = p.id
          and caller_role.role::text in ('admin', 'moderator')
      )
  )
  select
    p.id,
    p.display_name,
    p.full_name,
    p.unit_number,
    p.avatar_url,
    manager_role.role::text,
    c.id,
    c.name,
    c.logo_url
  from caller
  cross join public.profiles p
  join public.community_settings c on c.id = p.community_id
  join lateral (
    select r.role
    from public.user_roles r
    where r.user_id = p.id
      and r.role::text in ('admin', 'moderator')
    order by case r.role::text when 'admin' then 1 else 2 end
    limit 1
  ) manager_role on true
  where p.membership_status = 'approved'
    and c.status = 'approved'
    and (
      nullif(trim(search_text), '') is null
      or coalesce(p.display_name, '') ilike '%' || trim(search_text) || '%'
      or coalesce(p.full_name, '') ilike '%' || trim(search_text) || '%'
      or coalesce(c.name, '') ilike '%' || trim(search_text) || '%'
    )
  order by c.name, coalesce(p.display_name, p.full_name), p.id;
$$;

revoke execute on function public.list_society_reviewers(text) from public, anon;
grant execute on function public.list_society_reviewers(text) to authenticated;

drop policy if exists "Members can read their own conversations" on public.message_conversations;
create policy "Members can read their own conversations"
on public.message_conversations
for select
to authenticated
using (
  public.my_community_is_approved()
  and (
    participant_one = (select auth.uid())
    or participant_two = (select auth.uid())
  )
);

drop policy if exists "Members can start same-community conversations" on public.message_conversations;
create policy "Members can start permitted conversations"
on public.message_conversations
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and community_id = public.my_community_id()
  and (
    participant_one = (select auth.uid())
    or participant_two = (select auth.uid())
  )
  and public.can_start_message_with(
    case
      when participant_one = (select auth.uid()) then participant_two
      else participant_one
    end
  )
  and (
    post_id is null
    or exists (
      select 1
      from public.posts p
      where p.id = post_id
        and p.community_id = public.my_community_id()
    )
  )
);

drop policy if exists "Conversation participants can refresh conversations" on public.message_conversations;
create policy "Conversation participants can refresh conversations"
on public.message_conversations
for update
to authenticated
using (
  public.my_community_is_approved()
  and (
    participant_one = (select auth.uid())
    or participant_two = (select auth.uid())
  )
)
with check (
  participant_one = (select auth.uid())
  or participant_two = (select auth.uid())
);

drop policy if exists "Conversation participants can read messages" on public.conversation_messages;
create policy "Conversation participants can read messages"
on public.conversation_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.message_conversations c
    where c.id = conversation_id
      and public.my_community_is_approved()
      and (
        c.participant_one = (select auth.uid())
        or c.participant_two = (select auth.uid())
      )
  )
);

drop policy if exists "Conversation participants can send messages" on public.conversation_messages;
create policy "Conversation participants can send messages"
on public.conversation_messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1
    from public.message_conversations c
    where c.id = conversation_id
      and public.my_community_is_approved()
      and (
        c.participant_one = (select auth.uid())
        or c.participant_two = (select auth.uid())
      )
  )
);

drop policy if exists "Members can create their own message read markers" on public.message_reads;
create policy "Members can create their own message read markers"
on public.message_reads
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.message_conversations c
    where c.id = conversation_id
      and public.my_community_is_approved()
      and (
        c.participant_one = (select auth.uid())
        or c.participant_two = (select auth.uid())
      )
  )
);
