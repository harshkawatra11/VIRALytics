-- ============================================================================
-- 0007 — partition maintenance (pg_cron) + aggregate recompute helper
-- ============================================================================

-- Create next month's post_metrics partition if it doesn't exist yet.
create or replace function public.ensure_next_post_metrics_partition()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p_start date := (date_trunc('month', now()) + interval '1 month')::date;
  p_end   date := (p_start + interval '1 month')::date;
  p_name  text := 'post_metrics_' || to_char(p_start, 'YYYYMM');
begin
  execute format(
    'create table if not exists public.%I partition of public.post_metrics for values from (%L) to (%L)',
    p_name, p_start, p_end
  );
end;
$$;

-- Run on the 25th of every month at 03:00 UTC (well before month rollover).
select cron.schedule(
  'ensure-post-metrics-partition',
  '0 3 25 * *',
  $$select public.ensure_next_post_metrics_partition();$$
);

-- ----------------------------------------------------------------------------
-- refresh_account_aggregates — after a sync, recompute the account's average
-- views (viral-score denominator) and re-score every post in one DB round trip.
-- The worker calls this via RPC once per account per sync.
-- ----------------------------------------------------------------------------
create or replace function public.refresh_account_aggregates(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric;
begin
  select avg(nullif(current_views, 0))
    into v_avg
    from public.posts
   where account_id = p_account_id;

  v_avg := coalesce(v_avg, 0);

  update public.tracked_accounts
     set avg_views = round(v_avg)
   where id = p_account_id;

  update public.posts
     set viral_score = case when v_avg > 0 then round(current_views / v_avg, 4) else 0 end
   where account_id = p_account_id;
end;
$$;

comment on function public.refresh_account_aggregates is
  'Recomputes tracked_accounts.avg_views and every post.viral_score for one account. Called by the worker after each sync.';
