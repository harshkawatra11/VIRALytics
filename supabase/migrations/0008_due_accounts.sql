-- ============================================================================
-- 0008 — due_accounts(): the sweeper's hot path. Returns active accounts whose
-- last sync is older than their manager's plan interval, oldest first. Doing
-- the join + threshold in SQL keeps the sweeper O(batch) regardless of scale.
-- ============================================================================

create or replace function public.due_accounts(p_limit integer default 200)
returns table (
  id          uuid,
  manager_id  uuid,
  platform    text,
  handle      text,
  platform_id text
)
language sql
stable
security definer
set search_path = public
as $$
  select ta.id, ta.manager_id, ta.platform, ta.handle, ta.platform_id
    from public.tracked_accounts ta
    join public.managers m on m.id = ta.manager_id
   where ta.status = 'active'
     and (
       ta.last_synced_at is null
       or ta.last_synced_at < now() - make_interval(secs => m.sync_interval_seconds)
     )
   order by ta.last_synced_at asc nulls first
   limit p_limit;
$$;

comment on function public.due_accounts is
  'Sweeper source: active accounts overdue for sync per their manager plan interval.';
