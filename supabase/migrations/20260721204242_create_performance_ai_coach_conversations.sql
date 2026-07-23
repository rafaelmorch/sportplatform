create table if not exists public.performance_ai_coach_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.performance_ai_coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.performance_ai_coach_conversations(id)
    on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null
    check (role in ('user', 'coach')),
  content text not null
    check (char_length(btrim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists
  performance_ai_coach_conversations_user_updated_idx
on public.performance_ai_coach_conversations (
  user_id,
  updated_at desc
);

create index if not exists
  performance_ai_coach_messages_conversation_created_idx
on public.performance_ai_coach_messages (
  conversation_id,
  created_at asc
);

create index if not exists
  performance_ai_coach_messages_user_created_idx
on public.performance_ai_coach_messages (
  user_id,
  created_at desc
);

alter table public.performance_ai_coach_conversations
enable row level security;

alter table public.performance_ai_coach_messages
enable row level security;

drop policy if exists
  "Users can view own coach conversations"
on public.performance_ai_coach_conversations;

create policy
  "Users can view own coach conversations"
on public.performance_ai_coach_conversations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists
  "Users can create own coach conversations"
on public.performance_ai_coach_conversations;

create policy
  "Users can create own coach conversations"
on public.performance_ai_coach_conversations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists
  "Users can update own coach conversations"
on public.performance_ai_coach_conversations;

create policy
  "Users can update own coach conversations"
on public.performance_ai_coach_conversations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists
  "Users can delete own coach conversations"
on public.performance_ai_coach_conversations;

create policy
  "Users can delete own coach conversations"
on public.performance_ai_coach_conversations
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists
  "Users can view own coach messages"
on public.performance_ai_coach_messages;

create policy
  "Users can view own coach messages"
on public.performance_ai_coach_messages
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.performance_ai_coach_conversations conversation
    where conversation.id = conversation_id
      and conversation.user_id = auth.uid()
  )
);

drop policy if exists
  "Users can create own coach messages"
on public.performance_ai_coach_messages;

create policy
  "Users can create own coach messages"
on public.performance_ai_coach_messages
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.performance_ai_coach_conversations conversation
    where conversation.id = conversation_id
      and conversation.user_id = auth.uid()
  )
);

drop policy if exists
  "Users can delete own coach messages"
on public.performance_ai_coach_messages;

create policy
  "Users can delete own coach messages"
on public.performance_ai_coach_messages
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.performance_ai_coach_conversations conversation
    where conversation.id = conversation_id
      and conversation.user_id = auth.uid()
  )
);

grant select, insert, update, delete
on public.performance_ai_coach_conversations
to authenticated;

grant select, insert, delete
on public.performance_ai_coach_messages
to authenticated;