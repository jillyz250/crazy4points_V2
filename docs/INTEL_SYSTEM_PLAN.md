# Intel System Master Plan

> Captured April 18, 2026. Authoritative plan for evolving the daily intel pipeline into a multi-source, multi-vertical, content-generating intelligence platform. Any model (Opus, Sonnet, Haiku) picking up this work should read this first.

---

## Vision

crazy4points becomes **the** place people go for up-to-the-minute news and advice on award travel. The intel system:

- Ingests from every meaningful source: official programs, blogs, Reddit, Google Alerts, program emails, X/Grok
- Uses a Writer agent to produce summaries, blog ideas, and a weekly newsletter draft
- Keeps a human-in-the-loop approval step (speed < trust)
- Is architected to swap verticals by changing sources + prompts, not code

---

## Current State (as of 2026-04-18)

**Built:**
- `intel_items` + `sources` Supabase tables (migrations `001`, `002`)
- `/api/run-scout` daily cron at 10:00 UTC (6am ET), see `vercel.json`
- `/api/ingest-intel` manual POST endpoint
- `utils/ai/runScout.ts` + `utils/ai/briefEmail.ts`
- Auto-stages `confidence = 'high'` findings as `pending_review` alerts
- Resend email sent daily, even on zero findings

**Seeded sources:** 9 official program pages, 5 blog RSS feeds, 8 subreddits.

**Gaps vs. vision:** Resend domain unverified; no Google Alerts; no email inbox ingestion; no Grok/X rumor mill; brief has no AI summaries, no blog ideas, no newsletter draft; no weekly newsletter; sources hard-coded to points/miles.

---

## Target Architecture

```
                    ┌─────────────────────────────────────┐
                    │  COLLECTORS (each runs independently)│
                    ├─────────────────────────────────────┤
                    │  • ScoutAgent (Claude + web search)  │
                    │  • RSSCollector (blogs + Google Alerts)│
                    │  • RedditCollector (OAuth)           │
                    │  • EmailInboxCollector (IMAP)        │
                    │  • GrokCollector (xAI API on X)      │
                    │  • TipSubmissionCollector (public)   │
                    └────────────────┬────────────────────┘
                                     ▼
                    ┌─────────────────────────────────────┐
                    │   intel_items (normalized inbox)    │
                    └────────────────┬────────────────────┘
                                     ▼
                    ┌─────────────────────────────────────┐
                    │   AnalyzerAgent (Claude Sonnet 4.6) │
                    │  • Dedup across 7-day window        │
                    │  • Score impact/value/rarity 1–10   │
                    │  • Confidence boost if ≥2 sources   │
                    │  • Extract deadlines + programs     │
                    │  • Classify: news / rumor / tip     │
                    └────────────────┬────────────────────┘
                                     ▼
                    ┌─────────────────────────────────────┐
                    │   WriterAgent (Claude Sonnet 4.6)   │
                    │  • AI summaries per alert           │
                    │  • Daily brief narrative            │
                    │  • Weekly newsletter draft (Sun)    │
                    │  • Blog post ideas + outlines       │
                    │  • Rumor Mill section               │
                    └────────────────┬────────────────────┘
                                     ▼
                    Daily email → Approve dashboard → Publish
```

**Why this shape:** each collector writes the same `intel_items` row shape. Adding a new source = new collector file. Switching verticals = reseeding `sources` + swapping the Scout/Writer prompts.

---

## New Source Types — Feasibility

### Google Alerts ✅ Easy
- Google Alerts → "Deliver to: RSS feed" → add each RSS URL to `sources` with `type = 'google_alert'`.
- No new code; existing RSS collector handles it.
- **Setup:** ~30 alerts (one per program × keyword combo).
- **Caveat:** spammy — route through Analyzer dedup + quality filter.

### Email inbox (program emails) ✅ Medium effort
**Option A — Dedicated Gmail + IMAP poll (recommended)**
- Create `intel@crazy4points.com`, sign up for program newsletters with it.
- Vercel cron hits `/api/collect-email` that pulls unread via `imapflow`, parses, writes to `intel_items` with `source_type = 'email'`.

