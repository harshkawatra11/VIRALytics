-- ============================================================================
-- 0005 — sync_jobs (audit log; powers "last synced" UI + debugging)
-- ============================================================================

create table public.sync_jobs (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.tracked_accounts (id) on delete cascade,
  platform       text not null check (platform in ('youtube','instagram','tiktok')),
  job_type       text not null check (job_type in ('initial','scheduled','backfill','manual')),
  status         text not null default 'queued'
                   check (status in ('queued','running','completed','failed')),
  posts_found    integer not null default 0,
  posts_new      integer not null default 0,
  error_message  text,
  duration_ms    integer,
  started_at     timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz not null default now()
);
create index idx_sync_jobs_account on public.sync_jobs (account_id, created_at desc);
