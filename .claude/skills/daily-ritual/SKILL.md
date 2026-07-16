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
The ritual assumes Jill has already **forwarded her outside emails to the intel inbox before triggering "morning"** — travel-promo emails AND Google Alerts emails. Forwarding authenticates via the `intel_email_senders` allowlist (her address is on it), Haiku classifies each, and they land in `/admin/triage` as `source_type=email` so they appear in today's decision table. If she clearly hasn't forwarded yet and wants to, remind her to do it first, then pull the snapshot so they're captured. (The daily **brief** and **digest** are built from our OWN database and are read automatically below — they do NOT get forwarded.)

### Step 0b — pull the live snapshot
Run:
```
node scripts/morning-snapshot.mjs
```
It prints every queue count (matching the dashboard "Your day" board), the brief/digest status, and the **fresh intel list** (last 36h) you'll use for the table and the gap-check. Read-only. If it errors on a table, note it and continue — don't block the ritual.

### Step 1 — one decision table (most important first)
From the snapshot, build **ONE table** covering the actionable queues: pending drafts, intel to triage, transfer-data changes, **welcome-bonus changes**, prose-to-recheck, and the **refresh queue** (surface the oldest few due — re-verify or page-note candidates). Columns: **Item · What it is · My recommendation**. Order by leverage (a hot publishable deal beats a stale housekeeping flag; the refresh-queue backlog sits near the bottom unless something's badly overdue). For each row recommend exactly one of: **publish** (verify first), **page-note** (fold into a program/card page as a detail), **reject** (with reason), **snooze**, or **hold**. Jill decides down the list; you execute — verify each keeper against issuer sources, edit to her brand voice, publish. Quality over clearing the pile.

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