**Option B — Resend inbound webhook**
- Forward program emails to a Resend inbound address → webhook → `intel_items`.
- Cleaner but relies on forwarding rules.

**Recommend Option A** — one dedicated inbox, no forwarding fragility.

### Grok / X rumor mill ⚠️ Doable, with caveats
- xAI `grok-beta` API has live X search built-in. Can ask "what are people saying about Chase transfer bonuses" with post citations.
- **Cost:** ~$7–10/mo for daily runs across ~10 programs (verify current pricing).
- **Limits:** Grok's search is a black box; rumors must label clearly; never auto-stage as `high`.
- Alternative (Nitter RSS) is unstable — not for production.

### Public tip submission ✅ Easy
- `/tip` form → `intel_items` with `source_type = 'user_tip'`, always `low` confidence.

### What's NOT possible
- **Real-time X firehose** — requires $5k/mo Enterprise. Grok is the only affordable proxy.
- **Airline award space monitoring** — no public API. Seats.aero / AwardFares are paid scrapers ($10–30/mo). Out of scope without subscription.
- **Chase/Amex login-walled offers** — legally can't scrape. Email ingestion is the workaround.
- **True real-time** — honest floor is ~1 hour. Can run cron hourly in peak hours to tighten.

---

## Content Expansion — Daily Email Becomes a Product

**Split the cron in two:**
- **6:00 UTC Collect** — runs all collectors, writes to `intel_items`. No email.
- **6:30 UTC Analyze + Write + Send** — runs Analyzer → Writer → sends brief.

Separation lets you re-run the writer without re-scraping.

### New daily email sections

| Section | Generated by | What it is |
|---|---|---|
| 🔥 Act Today | Analyzer | Urgency-sorted, deadline-color-coded cards |
| 📝 AI Summaries | Writer | 2–3 sentence expert summary per top alert |
| 💬 Rumor Mill | Grok collector | X chatter, clearly labeled unverified |
| ✍️ Blog Post Ideas (5) | Writer | Title + angle + SEO keywords + 3-bullet outline |
| 📬 Newsletter Draft (Sun) | Writer | Full HTML draft, ready to edit + send |
| 🔍 Industry Signals | Analyzer | Trend patterns across the week |
| ✅ Action Checklist | Analyzer | Prioritized, linked to approve/reject |

### WriterAgent
- File: `utils/ai/writerAgent.ts`
- Model: **Claude Sonnet 4.6** (`claude-sonnet-4-6`) — summaries need the smart model, not Haiku
- Input: Analyzer output + brand voice rules
- Output: structured JSON with `summaries`, `blog_ideas`, `newsletter_draft`, `rumor_mill_section`

### Weekly newsletter
- Sunday 8:00 UTC cron → `/api/build-weekly-newsletter`
- Pulls last 7 days of approved, published alerts
- Writer drafts full HTML → saves to new `newsletters` table with `status = 'draft'`
- `/admin/newsletter` page → review/edit/send via Resend broadcast
- **Not auto-sent** — always approve first

---

## Intelligence Quality Upgrades (code-only)

1. **Cross-day dedup** — check last 7 days of `intel_items` for similar `headline + programs` before staging; increment `dedup_count` instead of duplicating.
2. **Confidence boost** — same story from ≥2 source types in 48h auto-bumps to `high`.
3. **Firecrawl** ($16/mo) — unlocks JS-heavy official pages (biggest current blind spot).
4. **Source performance** — new columns on `sources`: `items_produced`, `items_approved`, `approval_rate`.
5. **Reddit OAuth** — replace unauthenticated scraping with `snoowrap` + app. Free, more posts + search.
6. **Alert expiry cron** — nightly sets `status = 'expired'` past `end_date`.
7. **One-click email approve** — tokenized link → `/api/approve-alert?token=…`.

