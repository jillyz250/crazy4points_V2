# Digest Intelligence + Drift Detector — Build Plan
*2026-06-30 · follow-on to the monitoring consolidation (PRs #956/#957)*

Goal: make the Daily Data Digest **accurate** (only genuinely-new, non-duplicate, still-relevant items), **earlier** (~7am ET), and **broader** (official sources + program-page drift), and fold in the last separate email (good-to-know).

## Round 1 — Smarter, earlier digest (PR 1)
1. **Dedupe look-alikes** — collapse `change_signals` with same `(program_slug, signal_type)` + fuzzy-similar summary (render-time in buildDigest). Kills the Etihad ×2 / Wyndham ×2 noise.
2. **Cross-check vs published alerts** — for each finding, look for a `published` alert covering the same program+topic; if found, mark "already covered" and drop from 🔴.
3. **Cross-check vs program pages** — heuristic: if the program's `quirks`/`award_chart`/`content_updated_at` already reflects the change keywords, mark handled. (Best-effort; conservative — only suppress on a strong match.)
4. **Stale published-alert flag** — new digest sub-section: evergreen alerts (no `end_date`) whose text references a past month/date, or published long ago. Caught today: "Chase Freedom 25K Ends April 30", Hyatt "book before May", "7 Hyatt hotels effective February".
5. **Auto-clear expired bonus findings** — `transfer_bonus` change_signals whose end-date (parsed from summary, e.g. "ends 2026-06-30") has passed → auto-set `status='dismissed'`.
6. **Use the 228 official sources, not 7 blogs.** DESIGN DECISION: do NOT re-scrape 228 newsrooms in the change monitor (~228 credits/run ≈ 6,800/mo — prohibitive). Instead **classify Scout's existing `intel_items`** (Scout already scrapes ~229 sources daily) for transfer-partner/ratio/devaluation changes → writes `change_signals`. Huge coverage gain at ~zero extra Firecrawl. Keep the 7-blog scrape as a thin supplement only if a gap shows.
7. **Earlier delivery** — move welcome-bonus cron 13:00→10:00 UTC and digest 13:30→11:00 UTC (~7am ET) so a complete digest is waiting at 7:30.
8. **Scout health** — instrument `run-scout` with cron_runs (stops the ⚪).
9. **One-time cleanup** — dismiss today's expired/duplicate signals so tomorrow starts clean.
10. **Feedback loop** — when an alert is published, a program page is updated, or a signal is dismissed, auto-clear matching `change_signals` (status='dismissed' or 'resolved') so handled items never reappear. (#2/#3 cover the read-side; this closes the write-side.)

## Round 2 — Drift detector (PR 2)
11. Watch **program pages** directly: periodically scrape each program's official source, have Claude extract structured facts (tiers, fees, ratios, partners, redemption rules), compare to stored values, and write a `verification_finding` on any change — even when no blog reports it. Builds on Round 1's #6 (official-source classification) by comparing against OUR stored facts, not just detecting news.

## Round 3 — Good-to-know fold-in (PR 3, needs migration)
12. New `good_to_know_signals` table (prod migration — needs Jill OK) → weekly audit persists flags there → digest reads them in 🟡 Verify → retire the standalone weekly email.

## Parked (not building)
- Quiet recurring promos (Bilt Rent Day etc.) — down-rank repeats. Revisit if they become noisy.

## Sequencing
PR 1 (Round 1) → PR 2 (drift detector) → PR 3 (good-to-know). Each reviewable on its own. Round 1's quick deterministic items (1, 4, 5, 7, 8, 9) land first; the smart items (2, 3, 6, 10) are the LLM/cross-check layer.
