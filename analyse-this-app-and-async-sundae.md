# VIRALytics — Strategy & Build Plan (target: Shortimize switchers)

## Context

The user asked for an honest assessment of what's missing vs Shortimize and vidIQ, then
worked through the harder questions: is this even worth building, and for whom. The
conclusion that shaped this plan:

- **Don't build "a cheaper Shortimize for everyone"** — price is the weakest moat and the
  category is crowded.
- **Target a specific, qualified, reachable audience: people already on Shortimize who
  want to switch.** They understand the category, are already paying, and congregate
  somewhere you can find them (Shortimize subreddit, X replies, review sites).
- The strategy lives or dies on **one unknown — *why* people leave Shortimize** — and on
  **two foundations the current app gets wrong: unit economics and data reliability.**

This document is the build plan for that bet, defaulting to rigour over validation: the
first work is *not* features, it's proving the economics and finding the real switch
trigger. Features come after the foundation is sound.

---

## Where the app stands today (baseline)

**Strong:** 3-platform tracking (YT/IG/TikTok) via public scrape **+ OAuth deep
analytics** (watch time, completion, CTR, saves, reach — `apps/worker/src/scrapers/`)
viral score (`packages/core/src/viral-score.ts`), rich dashboards
(`apps/web/src/components/dashboard/`), collections, partitioned time-series
(`post_metrics`), CSV export, Razorpay billing, OAuth + token refresh, backfill up to
~2,000 posts/account (`apps/worker/src/backfill.ts`).

**The data foundation and UI are genuinely good.** The problems are reliability,
economics, and the absence of a reason to switch — not "can it store metrics."

---

## The two things that must be true before any feature work

### Gate 1 — Unit economics (do the math FIRST; it can kill the project)
~70% of value is **paid Apify scraping**. Every sync = a paid run. Current cadence is
broken: `supabase/migrations/0016_sync_interval_20min.sql` line 5 **force-updates every
manager to a 20-minute interval**, overriding the per-plan values in
`packages/core/src/constants.ts:41-44`.

| Plan | Price | Accounts | 0016 (20-min) syncs/mo | Intended (PLAN_CONFIG) |
|---|---|---|---|---|
| free | $0 | 3 | 6,480 | 90 |
| starter | $29 | 15 | 32,400 | 900 |
| pro | $49 | 50 | 108,000 | 6,000 |
| agency | $99 | 250 | **540,000** | 90,000 |

At even ~$0.001/run, Agency under 0016 ≈ **$540 COGS on a $99 sub** — you lose money on
every signup, free included.

**Actions:**
1. Treat 0016 as a bug — revert managers to their plan's interval (one-line migration).
   Do this before the sweeper is ever re-enabled.
2. Build the real margin model: pull the **actual** per-run cost of each Apify actor in
   use, multiply by the table above, add Supabase + Redis + hosting → **gross margin per
   plan**. If Agency is negative even at intended cadence, pricing/architecture changes
   before any feature ships.

### Gate 2 — Data reliability (the foundation every feature stands on)
The background sweeper is **intentionally disabled** (`apps/worker/src/index.ts:29`) —
data only refreshes while a browser tab is open. And when an Apify actor silently returns
`0`/`null` instead of erroring, **corrupt data flows straight into charts and viral
scores** with no detection.

**Actions (before turning sync frequency up):**
1. **Scrape data-quality monitoring** — alert the *operator* when an actor's null/zero
   rate spikes or post counts drop discontinuously; keep a fallback actor per platform.
2. **Adaptive cadence**, not a fixed clock — sync **new/hot posts** every few minutes
   (cheap, and powers breakout detection), **old/cold posts** rarely. This collapses
   Agency cost ~10× *and* improves freshness. It turns the cost problem into the wedge.
3. Re-enable background sync only on top of (1) and (2), driven by `due_accounts()`
   (`supabase/migrations/0008`) with jitter and per-plan cost caps.

---

## Step 0 — Find the real switch trigger (days, not weeks; before building)
The whole strategy assumes a reason people leave Shortimize. **Validate it, don't guess.**
- Read 20–30 real complaints: Shortimize subreddit, X/Twitter replies to their handle,
  G2 / Trustpilot / Capterra reviews, churn posts.
- Talk to 5–10 people considering leaving. Find the *one* repeated grievance.
- Map it to the wedge hypotheses below. Most likely landing spots are **"true private
  analytics on my own accounts"** (already half-built) or **"faster/real-time signal"** —
  **not** price (price-switchers are churny, low-LTV).

---

## Positioning & wedge

**Pitch:** *"Everything you track in Shortimize — your competitors and any public account —
plus true private analytics on your own connected accounts, faster breakout alerts, and
a one-click switch that keeps your history."*

Two differentiators this app can credibly own (one already half-built):
1. **Private OAuth analytics on your own accounts.** Shortimize is fundamentally a public
   scraper. This app already pulls watch time, completion rate, CTR, saves, reach via
   OAuth (`youtube-analytics.ts`, `instagram-graph.ts`, `tiktok-api.ts`). "See real
   numbers on your own posts Shortimize can't show you" is a genuine, shippable edge.
2. **Real-time breakout detection.** Velocity, not totals: "this post is pulling 5× its
   normal first-hour view rate — it's popping *now*," pushed within the hour. Incumbents
   report on the past; "act now" is a different value prop. Falls out of adaptive cadence.

---

## The switch bridge (the single highest-leverage feature)
People don't stay on Shortimize out of loyalty — they stay because leaving means losing
months of tracked accounts and history. **Kill that switching cost:**
- **One-click import:** paste/upload a Shortimize account list → bulk-create
  `tracked_accounts` and enqueue backfill for all.
