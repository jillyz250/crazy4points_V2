# Crazy4Points — Monitoring Consolidation Plan
*v2 · 2026-06-29 · incorporates Copilot + ChatGPT reviews*

## v2 review synthesis (what changed from v1)
Both reviewers approved the core design (≈9.7/10 from ChatGPT) and converged on the same upgrades. Adopted into this plan:
1. **Richer cron health** — `cron_runs` rows must be written *unconditionally* every run with: `started_at`, `finished_at`, `duration_ms`, `records_checked`, `records_changed`, `firecrawl_calls`, `firecrawl_failures`, `anthropic_calls`, `anthropic_failures`, `status`. Digest flags any monitor with no row in >24h as 🔴, and **writes its own row** so a digest failure is detectable. Health section shows run/finish/runtime/signal-count per monitor.
2. **Priority-grouped digest, not monitor-grouped** — render 🔴 Needs review / 🟡 Verify / 🟢 System, with a summary header (New / Critical / Needs-review / Verify / System-health). Query monitor-by-monitor internally; don't expose cron architecture in the email.
3. **Pre-deletion sanity check on the Firecrawl Monitor** — before deleting, scrape 1–2 hard issuers (e.g. Amex) through the cron's `/v1/scrape` path and confirm welcome-bonus text extracts correctly. Only delete if `/v2/monitor` has no JS-render / redirect-following / stealth advantage the cron lacks. ~15 min.
4. **Welcome-bonus scan cadence — DECISION PENDING** (the one substantive open item, see Firecrawl section). Reviewers favor a fuller sweep to close the short-lived-offer blind spot; corrected cost math below shows daily-full actually costs *more* than today, so this is a real coverage-vs-cost call. **Recommended: 40/day (2-day sweep).**
5. **Program-fact drift detector → promoted** from "known gap" to **Next Major Monitoring Project** (own effort, not part of this build). Both reviewers call it the highest-impact strategic move.
6. **Rollout discipline** — change one variable at a time: delete the Monitor + ship the digest, observe a month, *then* revisit scan frequency/cost.

## Goal
Replace up-to-7 scattered monitor emails per day with **two intentional daily emails**, and cut redundant Firecrawl spend — without losing any detection coverage.

The owner (Jill) reviews every signal manually before anything is posted, so **same-day push is not required**. That single fact is what makes the redundant real-time path safe to remove.

---

## Decision
1. Collapse the 6 scattered monitor emails into **one daily Data Digest** ("what to fix / review").
2. Auto-email the existing **Editorial Daily Brief** separately ("what to write"). 2 intentional daily emails total.
3. **Retire the Firecrawl Monitor product** (the real-time welcome-bonus push), since same-day timing is no longer needed.

## Why retiring the Firecrawl Monitor is safe (no coverage gap)
- Welcome-bonus detection runs **two ways today**:
  - daily cron `scanCardBonuses` — `app/api/cron/card-bonus-monitor/route.ts` (25 cards/run, rotating through ~80, full sweep every ~3–4 days)
  - Firecrawl Monitor webhook — `app/api/webhooks/firecrawl-monitor/route.ts`
- **Both call the identical extractor** (`extractCardBonusFromUrl` → `fetchFirecrawl`) and **both write to the same `card_bonus_signals` table.** The daily cron's URL set is a **superset** of the Monitor's.
- Retiring the Monitor removes only the redundant real-time path. The cron keeps full coverage. ✅
- Per project memory, the Firecrawl Monitor was a **pilot meant to replace** the daily cron (parallel-run, then retire one). This plan completes that decision by retiring the Monitor, not the cron.

---

## Coverage matrix — what stays monitored after the change

| # | What's watched | Engine / file | Frequency | Stored in | Surfaces at | In digest? |
|---|---|---|---|---|---|---|
| 1 | **Welcome / sign-up bonuses** (cards) | `scanCardBonuses` daily cron | Daily, 25/run (~80 cards / ~3–4 days) | `card_bonus_signals` | /admin/card-bonuses | ✅ |
| 2 | **Transfer partners added / dropped** | `scanAnnouncements` | Daily 08:30 UTC | `change_signals` | /admin/change-signals | ✅ |
| 3 | **Transfer ratio changes** | `scanAnnouncements` | Daily | `change_signals` | /admin/change-signals | ✅ |
| 4 | **Devaluations / award-chart changes** (how Wyndham + Hilton were caught) | `scanAnnouncements` (7 blogs/newsrooms) | Daily | `change_signals` | /admin/change-signals | ✅ |
| 5 | **Transfer bonuses (promos)** | `scanTransferBonuses` (2 aggregators) | Every 3 days | `change_signals` (type=`transfer_bonus`) | /admin/change-signals | ✅ |
| 6 | **Data integrity** (orphan slugs, bad ratios, dupes, missing currency flags) | `runIntegrityChecks` (DB-only, no Firecrawl) | Daily 08:00 UTC | `change_signals` | /admin/data-integrity | ✅ (always, incl. "clean") |
| 7 | **Transfer-data drift re-verify** (ghost / missing / wrong-ratio vs roster) | `reverifyTransfers` (8 programs/run) | Weekly Sun 09:00 | `verification_findings` | re-verify view | ✅ |
| 8 | **Card "good-to-know" accuracy** (Sonnet vs stored) | `auditGoodToKnow` (no Firecrawl) | Weekly Mon 13:00 | flagged in run | (email today) | ✅ |
| 9 | **Rotating bonus categories** (cards) | `quarterly-rotating-refresh` | 2×/quarter | `credit_cards` | — | ❌ (maintenance, not a signal) |
| 10 | **Editorial intel → blog/newsletter ideas** | Scout → Build Brief | Daily | `intel_items`, `content_ideas`, `daily_briefs` | /admin (brief) | ❌ → **separate Editorial Brief email** |

