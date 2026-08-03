---
name: daily-ritual
description: Jill's daily operating routine for crazy4points. ALWAYS trigger when Jill says "morning", "good morning", "start my day", "daily ritual", "what's on today", or "/daily". The overnight crons already did the heavy scanning (Scout, brief, digest, triage sweep) — this ritual is FAST: pull every queue into ONE decision table, review the brief + digest, run the source gap-check (self-improving loop), remind about email forwards, and propose ONE article. Decisions and writing, not re-scanning. Walk it one step at a time; never dump all five steps at once.
---

# daily-ritual — Jill's morning operating routine

## Purpose
Give Jill a fast, repeatable daily pass that turns everything the overnight crons produced into a short list of decisions plus one piece of fresh content. The heavy scanning already ran while she slept (`run-scout` → `build-brief` → `intel-triage-sweep` → `daily-digest`, all ~6am ET). This ritual is the human-in-the-loop layer on top: decide, publish, write. **Speed and decisions — do not re-run scans unless a queue is visibly stale.**

## How to run it
Go **one step at a time.** Present a step, get Jill's calls, act, then move to the next. Never paste all five steps up front. Obey the global rules that always apply to Jill:
- **Lead with a recommendation** on every decision (mark the pick, one-line why). Don't hand her a neutral menu.
- **Only verified facts.** Every keeper gets checked against its official issuer/program source before it publishes ([[feedback_no_unsourced_claims]], [[feedback_card_data_issuer_source_only]]).
- **Clickable links** for anything she should open or check ([[feedback_always_clickable_links]]).
- **Her outstanding actions go LAST** in your message ([[feedback_user_action_last]]).
- Alert writes go through `content_variants`, never the `alerts` mirror ([[feedback_alerts_write_through_variants]]).

### Step 0a — emails go in FIRST (Jill does this before "morning")
The ritual assumes Jill has already **forwarded her issuer/program promo emails to the intel inbox before triggering "morning"**. Forwarding authenticates via the `intel_email_senders` allowlist (both `gmail.com` and `yahoo.com` are allow-listed, so either address works), Haiku classifies each, and they land in `/admin/triage` as `source_type=email` so they appear in today's decision table. If she clearly hasn't forwarded yet and wants to, remind her to do it first, then pull the snapshot so they're captured. (The daily **brief** and **digest** are built from our OWN database and are read automatically below — they do NOT get forwarded.)

**Do NOT forward Google Alerts** (tested and rejected 2026-07-17, see [[project_google_alerts]]). Three reasons: (1) **one email = one intel item** — `classifyEmail` returns a single classification and the route calls `ingestItem` once, so a 5-story Alert digest silently loses 4; the multi-item digest parser was planned in Phase 6 and never built. (2) The signal is **already automated** — Scout runs 25 Google *News* RSS sources (Google *News* RSS is alive; only Google *Alerts* RSS died), including two producing topical feeds. (3) The genuinely-uncovered queries don't pay: a devaluation/award-chart feed returned 0 findings, and mistake-fare/glitch feeds die within hours, faster than a daily 6am cron.

**Email quality — what's worth forwarding.** *Issuer/program* emails are gold: Southwest, Accor, Hilton, Chase, Amex name the actual offer and terms, and they're a citable primary source. *Third-party affiliate blasts* (point.me, blog newsletters) are usually noise — they deliberately withhold the card name to force a click ("one of the most popular travel cards..."), so Haiku can't tag a program, and they're not citable anyway ([[feedback_card_data_issuer_source_only]]). **Never infer the card** from hints like "$95 AF + 100K" — that's an unsourced claim. Default to reject and tell Jill why.

### Step 0b — pull the live snapshot
Run:
```
node scripts/morning-snapshot.mjs
```
It prints every queue count (matching the dashboard "Your day" board), brief status, dupe-checked pending drafts, fresh intel, page-checked change signals, program-drift, and the source gap-check. Read-only.

**If the `!! QUERY PROBLEM(S)` block prints at the bottom, STOP and fix it before building the table** — a failed query renders as an empty queue, which looks exactly like "all clear." (This is not hypothetical: on 2026-07-17 two swallowed column errors produced a table that recommended publishing an already-published alert. The script now surfaces every error; never ignore that block.)