- **History reconstruction:** lean on existing backfill (~2,000 posts/account) so the new
  user lands on a populated dashboard, not zero. Set an explicit "rebuilding your history"
  state.
This works regardless of which grievance brought them, and it directly attacks lock-in.

---

## Build roadmap (ordered; each phase gated on the one before)

### Phase 0 — Foundation (no user-facing features)
- Revert 0016; build the Apify margin model (Gate 1).
- Scrape data-quality monitoring + fallback actors (Gate 2).
- Design + implement adaptive cadence; re-enable sweeper safely on top of it.
- Run Step 0 customer discovery in parallel (no code dependency).

### Phase 1 — Land the switcher
- **Shortimize import + history backfill bridge.**
- **Sync health + re-authorize UX:** surface last successful sync and error state; add a
  reconnect button for accounts whose OAuth token failed (`token-refresh.ts` flips them to
  `error` today with no user prompt — a silent downgrade of a paid benefit).
- **Fully surface OAuth metrics** (watch time / completion / CTR / saves / reach) in
  dashboards and the video detail panel — collected today but under-shown.

### Phase 2 — The wedge: breakout detection + alerts
- Velocity-based early-viral detection on the adaptive-cadence hot path.
- Alerts: viral-hit, account-broke, weekly digest. Email first; model designed to extend
  to push/Slack. (Audience is mobile/notification-driven — keep this surface thin and fast.)
- **Upgrade the viral score** to power this honestly: blend first-24h velocity,
  follower-normalized reach, and time-decay; report a percentile vs the account's own
  history rather than the naive `views / avg_views` (which conflates "viral" with "old"
  and is unstable for new accounts). `packages/core/src/viral-score.ts`.

### Phase 3 — Parity features that retain switchers
- **Discovery v1:** in-network "Trending" feed (top movers by velocity across the user's.
  accounts/collections — cheap, data already exists) + a **swipe file** saved-posts type.
- **Team / agency:** members + roles, **client-shareable read-only dashboard links**,
  seat-aware billing. Aligns the Agency plan with its named audience (single-manager today).

### Phase 4 — Keep the promises / polish
- Ship the **public API** (advertised on pricing, unbuilt) or remove it until ready.
- Finish or hide **Creator Groups** (sidebar stub).
- **Custom date ranges**, scheduled **PDF/report exports**, shareable links.
- Label **scraped-approximate vs OAuth-true** metrics in the UI; stop summing
  incomparable cross-platform "views" into one number without disclosure.

### Phase 5 — Distribution (high-leverage, optional)
- **Browser extension** for one-click "track this account/video" from the platform —
  top-of-funnel à la vidIQ/Shortimize.
- **PWA + push** for the mobile, notification-first audience.

*(vidIQ-style AI/SEO growth tooling — keyword research, title/thumbnail AI, channel
audit — is a separate, larger bet and deliberately out of scope. A realistic AI wedge
later is **insight not search**: "why did this post pop," hooks extracted from the user's, own top performers, using the post corpus already stored.)*

---

## Critical files (by area)
- Economics / cadence: `supabase/migrations/0016_sync_interval_20min.sql`,
  `packages/core/src/constants.ts`, `apps/worker/src/index.ts`, `queues.ts`, `config.ts`,
  `supabase/migrations/0008_due_accounts.sql`.
- Scrape layer / monitoring: `apps/worker/src/scrapers/` (`apify.ts`, `index.ts`,
  `instagram-graph.ts`, `tiktok-api.ts`, `youtube.ts`, `youtube-analytics.ts`),
  `apps/worker/src/persist.ts`, `processor.ts`.
- Switch bridge / backfill: `apps/worker/src/backfill.ts`,
  `apps/web/src/app/api/accounts/route.ts`, `apps/web/src/app/api/backfill/start/`.
- Viral score: `packages/core/src/viral-score.ts`.
- OAuth metrics surfacing: `apps/web/src/components/video-detail-panel.tsx`,
  dashboards under `apps/web/src/components/dashboard/`, RPCs `manager_overview` /
  `account_overview` (`migrations/0013`, `0014`).
- Re-auth UX: `apps/worker/src/token-refresh.ts`,
  `apps/web/src/components/connect-oauth-button.tsx`.

---

## Verification
- **Gate 1 (economics):** produce a per-plan margin table from real Apify actor prices;
  decision artifact, not code. Pass = positive gross margin on every paid plan.
- **Adaptive cadence / sweeper:** with the app fully closed, confirm `sync_jobs` rows and
  fresh `post_metrics` appear at the expected per-tier cadence (hot vs cold posts differ);
  confirm Apify spend stays under the budget guard. Inspect via Supabase MCP
  (`execute_sql` on `sync_jobs`, `post_metrics`) and worker logs.
- **Scrape monitoring:** force an actor to return nulls (mock mode) → operator alert fires;
  corrupt data is quarantined, not persisted.
- **Switch bridge:** import a sample account list → all accounts created, backfill enqueued,
  dashboard populated with reconstructed history within the expected window.
- **Breakout detection:** seed a high first-hour view delta → alert fires once, idempotent.
- **Everything else:** run web + worker locally, exercise new routes, confirm RLS still
  scopes data to the owning manager/team.

---

## Summary
Build it — but **not** as a cheaper clone for the broad market. Target **Shortimize
switchers**, win on **private OAuth analytics + real-time breakout detection**, and remove
the switching cost with a **one-click import + history bridge**. Before any of that, clear
two gates the current code fails: **prove the unit economics** (kill the 0016 20-min
override, model real Apify cost) and **make data reliable** (monitoring + adaptive cadence
before re-enabling sync). And before writing the bridge, spend a few days confirming the
real reason people leave Shortimize — the strategy's one load-bearing assumption.
