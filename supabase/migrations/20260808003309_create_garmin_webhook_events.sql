-- Raw Garmin webhook inbox.
-- This table stores Garmin payloads before they are normalized into
-- Platform Sports activity/health tables.
--
-- Important:
-- This migration does not modify any Strava table or existing activity flow.

create table if not exists public.garmin_webhook_events (
  id uuid primary key default gen_random_uuid(),

  event_type text not null
    check (
      event_type in (
        'activity',
        'daily',
        'deregistration',
        'permissions'
      )
    ),

  garmin_user_id text,

  external_id text,

  app_user_id uuid
    references auth.users(id)
    on delete set null,

  payload jsonb not null,

  processing_status text not null default 'pending'
    check (
      processing_status in (
        'pending',
        'processed',
        'ignored',
        'failed'
      )
    ),

  received_at timestamptz not null default now(),

  processed_at timestamptz,

  processing_error text
);

-- Prevent the same Garmin summary/activity from being stored multiple times.
-- Garmin can resend webhook events, so webhook processing must be idempotent.
create unique index if not exists
  garmin_webhook_events_provider_event_uidx
on public.garmin_webhook_events (
  event_type,
  garmin_user_id,
  external_id
)
where external_id is not null;

create index if not exists
  garmin_webhook_events_received_at_idx
on public.garmin_webhook_events (received_at desc);

create index if not exists
  garmin_webhook_events_processing_status_idx
on public.garmin_webhook_events (processing_status);

create index if not exists
  garmin_webhook_events_app_user_id_idx
on public.garmin_webhook_events (app_user_id);

-- Raw Garmin data must not be directly exposed through the public API.
alter table public.garmin_webhook_events enable row level security;

comment on table public.garmin_webhook_events is
  'Raw webhook events received from Garmin before normalization and processing.';

comment on column public.garmin_webhook_events.external_id is
  'Garmin activityId, summaryId, or other provider event identifier used for idempotency.';

comment on column public.garmin_webhook_events.app_user_id is
  'Platform Sports auth.users ID after the Garmin identity has been mapped to an application user.';
