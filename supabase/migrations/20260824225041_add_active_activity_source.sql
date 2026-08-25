create table if not exists public.user_activity_source (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check (
    provider in ('strava', 'garmin', 'health_connect', 'apple_health')
  ),
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_activity_source enable row level security;

create policy "Users can read own activity source"
on public.user_activity_source
for select
to authenticated
using (auth.uid() = user_id);

comment on table public.user_activity_source is
'Fonte principal de atividades do usuario. Somente um provider pode estar ativo por usuario.';
