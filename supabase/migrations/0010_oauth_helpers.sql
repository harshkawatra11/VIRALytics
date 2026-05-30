-- ============================================================================
-- 0010 — helper view + function for OAuth token refresh queue.
-- tokens_needing_refresh: tokens expiring in <10 days and not failed out.
-- mark_token_refresh_failure: increments failure counter; pauses at 3 failures.
-- ============================================================================

create or replace view public.tokens_needing_refresh as
  select pt.*, ta.manager_id
    from public.platform_tokens pt
    join public.tracked_accounts ta on ta.id = pt.account_id
   where pt.refresh_failure_count < 3
     and (
       pt.token_expires_at is null  -- refresh proactively for Instagram 60d tokens
       or pt.token_expires_at < now() + interval '10 days'
     )
     and pt.last_refreshed_at < now() - interval '23 hours'; -- don't hammer

comment on view public.tokens_needing_refresh is
  'Tokens due for a refresh, used by the worker token-refresh queue. Service-role only.';

create or replace function public.mark_token_refresh_failure(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.platform_tokens
     set refresh_failure_count = refresh_failure_count + 1
   where account_id = p_account_id;

  -- After 3 failures, surface the error on the account
  update public.tracked_accounts
     set status = 'error'
   where id = p_account_id
     and (select refresh_failure_count from public.platform_tokens where account_id = p_account_id) >= 3;
end;
$$;
