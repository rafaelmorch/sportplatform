create table if not exists public.app_membership_badge_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null,
  challenge_id uuid not null,
  user_id uuid not null,
  author_name text,
  image_url text,
  image_path text,
  comment text,
  did_challenge boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_membership_badge_posts_community
  on public.app_membership_badge_posts (community_id);

create index if not exists idx_membership_badge_posts_challenge
  on public.app_membership_badge_posts (challenge_id);

create index if not exists idx_membership_badge_posts_created_at
  on public.app_membership_badge_posts (created_at desc);

alter table public.app_membership_badge_posts enable row level security;

create policy "Authenticated users can read badge posts"
on public.app_membership_badge_posts
for select
to authenticated
using (true);

create policy "Users can create their own badge posts"
on public.app_membership_badge_posts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own badge posts"
on public.app_membership_badge_posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own badge posts"
on public.app_membership_badge_posts
for delete
to authenticated
using (auth.uid() = user_id);
