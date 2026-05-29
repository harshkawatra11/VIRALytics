# Database (Supabase)

Ordered migrations in `migrations/` define the full schema, RLS, monthly
partitioning, and maintenance functions.

## Apply to the linked remote project

```bash
# one-time
supabase link --project-ref <your-ref>

# apply all migrations
supabase db push
```

Or paste each `migrations/000N_*.sql` (in order) into the Supabase SQL editor.

## Migration order

| File | Contents |
|------|----------|
| 0001 | extensions (pgcrypto, pg_cron), `managers`, signup trigger |
| 0002 | `tracked_accounts`, `platform_tokens` (service-role only) |
| 0003 | `posts` (denormalized current metrics), `post_metrics` (monthly partitioned), `account_snapshots` |
| 0004 | `collections` + `collection_accounts` (collections group **accounts**) |
| 0005 | `sync_jobs` audit log |
| 0006 | RLS policies for all tenant tables |
| 0007 | pg_cron partition maintenance + `refresh_account_aggregates` RPC |

## Regenerate TypeScript types after schema changes

```bash
supabase gen types typescript --linked > packages/core/src/db-types.ts
```

(The committed `db-types.ts` is hand-authored to match these migrations.)

## Notes

- `pg_cron` must be enabled in the Supabase dashboard (Database → Extensions) if
  `create extension pg_cron` is restricted on your plan.
- `platform_tokens`, `post_metrics`, `account_snapshots` have RLS enabled with
  **no policies** — only the service role (worker + server routes) can read them.
