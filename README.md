<div align="center">

# VIRALytics

### Multi-tenant social-media analytics SaaS for agencies

Track any YouTube / Instagram / TikTok account instantly — public viral-score analytics
plus **OAuth-connected private metrics** (watch time, completion rate, CTR, saves, reach)
the public scrapers can't see.

`Next.js 15` · `React 19` · `Node.js worker` · `BullMQ / Redis` · `PostgreSQL (Supabase)` · `Razorpay` · `Apify`

</div>

---

## What it is

VIRALytics is a production-grade analytics platform built as a **Shortimize alternative**
for short-form content agencies. An agency manager connects or tracks any number of
creator accounts across three platforms; the system continuously ingests engagement data,
computes a per-post **viral score** (views vs. the account's own rolling average), and
surfaces it in dashboards, collections, and CSV exports — with subscription billing,
per-plan limits, and row-level tenant isolation throughout.

The differentiator over public-scraping competitors: **OAuth 2.0 integrations with the
YouTube Analytics API, Instagram Graph API, and TikTok Display API** pull *private*
metrics on the user's own accounts — average watch time, completion rate,
click-through rate, saves, and reach — that no scraper can reach.

## Architecture

A pnpm + Turborepo monorepo with two deployable apps and one shared package:

```
                    ┌──────────────────────────────────────────────┐
                    │  apps/web — Next.js 15 (App Router)          │
  Browser ───────▶  │  dashboards · collections · OAuth flows      │
                    │  billing · auth · 25+ API route handlers     │
                    └──────┬──────────────────────────┬────────────┘
                           │ enqueue (BullMQ)         │ SQL + RPC (RLS-scoped)
                           ▼                          ▼
                    ┌─────────────────┐      ┌──────────────────────┐
                    │  Redis           │      │  PostgreSQL          │
                    │  4 queues:       │      │  (Supabase)          │
                    │  yt / ig / tt /  │      │  post_metrics is     │
                    │  backfill        │      │  RANGE-partitioned   │
                    └──────┬───────────┘      │  by month (pg_cron   │
                           │ consume          │  creates partitions) │
                           ▼                  └──────────▲───────────┘
                    ┌──────────────────────────────────┐ │ upsert + RPC
                    │  apps/worker — standalone Node    │─┘
                    │  scrapers (Apify + 3 OAuth APIs)  │
                    │  sweeper · token refresher        │
                    │  backfill · scrape-quality guard  │
                    └───────────────────────────────────┘
```

**Why two services:** ingestion is fully decoupled from API serving. Scrape jobs are
slow (Apify actor runs take seconds to minutes), so they live in a standalone worker
consuming BullMQ queues — dashboard latency is independent of background job load, and
either side scales/deploys alone.

### Job pipeline (`apps/worker`)

- **Per-platform queues** ([queues.ts](apps/worker/src/queues.ts)) — `youtube`,
  `instagram`, `tiktok`, plus a priority-separated `backfill` queue. Jobs retry 4×
  with exponential backoff (5m → 40m) and de-duplicate in-flight work by
  `jobType_accountId` job IDs.
- **Adaptive-cadence sweeper** ([sweeper.ts](apps/worker/src/sweeper.ts)) — finds
  overdue accounts via a `due_accounts()` SQL RPC, then classifies them **hot** (a post
  <48h old or a viral spike in the last 7 days → synced at full plan interval) vs.
  **cold** (synced at 4× the interval). This collapses Apify cost ~4× at Agency scale
  while keeping breakout posts fresh. A per-tick job cap bounds worst-case spend even
  after a backlog.
- **Scrape data-quality guard** ([scrape-monitor.ts](apps/worker/src/scrape-monitor.ts)) —
  Apify actors sometimes break silently and return zeros/nulls instead of erroring.
  The guard detects suspicious result shapes (zero posts from an active account, ≥80%
  posts with `views=0 AND likes=0`) and **quarantines the run before it can corrupt
  viral scores and charts**, alerting the operator instead of persisting.
- **Token refresher** ([token-refresh.ts](apps/worker/src/token-refresh.ts)) — a 6-hour
  loop that proactively refreshes OAuth tokens expiring within 10 days, per platform's
  own refresh protocol (TikTok rotates both tokens).
- **Backfill** ([backfill.ts](apps/worker/src/backfill.ts)) — reconstructs up to ~2,000
  posts of history when an account is first added, so new users land on a populated
  dashboard.

### Data layer (`supabase/migrations`)

- **`post_metrics`** — the largest table in the system: time-series snapshots
  **RANGE-partitioned by month** on `recorded_at`, with a `pg_cron` job that creates
  next month's partition ahead of time
  ([0003](supabase/migrations/0003_content_metrics.sql),
  [0007](supabase/migrations/0007_maintenance_functions.sql)).
- **Denormalized viral score** — `posts.viral_score` is recomputed per sync by a single
  `refresh_account_aggregates(account_id)` RPC, so reads never aggregate the raw
  time-series.
- **Row-level security** ([0006](supabase/migrations/0006_rls.sql)) — every table is
  RLS-scoped to the owning manager; multi-tenancy is enforced in the database, not in
  application code.
- **Pre-aggregated overview RPCs** ([0013](supabase/migrations/0013_overview_enriched.sql),
  [0014](supabase/migrations/0014_account_overview.sql)) — dashboards read one RPC call,
  not N queries.

### Security & billing

- OAuth tokens are stored **AES-256-GCM encrypted** ([crypto.ts](packages/core/src/crypto.ts)):
  random 12-byte IV per operation, GCM auth tag against tampering, 32-byte key held only
  in env vars — never in the database.
- **Razorpay subscriptions** with webhook-driven plan state
  ([webhooks/razorpay](apps/web/src/app/api/webhooks/razorpay)), and per-plan limits
  (tracked accounts, sync interval) enforced **at the worker level**, not just in the UI.
- Upstash rate limiting on public API routes.

### Shared core (`packages/core`)

Single source of truth for the **queue contract** (web enqueues, worker consumes — same
typed `SyncJobData`), the **viral-score math and tier thresholds** (worker persists the
number, UI colors it, neither can drift), Zod schemas, platform handle parsing, and the
crypto module. Unit-tested with Vitest.

## Frontend

Next.js 15 App Router with route groups: `(marketing)` landing + pricing, `(auth)`
login/signup/reset, `(dashboard)` accounts · collections · videos · settings. Data layer
is TanStack Query over the API routes, TanStack Table + Virtual for large post lists,
Recharts for time-series, Tailwind CSS 4, Framer Motion. The video detail panel surfaces
the OAuth-only metrics (watch time, completion rate, CTR, saves, reach) alongside the
public ones.

## Tech stack

| Layer | Choice |
|---|---|
| Web | Next.js 15, React 19, TypeScript, Tailwind CSS 4, TanStack Query/Table/Virtual, Recharts |
| Worker | Node.js 20, BullMQ 5, pino logging, Vitest |
| Data | PostgreSQL (Supabase) — partitioned time-series, RLS, RPCs, pg_cron |
| Cache/queues | Redis (BullMQ), Upstash rate limiting |
| Ingestion | Apify actors (public scrape) + YouTube Analytics / Instagram Graph / TikTok Display APIs (OAuth) |
| Billing | Razorpay subscriptions + webhooks |
| Monorepo | pnpm workspaces + Turborepo |

## Running locally

```bash
pnpm install
cp .env.example .env          # Supabase, Redis, Apify, OAuth client + ENCRYPTION_KEY

# Apply migrations (Supabase CLI)
supabase db push

pnpm dev                      # turbo runs web (:3000) + worker concurrently
```

The worker runs in **mock-scraper mode** without Apify credentials, so the full
enqueue → process → persist → dashboard loop is testable offline.

```bash
pnpm test        # Vitest — core math, schemas, scraper parsing
pnpm typecheck   # strict TS across the workspace
```

## Engineering decisions worth noting

1. **Cost as a first-class constraint.** Paid scraping means every sync has a marginal
   cost; the adaptive hot/cold sweeper cadence, the per-tick enqueue cap, and per-plan
   worker-enforced limits exist to keep gross margin positive at the Agency tier — the
   sync scheduler is effectively a budget allocator.
2. **Trust boundaries in the database.** Tenant isolation is RLS, not `WHERE` clauses;
   plan limits are enforced where jobs execute, not where buttons render.
3. **Defensive ingestion.** Third-party scrapers fail silently in the worst way —
   plausible-looking empty data. The quality guard treats "no error" as insufficient
   evidence of success.
4. **One contract, two runtimes.** The shared core package keeps the web app and worker
   honest about job payloads and score semantics across independent deployments.