---

## Vertical-Swap Architecture

**Keep vertical-agnostic** (reusable across wine, sneakers, watches, crypto, etc.):
- All collectors (`utils/collectors/*`)
- `intel_items` pipeline
- Analyzer scoring logic
- Admin UI + approve flow + scheduling

**Make vertical-specific** (stored in DB or config):
- `sources` table rows
- Scout prompt (`utils/ai/prompts/scout-points.md`)
- Writer brand voice + newsletter template
- Entity list (currently `programs` — generalize to `entities` if/when swapping)

**Don't extract yet.** Build it right for crazy4points first. Extract into a reusable `intel-engine` package only after a second vertical materializes. Structure `utils/ai/prompts/`, `utils/collectors/`, and seed SQL as obviously swappable.

---

## Build Order — 6 Phases (~3 weeks)

### Phase 1 — Quality foundation (3–4 days) ← start here
- Verify Resend domain for `crazy4points.com` (unblocks deliverability)
- Cross-day dedup + confidence boosting in Analyzer
- Source performance columns + admin view
- Split cron: Collect (6am) / Analyze+Write+Send (6:30am)

### Phase 2 — New source types (4–5 days) ✅ shipped (IMAP deferred to Phase 6)
- Google Alerts setup + RSS collector generalization ✅ (37 alerts wired in, April 2026)
- ~~IMAP email collector + `intel@crazy4points.com` setup~~ → moved to Phase 6
- Firecrawl for official pages ✅ (migration 004 + `utils/ai/firecrawl.ts`)

### Phase 3 — WriterAgent (3 days)
- `utils/ai/writerAgent.ts` with Sonnet 4.6
- AI summaries in daily brief
- Blog post ideas generator
- Upgraded email template

### Phase 4 — Rumor Mill (2 days)
- Grok / xAI integration
- Rumor Mill section of brief
- Clear "Unverified" labeling on site + email

### Phase 5 — Weekly newsletter (3 days)
- `newsletters` table + `/admin/newsletter` page
- Sunday cron → draft
- Resend broadcast with edit/approve flow

### Phase 6 — Polish (2–3 days)
- One-click email approve with tokens (note: shipping in Phase 3 as part of the brief rewrite)
- Alert expiry cron
- Reddit OAuth upgrade
- Public `/tip` submission form
- IMAP email collector + `intel@crazy4points.com` (deferred from Phase 2) — captures Chase/Amex targeted offers and other login-walled program emails

---

## Decisions Needed Before Build

1. **Grok budget** — OK to add ~$10/mo for xAI API?
2. **Firecrawl budget** — OK to add $16/mo for Firecrawl? (Biggest single quality lever.)
3. **Resend domain** — walk through `crazy4points.com` verification?
4. **Dedicated email** — `intel@crazy4points.com` the right address?
5. **Starting phase** — Phase 1 (foundation) or jump to Phase 3 (Writer) for visible content uplift first?

---

## Model Usage Guide

- **Sonnet 4.6 (`claude-sonnet-4-6`)** — AnalyzerAgent, WriterAgent, newsletter drafting. Anywhere quality of reasoning or writing matters.
- **Haiku 4.5 (`claude-haiku-4-5-20251001`)** — existing `summarizeAlert.ts`, cheap classification, dedup checks.
- **Opus 4.7 (`claude-opus-4-7`)** — one-off deep analysis, planning, complex prompt tuning. Not for production cron loops.

---

## Reference — Existing Files

- `app/api/run-scout/route.ts` — current daily cron
- `app/api/ingest-intel/route.ts` — manual POST endpoint
- `utils/ai/runScout.ts` — Scout agent implementation
- `utils/ai/briefEmail.ts` — email template
- `utils/ai/summarizeAlert.ts` — per-alert AI summary on publish
- `supabase/migrations/001_intel_items.sql` — intel_items schema
- `supabase/migrations/002_seed_sources.sql` — seeded sources
- `vercel.json` — cron config
