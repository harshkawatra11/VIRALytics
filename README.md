<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:4F46E5,40:7C3AED,100:A855F7&height=200&section=header&text=VIRALytics&fontSize=58&fontColor=ffffff&animation=fadeIn&fontAlignY=38" />

<a href="https://github.com/harshkawatra11/VIRALytics">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&duration=3400&pause=900&color=A855F7&center=true&vCenter=true&width=800&height=50&lines=Multi-tenant+social-media+analytics+SaaS+for+agencies;OAuth+private+metrics+the+public+scrapers+can't+see;BullMQ+queues+decouple+ingestion+from+API+serving;Cost-aware+hot%2Fcold+sync+%E2%80%94+~4x+cheaper+at+scale" alt="Typing SVG" />
</a>

<br/><br/>

<img src="https://img.shields.io/badge/Next.js%2015-1E1B4B?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/React%2019-4F46E5?style=for-the-badge&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/Node.js%20Worker-6D28D9?style=for-the-badge&logo=nodedotjs&logoColor=white" />
<img src="https://img.shields.io/badge/BullMQ%20·%20Redis-A855F7?style=for-the-badge&logo=redis&logoColor=white" />
<img src="https://img.shields.io/badge/PostgreSQL%20(Supabase)-7C3AED?style=for-the-badge&logo=postgresql&logoColor=white" />
<img src="https://img.shields.io/badge/Razorpay-5B21B6?style=for-the-badge&logo=razorpay&logoColor=white" />
<img src="https://img.shields.io/badge/Turborepo-1E1B4B?style=for-the-badge&logo=turborepo&logoColor=white" />

</div>

---

<div align="center">

**Track any YouTube / Instagram / TikTok account instantly — public viral-score analytics plus OAuth-connected private metrics (watch time, completion rate, CTR, saves, reach) the public scrapers can't see.**

</div>

---

## <img src="https://img.shields.io/badge/-What%20It%20Is-1E1B4B?style=flat-square" height="22"/> &nbsp; What It Is