### Step 1 — verify the shortlist, THEN build one decision table
From the snapshot, pick the chart-worthy candidates across the actionable queues: pending drafts, intel to triage, transfer-data changes, **welcome-bonus changes**, prose-to-recheck, and the **refresh queue** (surface the oldest few due). **Verify each candidate against its official issuer/program source BEFORE you build the chart** (Step 1b is the how) — never present a chart of unverified claims. Then build **ONE table**, ordered by leverage.

Columns: **Item · What it is · Verified · Page status · My rec · Social?**
- **Verified** — ✅ confirmed against the official source, or ⚠️ can't verify (targeted/personalized offer, or source unreachable). An unverifiable item cannot publish as a general alert.
- **Page status** — once verified, does the tied program/card page already reflect it? **✅ accurate**, **✍️ needs updating** (name the field), or **—** (n/a). Fixing the page is part of publishing the alert ([[feedback_cross_check_alerts_vs_program_pages]]).
- **My rec** — exactly one of **publish**, **page-note** (fold into a program/card page as a detail), **reject** (with reason), **snooze**, or **hold**.
- **Social?** — flag the ONE item (occasionally two) worth a social post today, with a one-line *why it'll engage* + *our value-add*. We always want a daily social post; the flag names the best candidate and the angle, not just "yes." Blank for the rest. ([[feedback_facebook_happy_news]], facebook-post skill.)

Order by leverage (a hot publishable deal beats a stale housekeeping flag; the refresh-queue backlog sits near the bottom unless something's badly overdue).

**Never recommend work that's already done. The snapshot pre-checks this — USE its markers:**
- **`[DUPE nn%]` / `[similar nn%]` on a draft** → the story is already **published** or was **archived/rejected/manual_delete**'d. Never recommend publishing a DUPE — recommend **reject (duplicate)**. For `similar`, read the match: a prior `rejected`/`manual_delete` on the same *kind* of story is precedent to reject; a different program may still be genuinely new (judgment call — say so).
- **`<<ALREADY ON PAGE?>>` on a change signal** → the fact is already on that program page. Recommend **dismiss**, not page-note. Confirm on the page first (the check is fuzzy).
- **Before ANY page-note**, confirm the target page/card actually exists and doesn't already say it. Pure cash-back cards are deliberately NOT carried ([[feedback_verify_transferability_per_card]]) — a bonus on one is a **reject**, not a page-note.

Jill decides down the list; you execute — edit to her brand voice, fix any **✍️ needs-updating** pages, publish. Quality over clearing the pile.

### Step 1b — HOW to verify (run this on the shortlist, BEFORE the chart)
Verify the **chart-worthy candidates**, not every raw intel item — most intel gets rejected, so verifying everything is waste, but anything you'd put on the chart gets verified first (that's what fills the **Verified** column). Same method every time. (Codified 2026-07-17 from the Accor verification, which found three real errors in a live alert; verify-before-chart + the Verified/Page-status columns added 2026-08-03 at Jill's request.)

1. **Never verify from a blog or aggregator.** They contradict themselves: LoyaltyLobby's body said the Accor promo ran to Sept 14 while its own URL slug said Sept 13. The official page said Sept 13. Blogs are a *tip*, never the source ([[feedback_official_source_first]], [[feedback_card_data_issuer_source_only]]).
2. **A forwarded email's `source_url` is a tracking blob** (`click.emails.*/?qs=...`) that resolves to a homepage or login, not terms. Don't cite it and don't try to verify from it.
3. **Structural facts** (award chart, tiers, T&C, partners) → check `programs.scrape_urls` first as a *shortcut*: it's a hand-curated list of that program's official URLs, captured during authoring. 53/154 programs have it (Accor, iPrefer, Wyndham are empty). It is NOT a live system input — no runtime code reads it, only `scripts/research-program.mjs` — so treat it as a convenience index, not the source of truth, and just search when it's empty. It does NOT help with **promos**, which live on transient offer pages that were never in it (the Accor summer-bonus page wasn't). See [[project_scrape_urls_backfill]].
4. **Transient promos** → Firecrawl `site:<issuer-domain>` search for the offer, then scrape the **canonical global/en page**. Beware the stale-regional trap: a Qatar `en-th` page once seeded expired 2023 terms onto a 2026 alert ([[project_stale_regional_offer_pages]]). Tell = promo-code/date mismatch vs the source.
5. **Read the fine print for what the marketing copy hides.** The Accor page hid all of these:
   - **Booking window vs stay window** — stays ran to Sept 13 BUT you had to *book by July 31*. The booking deadline is the one that matters.
   - **Tier gating** — "up to 7,500" was ALL Accor+ subscribers only; regular members capped at 5,000. Never repeat a headline number without checking who actually gets it.
   - **Registration required** before booking, or the bonus doesn't track.
   - **Residency/eligibility** — confirm our US audience even qualifies (Accor listed US + Canada; it might not have).
   - **Direct-booking only** — OTAs excluded.