Every "review/fix" signal (1–8) lands in the one Data Digest. Editorial (10) is its own daily email. Quarterly maintenance (9) needs no email.

---

## The two daily emails

### 📊 Email 1 — Daily Data Digest
New handler `app/api/cron/daily-digest/route.ts`, runs ~13:30 UTC (after the last detector; lands first-thing ET). **Always sends once daily** — silence = something broke. **State-based** (reflects current unreviewed state, not just "what changed since last email"). Queries each table internally but **renders by priority, not by monitor**:

**Header (2-second state read):**
> Daily Data Digest — Jun 29 · New: 9 · Critical: 2 · Needs review: 5 · Verify: 2 · System: Healthy

**🔴 Needs review today** — `change_signals` status=`new` (transfer/award/devaluation, rows 2–5) + `card_bonus_signals` unreviewed (row 1) + data-integrity high (row 6). Each line links to its admin page.

**🟡 Verify** — `verification_findings` new (row 7) + data-integrity med (row 6) + good-to-know flagged (row 8, weekly).

**🟢 System health** — per-monitor table: did it run / did it finish / runtime / signals produced; flag any monitor with no `cron_runs` row in >24h as 🔴. The digest writes its own `cron_runs` row.

Empty groups render as a one-line "clear."

### ✍️ Email 2 — Editorial Daily Brief
Existing `app/api/build-brief/route.ts`. Flip the auto-email on (today it only sends with `?email=1`). Content/blog/newsletter ideas. Otherwise untouched. Kept separate by deliberate choice — different audience ("what to write" vs "what to fix").

---

## Implementation steps (file-level) — ordered, one variable at a time
1. **`cron_runs` schema** — ensure (or migrate) a `cron_runs` table with: `monitor` (text), `started_at`, `finished_at`, `duration_ms`, `records_checked`, `records_changed`, `firecrawl_calls`, `firecrawl_failures`, `anthropic_calls`, `anthropic_failures`, `status` (ok|error), `error` (text null). Each detector writes one row **unconditionally** at the end of every run (success or fail). This is the backbone of the health section — build it first.
2. **New** `app/api/cron/daily-digest/route.ts` — query each source table for unreviewed rows + `cron_runs` for the last 24h, render priority-grouped HTML, one Resend send, write its own `cron_runs` row. Auth via `CRON_SECRET`.
3. **Strip the inline `emails.send` blocks** from the 6 crons (keep ALL detection / DB-write logic):
   - `app/api/cron/announcement-monitor/route.ts`
   - `app/api/cron/card-bonus-monitor/route.ts`
   - `app/api/cron/transfer-bonus-monitor/route.ts`
   - `app/api/cron/data-integrity/route.ts`
   - `app/api/cron/audit-good-to-know/route.ts`
   - `app/api/cron/reverify/route.ts`
4. **Build-brief**: enable auto-email (default the send on, or add a daily cron that calls it with email).
5. **Welcome-bonus cadence**: set `MAX_CARDS_PER_RUN = 40` in `app/api/cron/card-bonus-monitor/route.ts` (2-day sweep — LOCKED).
6. **Sanity-check, THEN retire the Firecrawl Monitor**: first scrape 1–2 hard issuers (Amex) through the cron's `/v1/scrape` path and confirm the bonus text extracts. Only then delete the monitor via Firecrawl API / dashboard (counterpart to `scripts/create-card-bonus-monitor.mjs`) and remove/disable the dead webhook route `app/api/webhooks/firecrawl-monitor/route.ts`. Voids the pending `FIRECRAWL_WEBHOOK_SECRET` Vercel to-do.
7. **`vercel.json`**: add the `daily-digest` cron (~`30 13 * * *`); optionally a build-brief email cron. Leave all detection schedules as-is.
8. **Observe a month** before touching scan frequency again — one variable at a time.

