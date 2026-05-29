-- ============================================================================
-- 0006 — Row Level Security for all tenant tables.
-- Isolation backstop: even if app code forgets an ownership check, Postgres
-- appends the tenant filter. platform_tokens / post_metrics / account_snapshots
-- were already locked to service-role-only (RLS on, no policies) in 0002/0003.
-- ============================================================================

-- Helper: does the current user own this tracked account? SECURITY DEFINER so
-- the policy can read tracked_accounts regardless of that table's own RLS.
create or replace function public.owns_account(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tracked_accounts ta
    where ta.id = p_account_id and ta.manager_id = auth.uid()
  );
$$;

-- managers: a user sees only their own row.
alter table public.managers enable row level security;
create policy managers_select on public.managers
  for select using (id = auth.uid());
create policy managers_update on public.managers
  for update using (id = auth.uid()) with check (id = auth.uid());

-- tracked_accounts: scoped by manager_id.
alter table public.tracked_accounts enable row level security;
create policy tracked_select on public.tracked_accounts
  for select using (manager_id = auth.uid());
create policy tracked_insert on public.tracked_accounts
  for insert with check (manager_id = auth.uid());
create policy tracked_update on public.tracked_accounts
  for update using (manager_id = auth.uid()) with check (manager_id = auth.uid());
create policy tracked_delete on public.tracked_accounts
  for delete using (manager_id = auth.uid());

-- posts: ownership flows through the parent account.
alter table public.posts enable row level security;
create policy posts_select on public.posts
  for select using (public.owns_account(account_id));

-- collections: scoped by manager_id.
alter table public.collections enable row level security;
create policy collections_select on public.collections
  for select using (manager_id = auth.uid());
create policy collections_insert on public.collections
  for insert with check (manager_id = auth.uid());
create policy collections_update on public.collections
  for update using (manager_id = auth.uid()) with check (manager_id = auth.uid());
create policy collections_delete on public.collections
  for delete using (manager_id = auth.uid());

-- collection_accounts: ownership flows through the parent collection.
alter table public.collection_accounts enable row level security;
create policy collection_accounts_select on public.collection_accounts
  for select using (
    exists (select 1 from public.collections c
            where c.id = collection_id and c.manager_id = auth.uid())
  );
create policy collection_accounts_insert on public.collection_accounts
  for insert with check (
    exists (select 1 from public.collections c
            where c.id = collection_id and c.manager_id = auth.uid())
    and public.owns_account(account_id)
  );
create policy collection_accounts_delete on public.collection_accounts
  for delete using (
    exists (select 1 from public.collections c
            where c.id = collection_id and c.manager_id = auth.uid())
  );

-- sync_jobs: read-only to the owning manager (writes happen via service role).
alter table public.sync_jobs enable row level security;
create policy sync_jobs_select on public.sync_jobs
  for select using (public.owns_account(account_id));