VIRALytics is a production-grade analytics platform built as a **Shortimize alternative** for short-form content agencies. An agency manager connects or tracks any number of creator accounts across three platforms; the system continuously ingests engagement data, computes a per-post **viral score** (views vs. the account's own rolling average), and surfaces it in dashboards, collections, and CSV exports — with subscription billing, per-plan limits, and row-level tenant isolation throughout.

> **The differentiator over public-scraping competitors:** OAuth 2.0 integrations with the YouTube Analytics API, Instagram Graph API, and TikTok Display API pull *private* metrics on the user's own accounts — average watch time, completion rate, CTR, saves, and reach — that **no scraper can reach.**

---

## <img src="https://img.shields.io/badge/-Architecture-1E1B4B?style=flat-square" height="22"/> &nbsp; Architecture

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
                    └──────┬───────────┘      │  by month (pg_cron)  │
                           │ consume          └──────────▲───────────┘
                           ▼                             │ upsert + RPC
                    ┌──────────────────────────────────┐ │
                    │  apps/worker — standalone Node    │─┘
                    │  scrapers (Apify + 3 OAuth APIs)  │
                    │  sweeper · token refresher        │
                    │  backfill · scrape-quality guard  │
                    └───────────────────────────────────┘
```

> **Why two services:** ingestion is fully decoupled from API serving. Scrape jobs are slow (Apify actor runs take seconds to minutes), so they live in a standalone worker consuming BullMQ queues — dashboard latency is independent of background job load, and either side scales/deploys alone.

---

<details open>
<summary><b>⚙️ Job Pipeline — <code>apps/worker</code></b></summary>

<br/>

- **Per-platform queues** ([queues.ts](apps/worker/src/queues.ts)) — `youtube`, `instagram`, `tiktok`, plus a priority-separated `backfill` queue. Jobs retry 4× with exponential backoff (5m → 40m) and de-duplicate in-flight work by `jobType_accountId` job IDs.
- **Adaptive-cadence sweeper** ([sweeper.ts](apps/worker/src/sweeper.ts)) — classifies accounts **hot** (a post <48h old or a viral spike in the last 7 days → synced at full plan interval) vs. **cold** (synced at 4× the interval). This collapses Apify cost ~4× at Agency scale while keeping breakout posts fresh.
- **Scrape data-quality guard** ([scrape-monitor.ts](apps/worker/src/scrape-monitor.ts)) — Apify actors sometimes break silently and return zeros instead of erroring. The guard detects suspicious result shapes (zero posts from an active account, ≥80% posts with `views=0 AND likes=0`) and **quarantines the run before it corrupts viral scores**, alerting the operator instead of persisting.
- **Token refresher** ([token-refresh.ts](apps/worker/src/token-refresh.ts)) — a 6-hour loop that proactively refreshes OAuth tokens expiring within 10 days, per platform's own refresh protocol (TikTok rotates both tokens).
- **Backfill** ([backfill.ts](apps/worker/src/backfill.ts)) — reconstructs up to ~2,000 posts of history when an account is first added, so new users land on a populated dashboard.

</details>

<details>
<summary><b>🗄️ Data Layer — <code>supabase/migrations</code></b></summary>

<br/>

- **`post_metrics`** — the largest table in the system: time-series snapshots **RANGE-partitioned by month** on `recorded_at`, with a `pg_cron` job that creates next month's partition ahead of time.
- **Denormalized viral score** — `posts.viral_score` is recomputed per sync by a single `refresh_account_aggregates(account_id)` RPC, so reads never aggregate the raw time-series.
- **Row-level security** — every table is RLS-scoped to the owning manager; multi-tenancy is enforced **in the database**, not in application code.
- **Pre-aggregated overview RPCs** — dashboards read one RPC call, not N queries.

</details>

<details>
<summary><b>🔐 Security, Billing & Shared Core</b></summary>

<br/>

- OAuth tokens are stored **AES-256-GCM encrypted** ([crypto.ts](packages/core/src/crypto.ts)): random 12-byte IV per operation, GCM auth tag against tampering, 32-byte key held only in env vars — never in the database.
- **Razorpay subscriptions** with webhook-driven plan state, and per-plan limits (tracked accounts, sync interval) enforced **at the worker level**, not just in the UI.
- Upstash rate limiting on public API routes.
- **`packages/core`** is the single source of truth for the queue contract (web enqueues, worker consumes — same typed `SyncJobData`), the viral-score math and tier thresholds, Zod schemas, handle parsing, and crypto. Unit-tested with Vitest.

</details>

---

## <img src="https://img.shields.io/badge/-Tech%20Stack-1E1B4B?style=flat-square" height="22"/> &nbsp; Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=nextjs,react,ts,nodejs,redis,postgres,supabase,tailwind&theme=dark" />

</div>

| Layer | Choice |
| :--- | :--- |
| Web | Next.js 15, React 19, TypeScript, Tailwind CSS 4, TanStack Query/Table/Virtual, Recharts |
| Worker | Node.js 20, BullMQ 5, pino logging, Vitest |
| Data | PostgreSQL (Supabase) — partitioned time-series, RLS, RPCs, pg_cron |
| Cache/queues | Redis (BullMQ), Upstash rate limiting |
| Ingestion | Apify actors (public scrape) + YouTube Analytics / Instagram Graph / TikTok Display APIs (OAuth) |
| Billing | Razorpay subscriptions + webhooks |
| Monorepo | pnpm workspaces + Turborepo |

---

<details>
<summary><b>🚀 Running Locally</b></summary>

<br/>

```bash
pnpm install
cp .env.example .env          # Supabase, Redis, Apify, OAuth client + ENCRYPTION_KEY
supabase db push              # apply migrations (Supabase CLI)
pnpm dev                      # turbo runs web (:3000) + worker concurrently
```

The worker runs in **mock-scraper mode** without Apify credentials, so the full enqueue → process → persist → dashboard loop is testable offline.

```bash
pnpm test        # Vitest — core math, schemas, scraper parsing
pnpm typecheck   # strict TS across the workspace
```

</details>

---

## <img src="https://img.shields.io/badge/-Engineering%20Decisions-1E1B4B?style=flat-square" height="22"/> &nbsp; Engineering Decisions Worth Noting

1. **Cost as a first-class constraint.** Paid scraping means every sync has a marginal cost; the adaptive hot/cold sweeper cadence, the per-tick enqueue cap, and per-plan worker-enforced limits keep gross margin positive at the Agency tier — the sync scheduler is effectively a budget allocator.
2. **Trust boundaries in the database.** Tenant isolation is RLS, not `WHERE` clauses; plan limits are enforced where jobs execute, not where buttons render.
3. **Defensive ingestion.** Third-party scrapers fail in the worst way — plausible-looking empty data. The quality guard treats "no error" as insufficient evidence of success.
4. **One contract, two runtimes.** The shared core package keeps the web app and worker honest about job payloads and score semantics across independent deployments.

<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:A855F7,50:7C3AED,100:4F46E5&height=120&section=footer" />
</div>
