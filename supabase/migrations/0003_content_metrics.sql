-- ============================================================================
-- 0003 — posts (denormalized current metrics) + post_metrics (partitioned) +
--        account_snapshots (follower-growth / posting-activity source)
-- ============================================================================

-- One row per discovered post/video. Created on first sync, never deleted.
-- Current metrics are denormalized here so the Videos table (6k+ rows) renders
-- without scanning the giant post_metrics history table on every read.
create table public.posts (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.tracked_accounts (id) on delete cascade,
  platform            text not null check (platform in ('youtube','instagram','tiktok')),
  platform_post_id    text not null,
  post_type           text check (post_type in ('video','image','carousel','reel','short')),
  caption             text,
  hashtags            text[] not null default '{}',
  thumbnail_url       text,
  duration_seconds    integer,
  permalink           text,
  posted_at           timestamptz,
  viral_score         numeric(10,4) not null default 0,
  -- denormalized "latest snapshot" for fast table reads
  current_views           bigint not null default 0,
  current_likes           bigint not null default 0,
  current_comments        bigint not null default 0,
  current_shares          bigint not null default 0,
  current_saves           bigint,
  current_engagement_rate numeric(6,4) not null default 0,
  first_seen_at       timestamptz not null default now()
);

create unique index posts_platform_unique
  on public.posts (account_id, platform_post_id);
create index idx_posts_account     on public.posts (account_id);
create index idx_posts_posted_at   on public.posts (posted_at desc);
create index idx_posts_viral       on public.posts (viral_score desc);
create index idx_posts_hashtags    on public.posts using gin (hashtags);

comment on table public.posts is
  'Central content entity. current_* columns are the denormalized latest snapshot for fast list reads; full history lives in post_metrics.';

-- ----------------------------------------------------------------------------
-- post_metrics — time-series snapshots, RANGE-partitioned by month on
-- recorded_at. Partition key must be part of the PK. Largest table in the
-- system; partitioning keeps queries fast and old data prunable.
-- Server-only (RLS enabled, no policies): charts are read via service role
-- after the API has verified ownership.
-- ----------------------------------------------------------------------------
create table public.post_metrics (
  id                      uuid not null default gen_random_uuid(),
  post_id                 uuid not null references public.posts (id) on delete cascade,
  recorded_at             timestamptz not null default now(),
  views                   bigint,
  likes                   bigint,
  comments                bigint,
  shares                  bigint,
  saves                   bigint,
  impressions             bigint,
  reach                   bigint,
  engagement_rate         numeric(6,4),
  avg_watch_time_seconds  numeric(10,2),   -- OAuth only (hero metric)
  completion_rate         numeric(5,2),    -- OAuth only (hero metric)
  click_through_rate      numeric(5,2),    -- YouTube OAuth only
  primary key (id, recorded_at)
) partition by range (recorded_at);

create index idx_post_metrics_post_time
  on public.post_metrics (post_id, recorded_at desc);

alter table public.post_metrics enable row level security;
-- (no policies — server/service-role only)

-- Bootstrap partitions: previous, current, and next month. 0007 keeps them rolling.
do $$
declare
  start_month date := date_trunc('month', now())::date - interval '1 month';
  i int;
  p_start date;
  p_end   date;
  p_name  text;
begin
  for i in 0..2 loop
    p_start := (start_month + (i || ' month')::interval)::date;
    p_end   := (p_start + interval '1 month')::date;
    p_name  := 'post_metrics_' || to_char(p_start, 'YYYYMM');
    execute format(
      'create table if not exists public.%I partition of public.post_metrics for values from (%L) to (%L)',
      p_name, p_start, p_end
    );
  end loop;
end $$;

comment on table public.post_metrics is
  'Monthly RANGE-partitioned metric history. Server/service-role only. pg_cron (0007) pre-creates next month''s partition.';

-- ----------------------------------------------------------------------------
-- account_snapshots — daily account-level snapshot for follower-growth charts
-- and the posting-activity sparkline. Server-only.
-- ----------------------------------------------------------------------------
create table public.account_snapshots (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.tracked_accounts (id) on delete cascade,
  recorded_at    timestamptz not null default now(),
  follower_count bigint,
  total_views    bigint
);
create index idx_account_snapshots
  on public.account_snapshots (account_id, recorded_at desc);

alter table public.account_snapshots enable row level security;
-- (no policies — server/service-role only)