6. **Set `end_date` to the ACTIONABLE deadline**, not the stay-through date. The Accor alert was set to Sept 13 and would have shown as live for six weeks after booking closed.
7. **Strip foreign-currency valuations.** Issuer pages are full of them (Accor quotes "7,500 points = EUR 150"); they never enter our copy ([[feedback_no_foreign_currency_valuations]]).
8. **Targeted/personalized offers can't be verified** (the JetBlue upgrade resolves to a Barclays login). Don't publish those as general alerts.

### Step 2 — brief + digest review (incl. program-drift)
Surface today's daily brief and the data digest. Flag anything in them **not yet an alert or page update**. The editorial note stays at the top of the brief ([[feedback_brief_editorial_top]]). The snapshot's **PROGRAM-FACT DRIFT** section lists the top open conflicts where fresh intel contradicts a program page — for each, verify against the issuer's own page, fix the page if real, then resolve at `/admin/program-drift`. Anything already in Step 1's table doesn't need repeating here.

### Step 3 — source gap-check (the self-improving loop)
The snapshot now **pre-computes this** in its **SOURCE GAPS** section: programs that appeared in blog/email intel over the last 14 days with no matching active Scout source. Review that list — it's a **fuzzy name-match**, so treat each as "look here," not gospel (some may already be covered under a differently-named source; joint programs like Atmos are allow-listed). For any real gap, propose adding/fixing the Scout source and **live-test it Firecrawl→Haiku before adding** ([[reference_scout_and_sources]], [[project_source_audit_2026_07_16]]). Usually 0 most days; if the section is empty, say "coverage looks complete" and move on.

### Step 4 — confirm the forwarded emails landed
The emails Jill forwarded in Step 0a should already be in today's table. Just confirm they showed up (any `source_type=email` items in the fresh-intel list). If she forgot to forward before "morning," that's fine — remind her to forward next time BEFORE saying "morning" so they're captured, or forward now and re-pull the snapshot. **Confirmed working** (Wyndham Summer Sale test landed clean, 2026-07-16).

### Step 5 — propose ONE article (propose-only)
Pitch the **single best** article idea from today's intel + `/admin/content-ideas` — the one with the most reader value right now. **Propose only; write nothing until Jill picks one.** Once she approves, draft it (blog or guide) in her voice, fact-check against official sources, and she reviews before publish ([[feedback_authoring_order_matters]]). One fresh piece a day is the goal, not a pile.

## Close
End by restating **Jill's outstanding actions** as a short list (decisions still owed, anything she needs to forward/verify) — last in the message, per her preference. Then point at the single next-best move.

## Notes
- The dashboard "Your day" checklist (`app/admin/(protected)/page.tsx`) mirrors these steps — keep the two in sync if either changes.
- Weekly extras live on the dashboard, not here: newsletter (Thursdays), refresh-queue re-verify (Fridays).
- Related: [[feedback_morning_pretriage]] (pull all queues myself, don't wait for pastes), [[project_daily_ritual_plan]] (the plan this skill implements).