---

## Next Major Monitoring Project (promoted by both reviewers) — Program-fact drift detector
**The highest-impact strategic gap.** Everything monitored today is *event-driven* (something happened, a blog reported it). A program-fact drift detector would *monitor truth itself* — the actual `/programs/[slug]` facts — which is what Crazy4Points is trying to become. Target fields: elite-tier benefits, resort fees, lounge access rules, earning structures, redemption quirks, partner lists, status-match policies, co-brand benefit tables. Pipeline sketch: official program page changes → Firecrawl → Claude extracts structured facts → compare vs stored → create `verification_finding` → human reviews → publish. Removes the single-source (7-blog) dependency. **Scope as its own effort after this consolidation ships and stabilizes.** (was backlog `project_program_fact_drift_detector`.)

## Known gaps — NOT solved by this plan (flagged honestly)
- **Co-brand card benefit changes mid-cycle** (non-rotating) rely on the weekly good-to-know audit (Sonnet-vs-*stored*, not vs-*live*) — a change is caught only once it has drifted from stored text, not proactively scraped.
- **Single-source fragility** — change-signals leans on 7 blogs/newsrooms. A change that isn't blogged is missed until weekly re-verify (transfer-only) or manual spotting.
- **No subscriber newsletter send automation** in this plan (intentional — sent manually).

---

## Firecrawl credit impact — DECISION: welcome-bonus scan cadence

**Correction to v1:** a daily full 80-card sweep is *not* free relative to today. The Monitor's ~29/day savings does not cover the +55/day cost of bumping the card cron from 25→80/day. Honest math (cards-with-URLs ≈ 80; non-card Firecrawl ≈ 48/day; today = ~102/day *with* Monitor = ~3,060/mo):

| Card scan cadence | Sweep window | Firecrawl/day | Per month | vs today (~3,060/mo) |
|---|---|---|---|---|
| 25/day (current) | ~3.2 days | ~73 | ~2,190 | **−870/mo** |
| **40/day (2-day) — RECOMMENDED** | ~2 days | ~88 | ~2,640 | **−420/mo** |
| 80/day (daily full) | 1 day | ~128 | ~3,840 | **+780/mo** |

**Recommendation: 40/day.** Cuts the short-lived-offer blind-spot window 3.2→2 days (the reviewers' actual concern), still saves ~420/mo vs today, and honors "observe before maxing spend." Re-evaluate daily-full after a month of post-Monitor data. Daily-full is defensible if zero blind-spot is worth ~+780/mo.

Retiring the Monitor itself removes ~29/day (~880/mo) of redundant spend regardless of cadence — that part is pure win.

### Per-monitor Firecrawl breakdown (for sanity-checking the numbers)
| Monitor | Freq | Scrapes/run | Op type | ≈ credits/day |
|---|---|---|---|---|
| Card welcome-bonus — daily cron | daily | 25 (rotating ~80) | /scrape | 25 |
| Card welcome-bonus — Firecrawl **Monitor** (to be retired) | continuous (~3-day check) | ~80 URLs watched | /v2/monitor | ~29 |
| Scout (editorial intel) | daily | 10–30, data-driven; **stealth proxy on hostile domains bills higher** | /scrape | 10–30 |
| Announcement / change-signals | daily | 7 | /scrape | 7 |
| Re-verify transfers | weekly | 8 | /scrape | ~1.1 |
| Transfer-bonus | every 3 days | 2 | /scrape | ~0.7 |
| Good-to-know audit | weekly | 0 (Sonnet only) | — | 0 |
| Data integrity | daily | 0 (DB-only) | — | 0 |
| Quarterly refresh | 2×/qtr | ~12 | /scrape | ~0.1 |

Firecrawl is called via direct HTTP (no SDK) through `utils/ai/firecrawl.ts` → `/v1/scrape` (`fetchFirecrawl`) and `/v1/map` (`mapFirecrawl`).

---

## Reviewer answers (resolved)
1. **Failure detection preserved?** Yes — both reviewers: centralized `cron_runs` health is *stronger* than today's implicit per-cron emails. Resolved via the richer schema in step 1.
2. **Monitor retirement lossless?** Yes, with the 15-min pre-deletion sanity check (step 6) to confirm no JS-render/redirect-following advantage in `/v2/monitor`.
3. **Sweep cadence?** Open decision — recommended 40/day (2-day). See Firecrawl section.
4. **Biggest gap?** Program-fact drift detector — promoted to Next Major Monitoring Project.

## Decision — LOCKED
Welcome-bonus scan cadence: **40/day (2-day sweep)** chosen by Jill 2026-06-29. ~2,640 credits/mo (~420/mo saved vs today), blind-spot window 3.2→2 days. Revisit daily-full after a month of post-Monitor data. **Plan fully approved — ready to build.**
