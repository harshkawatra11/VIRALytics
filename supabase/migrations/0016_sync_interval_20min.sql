-- Sync every connected account every 20 minutes (previously 24h).
-- The worker's sweeper enqueues accounts whose last_synced_at is older than the
-- manager's sync_interval_seconds; lowering it to 1200s gives a 20-minute cadence.
alter table public.managers alter column sync_interval_seconds set default 1200;
update public.managers set sync_interval_seconds = 1200 where sync_interval_seconds is distinct from 1200;
