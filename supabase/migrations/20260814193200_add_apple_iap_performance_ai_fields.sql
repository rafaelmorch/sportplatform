alter table public.performance_ai_subscriptions
add column if not exists payment_provider text,
add column if not exists apple_product_id text,
add column if not exists apple_transaction_id text,
add column if not exists apple_original_transaction_id text,
add column if not exists apple_environment text,
add column if not exists apple_app_account_token uuid;

create unique index if not exists performance_ai_subscriptions_apple_original_transaction_id_idx
on public.performance_ai_subscriptions (apple_original_transaction_id)
where apple_original_transaction_id is not null;
