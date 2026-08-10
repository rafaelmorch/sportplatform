alter table public.app_membership_challenges
add column if not exists is_badge boolean not null default false;
