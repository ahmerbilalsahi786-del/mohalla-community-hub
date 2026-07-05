create table if not exists public.message_conversations (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.community_settings(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  participant_one uuid not null references auth.users(id) on delete cascade,
  participant_two uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  post_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_conversations_two_people check (participant_one <> participant_two)
);

create unique index if not exists message_conversations_pair_post_unique
on public.message_conversations (
  community_id,
  least(participant_one, participant_two),
  greatest(participant_one, participant_two),
  coalesce(post_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create index if not exists message_conversations_participant_one_idx
on public.message_conversations (participant_one, created_at desc);

create index if not exists message_conversations_participant_two_idx
on public.message_conversations (participant_two, created_at desc);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.message_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists conversation_messages_conversation_idx
on public.conversation_messages (conversation_id, created_at);

create table if not exists public.message_reads (
  conversation_id uuid not null references public.message_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists message_reads_user_idx
on public.message_reads (user_id, last_read_at desc);

grant select, insert, update on public.message_conversations to authenticated;
grant select, insert on public.conversation_messages to authenticated;
grant select, insert, update, delete on public.message_reads to authenticated;

alter table public.message_conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.message_reads enable row level security;

drop policy if exists "Members can read their own conversations" on public.message_conversations;
create policy "Members can read their own conversations"
on public.message_conversations
for select
to authenticated
using (
  community_id = public.my_community_id()
  and public.my_community_is_approved()
  and (
    participant_one = (select auth.uid())
    or participant_two = (select auth.uid())
  )
);

drop policy if exists "Members can start same-community conversations" on public.message_conversations;
create policy "Members can start same-community conversations"
on public.message_conversations
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and community_id = public.my_community_id()
  and public.my_community_is_approved()
  and (
    participant_one = (select auth.uid())
    or participant_two = (select auth.uid())
  )
  and exists (
    select 1
    from public.profiles p
    where p.id = case
      when participant_one = (select auth.uid()) then participant_two
      else participant_one
    end
      and p.community_id = public.my_community_id()
      and p.membership_status = 'approved'
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
  community_id = public.my_community_id()
  and public.my_community_is_approved()
  and (
    participant_one = (select auth.uid())
    or participant_two = (select auth.uid())
  )
)
with check (
  community_id = public.my_community_id()
  and public.my_community_is_approved()
  and (
    participant_one = (select auth.uid())
    or participant_two = (select auth.uid())
  )
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
      and c.community_id = public.my_community_id()
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
      and c.community_id = public.my_community_id()
      and public.my_community_is_approved()
      and (
        c.participant_one = (select auth.uid())
        or c.participant_two = (select auth.uid())
      )
  )
);

drop policy if exists "Members can read their own message read markers" on public.message_reads;
create policy "Members can read their own message read markers"
on public.message_reads
for select
to authenticated
using (user_id = (select auth.uid()));

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
      and c.community_id = public.my_community_id()
      and public.my_community_is_approved()
      and (
        c.participant_one = (select auth.uid())
        or c.participant_two = (select auth.uid())
      )
  )
);

drop policy if exists "Members can update their own message read markers" on public.message_reads;
create policy "Members can update their own message read markers"
on public.message_reads
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Members can delete their own message read markers" on public.message_reads;
create policy "Members can delete their own message read markers"
on public.message_reads
for delete
to authenticated
using (user_id = (select auth.uid()));
