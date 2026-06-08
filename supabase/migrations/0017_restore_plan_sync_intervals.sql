-- ============================================================================
-- 0017 — Restore per-plan sync intervals.
-- 0016 incorrectly force-set every manager to 1200s (20 min), obliterating the
-- plan-based cadence. This migration restores the correct interval per plan and
-- resets the column default to the free-plan value (24h) so new signups land on
-- the right tier until the billing webhook upgrades them.
-- ============================================================================

-- Restore per-manager sync_interval_seconds from their current plan.
update public.managers set sync_interval_seconds =
  case plan
    when 'starter' then 43200   -- 12h
    when 'pro'     then 21600   -- 6h
    when 'agency'  then 7200    -- 2h
    else                86400   -- free: 24h
  end;

-- Reset the column default to free-plan cadence (not 1200s).
alter table public.managers
  alter column sync_interval_seconds set default 86400;
