alter table public.app_membership_requests
  add column if not exists payment_provider text,
  add column if not exists apple_product_id text,
  add column if not exists apple_transaction_id text,
  add column if not exists apple_original_transaction_id text,
  add column if not exists apple_environment text,
  add column if not exists apple_app_account_token uuid;

create unique index if not exists app_membership_requests_apple_original_transaction_id_idx
  on public.app_membership_requests (apple_original_transaction_id)
  where apple_original_transaction_id is not null;
