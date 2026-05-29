-- ============================================================================
-- 0001 — Extensions + managers (the SaaS tenant) + signup trigger
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_cron";     -- partition maintenance (0007)

-- One row per brand manager / agency (the paying SaaS user).
create table public.managers (
  id                     uuid primary key references auth.users (id) on delete cascade,
  full_name              text        not null,
  email                  text        not null unique,
  plan                   text        not null default 'free'
                           check (plan in ('free','starter','pro','agency')),
  account_limit          integer     not null default 3,
  sync_interval_seconds  integer     not null default 86400,
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz not null default now()
);

comment on table public.managers is
  'SaaS tenant. id mirrors auth.users.id. plan drives account_limit + sync_interval_seconds (enforced by Stripe webhook + worker sweeper).';

-- Auto-provision a managers row when a new auth user confirms signup.
-- full_name is passed through auth metadata (options.data.full_name).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.managers (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
