-- ============================================================================
-- 0002 — tracked_accounts + platform_tokens
-- ============================================================================

create table public.tracked_accounts (
  id               uuid primary key default gen_random_uuid(),
  manager_id       uuid not null references public.managers (id) on delete cascade,
  platform         text not null check (platform in ('youtube','instagram','tiktok')),
  connection_type  text not null default 'public'
                     check (connection_type in ('public','oauth')),
  handle           text not null,
  display_name     text,
  avatar_url       text,
  follower_count   bigint,
  following_count  bigint,
  total_posts      integer,
  avg_views        bigint not null default 0,   -- viral-score denominator
  platform_id      text,                        -- YT channel id / IG business id / TikTok open_id
  status           text not null default 'pending'
                     check (status in ('pending','active','error','private','not_found','paused')),
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now()
);

-- One account per handle per platform per manager.
create unique index tracked_accounts_unique
  on public.tracked_accounts (manager_id, platform, lower(handle));
create index idx_tracked_manager on public.tracked_accounts (manager_id);
-- Sweeper hot path: "which accounts are due for a sync right now?"
create index idx_tracked_due
  on public.tracked_accounts (last_synced_at)
  where status = 'active';

comment on table public.tracked_accounts is
  'Every social account a manager tracks. connection_type=public (scraped) or oauth (private metrics). avg_views is the cached viral-score denominator, refreshed each sync.';

-- ----------------------------------------------------------------------------
-- platform_tokens — OAuth credentials, encrypted at rest (AES-256-GCM).
-- SERVICE-ROLE ONLY: RLS is enabled with ZERO policies, so no anon/authenticated
-- client can ever read it. Only the worker + server-only routes (service role)
-- touch this table.
-- ----------------------------------------------------------------------------
create table public.platform_tokens (
  id                       uuid primary key default gen_random_uuid(),
  account_id               uuid not null references public.tracked_accounts (id) on delete cascade,
  platform                 text not null check (platform in ('youtube','instagram','tiktok')),
  encrypted_access_token   text not null,
  encrypted_refresh_token  text,
  platform_account_id      text,
  token_expires_at         timestamptz,
  scopes                   text[] not null default '{}',
  refresh_failure_count    integer not null default 0,
  last_refreshed_at        timestamptz,
  updated_at               timestamptz not null default now()
);

create unique index platform_tokens_account_unique
  on public.platform_tokens (account_id);
-- Token-refresh queue source: tokens nearing expiry that haven't given up.
create index idx_tokens_expiring
  on public.platform_tokens (token_expires_at)
  where refresh_failure_count < 3;

alter table public.platform_tokens enable row level security;
-- (intentionally no policies — service role only)

comment on table public.platform_tokens is
  'Encrypted OAuth tokens. RLS enabled with no policies = service-role-only. Never readable by client sessions.';
