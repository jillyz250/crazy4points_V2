# REFERENCE — Existing Systems Inventory

> **Check this FIRST, before building anything new** (per the Discovery-before-construction
> rule in CLAUDE.md). This is the living map of what already exists so we cross-reference
> and extend instead of rebuilding duplicates. **When you discover an existing system or a
> schema gotcha, add it here.** Grep + a DB schema check are still required — this is a head start,
> not a substitute.

## Sweet spots
- **`programs.sweet_spots`** — authored markdown bullets of sweet spots, PER PROGRAM. **112 of 142 active programs** have it (~610 bullets total). This is the real, vetted source of truth; rendered on each `/programs/[slug]` page. Do NOT re-research sweet spots from scratch — aggregate/structure these.
- `programs.marquee_redemption_id` — the headline redemption for a program.
- Guide: `app/(site)/guides/hyatt-points-sweet-spots` (content style target).
- Structured layer (new, 2026-08-26): `sweet_spots` table (mig 634) + spec `plans/sweet-spot-agent-spec.md` — should SOURCE from `programs.sweet_spots`, not blogs.

## Accuracy / transfer-data verification
- **`reverifyTransfers` weekly cron** (`/api/cron/reverify`, Sundays) → `verification_findings` table → `/admin/verification-findings`. Compares our `transfer_partners_outbound` vs a roster source; deterministic ratio math; emits WRONG_RATIO / MISSING. `VERIFICATION_SOURCES` const + `programs.reverify_source_url` enrollment. DO NOT rebuild scheduled transfer-drift detection.
- **Accuracy Agent** (new, 2026-08-26): `verifyClaim` (utils/ai/verifyClaim.ts) — on-demand fact-check + reconcile vs official + multi-source consensus; `official_sources` registry (mig 631/633); `claim_verifications` ledger; unified `/admin/agents` control center. See `reference_accuracy_agent_system` memory.

## Award / transfer data on `programs`
- `award_chart_structured` — 21 airlines, zone × cabin matrices (`charts[].partners[slug].matrix[zone][cabin]=points`).
- `award_category_chart`, `award_chart` — hotel category charts (mostly null / unstructured).
- `transfer_partners_outbound` — outbound partners with per-card `tiers[]` (premium/standard + eligible_card_slugs).
- `transfer_partners` — legacy/inbound (rendered by SimpleTileGrid as inbound).
- `partner_chart_url`, `transfer_bonuses_source_url`, `reverify_source_url`, `scrape_urls`.
- `content_updated_at` — SQL-authored program pages 404 without it.

## Cards
- `credit_cards` — `intro`, `good_to_know` (curated notes/SUB), `official_url` (**cards only — NOT on programs**), `annual_fee_usd`, `affiliate_url`. Benefits in the `credit_card_benefits` table. `benefits_human_curated` is a BOOLEAN flag, not the data.

## Alerts
- Source of truth: `content_variants` + `topics` (writes via `writeAlertVariant`; `alerts` is a trigger-synced mirror, direct mirror writes blocked by G6). `alert_programs` junction links alerts↔programs. Public URL = `/alerts/<topics.slug>`.

## Crons (`vercel.json`)
- run-scout, build-brief, intel-triage-sweep, content-ideas-sweep, question-radar, stale-drafts-sweep, card-bonus-monitor, build-newsletter, quarterly-rotating-refresh, **reverify**, nightly-snapshot, link-audit, auto-archive, auto-expire, experiences-*, announcement-monitor, audit-good-to-know, data-integrity, schedule-watch, sweepstakes-watch, recompute-surface-locations.

## Schema gotchas (silent-error traps)
- Selecting a NONEXISTENT column makes the WHOLE Supabase query error → returns null → looks like "no data" (not an error). Always log `error`. Known non-columns: `official_url` on programs, `program_type` on programs, `end_date`/`summary` on content_variants (those live on topics / are named `body`).
- `programs.scrape_urls` exists (~53/142). `reverify_source_url` drives reverify enrollment.

## Where things live
- Guides registry: `lib/guides.ts`. Perk chains: `lib/perkChains.ts` (the "Chain Reactions" guide). Shopping portals: `lib/shoppingPortals.ts`. Referrals: `lib/referrals.ts`.
- Firecrawl helpers: `utils/ai/firecrawl.ts` (fetchFirecrawl, fetchFirecrawlInteractive, mapFirecrawl). Source discovery: `utils/programs/discoverSourceUrls.ts`.
- Admin pages: `app/admin/(protected)/*` (drafts, triage, change-signals, program-drift, verification-findings, refresh-queue, agents, roadmap, …).
