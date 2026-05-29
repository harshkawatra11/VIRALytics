-- ============================================================================
-- 0004 — collections (account groups, à la Shortimize "Collections") + join
-- NOTE: Shortimize collections group ACCOUNTS (Flo = 55 accounts -> 6257 videos),
-- not individual posts. A collection's videos = all posts of its member accounts.
-- ============================================================================

create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  manager_id  uuid not null references public.managers (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  color       text not null default '#7C3AED',
  created_at  timestamptz not null default now()
);
create index idx_collections_manager on public.collections (manager_id);

create table public.collection_accounts (
  collection_id uuid not null references public.collections (id) on delete cascade,
  account_id    uuid not null references public.tracked_accounts (id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  primary key (collection_id, account_id)
);
create index idx_collection_accounts_account on public.collection_accounts (account_id);

comment on table public.collections is
  'Named account group (Shortimize Collections). Videos shown = union of posts from member accounts.';
