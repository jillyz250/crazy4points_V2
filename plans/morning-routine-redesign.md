# Morning Routine Redesign — Plan for Review

**Status:** proposal, not yet built. Seeking Copilot + Jill feedback before implementation.
**Owner:** Jill · **Drafted:** 2026-08-12

---

## 1. What the morning does today (current state)

Every weekday morning Jill triggers the routine by saying "good morning" (the
`daily-ritual` skill). The heavy scanning already ran overnight via cron
(~6am ET): `run-scout` → `build-brief` → `intel-triage-sweep` → `daily-digest`,
plus the sweepstakes / experiences / schedule watchers. The morning is the
**human-in-the-loop layer**: decide, publish, write. It is meant to be fast —
decisions, not re-scanning.

Concretely, the routine runs these tasks:

| # | Task | Source |
|---|------|--------|
| 1 | (Pre) Jill forwards issuer/program promo emails to the intel inbox | Jill, before "morning" |
| 2 | Semantic dedup — auto-suppress re-forwarded dupes of already-published alerts | `scripts/morning-dedup.mjs` |
| 3 | Pull the live snapshot — every queue count + details | `scripts/morning-snapshot.mjs` |
| 4 | Verify chart-worthy candidates against official issuer/program sources | manual (Firecrawl/WebSearch) |
| 5 | Build ONE decision table (drafts · intel · transfer-data · welcome-bonus · prose-recheck · refresh queue · experiences · sweepstakes) with **Reverified** + **Pages-correct** columns | skill |
| 6 | Execute calls — publish / page-note / reject; fix stale program pages | manual |
| 7 | Review daily brief + digest; resolve program-fact drift | `/admin/program-drift` |
| 8 | Source gap-check (self-improving loop) | snapshot SOURCE GAPS |
| 9 | Confirm forwarded emails landed | snapshot fresh-intel |
| 10 | Pick the day's ONE social post | facebook-post skill |
| 11 | Propose ONE article idea | intel + `/admin/content-ideas` |

Weekly extras live on the dashboard, not the ritual: newsletter (Thursdays),
refresh-queue re-verify (Fridays).

---

## 2. What's wrong (why redesign)

1. **The snapshot dumps a wall of everything at once**, then we try to cram
   drafts + intel + transfer-data + experiences + sweepstakes into ONE
   mega-table. That's the opposite of "one step at a time." Overwhelming and
   inconsistent day-to-day.

2. **No overnight health check.** If a cron fails, its queue looks empty and
   reads as "all clear." Live example: on 2026-08-12 the daily brief was 2 days
   stale ("latest Aug 10, today not built") and it was easy to miss.

3. **Page accuracy is NOT guaranteed.** The "Pages correct" check only fires on
   intel we *publish*. Intel we reject or newsletter can still make a page stale
   (e.g. a Choice Privileges Japan devaluation makes the Choice page's Japan
   award rates wrong whether or not we write an alert). The program-fact drift
   detector is the real safety net but it's backlogged (27 open on 2026-08-12)
   and under-surfaced (top-6 only).

4. **Volume is the enemy.** "Intel to triage" was 52 open one morning, but ~4
   were real decisions. The rest is the same recurring noise daily: non-US cards
   (DBS, HSBC Singapore, Thai), recurring monthly award sales (Qatar, Copa,
   Alaska Global Getaways), and re-forwarded dupes.

5. **Reminders aren't surfaced.** There's a `reminders` table (137 rows) driving
   the admin dashboard, but it isn't in the snapshot at all — so dated tasks
   silently slip past (10 expired, 11 due-today on 2026-08-12).

6. **No "close yesterday's loop."** Nothing checks whether yesterday's decisions
   actually completed (alert published but social never posted; page flagged
   ✍️ but never fixed).

7. **No day-awareness.** Weekly tasks (Thu newsletter, Fri refresh) live only on
   the dashboard and get forgotten.

---

## 3. Design principles

- **Board first, then one card per step.** Open with a one-screen summary of the
  day's shape (counts + urgent flags), then walk through numbered steps, ONE per
  message. Never more than one decision card on screen.
- **Same layout every day.** Fixed columns, fixed verdict vocabulary, so it reads
  identically every morning.
- **Pre-filter hard.** Only genuine decisions reach a card; recurring noise is
  auto-handled and shown as a collapsed "auto-handled (N)" line.
- **Page accuracy is a guarantee, not a side effect.**
- **Empty steps auto-skip.** No card for a queue with nothing in it.
- **Jill drives:** `next` / `skip` / `back` / `done`.
- **Verdict vocabulary:** `PUBLISH · PAGE-NOTE · NEWSLETTER · REJECT · HOLD`,
  with `Reverified ✅/⚠️` and `Pages ✅/✍️/—`.

---

## 4. The new flow (step by step)

```
Step 0 · Health + today      cron freshness · weekday · weekly task due?
Step 1 · Loose ends          yesterday's decisions that didn't complete
Step 2 · Reminders           due today + overdue (from the reminders table)
Step 3 · Decisions           pre-filtered to ~3-6 real ones
Step 4 · Page accuracy       EVERY page-affecting fact + drift burn-down
Step 5 · Social & posts      best sweepstakes + experience + intel angle → pick ONE
Step 6 · Article             one pitch (propose-only)
Close  · Recap               published X · you still owe Y
```

Each queue has an explicit home (nothing gets lost):

| Queue | Step |
|---|---|
| Cron health, weekday, weekly task | 0 |
| Yesterday's incomplete decisions | 1 |
| Reminders (due/overdue) | 2 |
| Intel to triage · Pending drafts · Transfer-data · Welcome-bonus | 3 |
| Prose-recheck · Program-fact drift · Refresh queue | 4 |
| New experiences · Sweepstakes to post | 5 |
| Article idea | 6 |
| Source gaps | folds into 4 (coverage), only if non-empty |
| Daily brief + digest | read into steps above; flagged only if new |

### Example card (fixed format)
```
STEP 3 of 6 · DECISIONS (3 real · 12 auto-handled)

#  Item                              Reverified   Pages         My rec
1  Choice Privileges Japan deval     ✅ TPG/LL    ✍️ Choice pg   PUBLISH
2  AA Admirals fee → $1,400          ⚠️ verifying ✅ correct     PAGE-NOTE
3  Alaska connection loophole        ⚠️ can't     —             HOLD

auto-handled: 8 non-US → reject · 4 recurring sales → newsletter (say "show" to expand)
Your calls?  (e.g. "1 yes, 2 yes, 3 skip")
```

---

## 5. The page-accuracy guarantee (the most important change)

**Rule: every kept fact of a page-affecting type updates its page, independent
of whether we publish an alert.**

Page-affecting intel types: `devaluation`, `fee_change`, `award_chart` /
`earn_rate_change`, `transfer_partners` / `partner_change`, `policy_change`,
`signup_bonus` / welcome-bonus changes.

Mechanics:
1. When intel of one of these types names a program/card we carry, it triggers a
   **mandatory page check** on the tied page — even if the alert verdict is
   reject or newsletter.
2. The item is not "done" until its page reads **✅** (verified accurate or
   fixed). Logged, not assumed.
3. **Program-fact drift is promoted to a first-class must-clear step** (Step 4),
   never collapsed while drift > 0. New drift from today's intel surfaces
   immediately; the backlog burns down a few per morning (target: 5/day until
   under 10).
4. Fixing the page follows the existing rules: issuer/official source only,
   `content_updated_at` gate, no foreign-currency valuations, etc.

---

## 6. Standing auto-filters (kill the noise)

Move recurring, always-the-same-answer intel out of Jill's decision card:

- **Non-US-only cards/programs** (DBS, HSBC Singapore, Thai domestic, etc.) →
  auto-**reject** with reason "non-US audience."
- **Recurring monthly award/points sales** (Qatar Privilege Club monthly, Copa
  buy-miles, Alaska Global Getaways, Miles & More Mileage Bargains) →
  auto-**newsletter** (bundle into the monthly "This Month's Award Sales"
  roundup).
- **Re-forwarded dupes of published alerts** → already handled by
  `morning-dedup.mjs`.

All auto-handled items collapse into one expandable line (`auto-handled (12)`) so
nothing is hidden — Jill can expand and override any of them.

**Open question:** where should the standing-rules list live — a small DB table
(`triage_rules`) editable from admin, or a code constant? DB is more flexible;
code is simpler and versioned.

---

## 7. What we build (implementation)

- **`scripts/morning-snapshot.mjs`** — add: (a) cron-freshness health block at
  the very top; (b) weekday + weekly-task line; (c) Reminders section (due today
  + overdue, from the `reminders` table); (d) deals-expiring-in-48h scan of
  published alerts; (e) a `page-affecting` tag on fresh intel; (f) the
  auto-handled pre-filter summary. Keep it read-only and keep the
  `!! QUERY PROBLEM(S)` guard.
- **Standing-rules pre-filter** — new logic (script or snapshot section) that
  classifies recurring noise before it reaches the decision card.
- **Reminders integration** — surface due/overdue; add a fast way to
  dismiss/complete a reminder from the ritual; optionally auto-generate reminders
  from published-alert `end_date` (so we stop hand-making "post before it ends"
  reminders).
- **Drift burn-down** — surface new drift immediately; process N backlog/morning;
  log the page fix on resolve.
- **`.claude/skills/daily-ritual/SKILL.md`** — rewrite to the board → one-card
  step structure, the verdict vocabulary, the controls, and the hard
  page-accuracy rule.

Nothing here changes the overnight crons; this is all the human-loop layer.

---

## 8. Open questions for review (Copilot + Jill)

1. **Standing-rules home:** DB table (`triage_rules`) vs code constant?
2. **Auto-generate reminders** from published-alert `end_date` — good, or keep
   reminders hand-made?
3. **Drift burn-down rate:** 5/morning until under 10 — reasonable, or
   different?
4. **Board:** printed by the snapshot script, or composed by the skill from
   snapshot data?
5. **Experiences + sweepstakes:** one folded "Social & posts" step (recommended),
   or a separate card for each?
6. **Auto-filter comfort:** OK to auto-reject non-US and auto-newsletter
   recurring sales without Jill seeing each (collapsed line only), or must every
   item be visible?

---

## 9. Rollout

1. Land Step 0 (health check) + the standing auto-filters first — highest
   leverage, fixes problems that bit us on 2026-08-12.
2. Add reminders + loose-ends + deals-expiring.
3. Rewrite the skill to the new card flow + page-accuracy guarantee.
4. Burn down the 27-item drift backlog over the following mornings.

---

## 10. Decisions (finalized after Copilot review — BUILT)

Copilot's second-pass review found real failure modes; we adopted the cheap,
high-value guards and dropped the machinery that's over-built for our volume.

**Adopted (built into `scripts/morning-snapshot.mjs` + the skill):**
- Overnight **health check** (brief staleness + Scout freshness) at Step 0.
- **Reminders** (due today + overdue) + **deals-expiring-48h** surfaced.
- **Weekday + weekly-task** awareness (Thu newsletter / Fri refresh).
- **US-signal hard guard** (deterministic regex — US issuer/USD → never collapse)
  and **new-program guard** (a program we don't carry → never collapse).
- **Page-affecting tagging** (📄) → feeds the page-accuracy guarantee.
- **Auto-filters are FLAG-ONLY** (collapse, reject nothing) until a category earns
  auto-reject.
- **Page-fix tiering** (Fix-NOW for top-10 programs / live-alert contradictions /
  earn-burn / transfer partners / promoted SUB; else queue to drift) + drift SLA
  (nothing > 7 days; burn up to 5/morning, 10 if backlog > 30).
- **Experiences + sweepstakes = one step, two sub-cards** (Copilot's call).
- Reminders auto-generate only from **explicit ISO** end-dates.

**Dropped as over-engineered for our volume (a few items/category/week):**
- The 98%-precision / 50-item / 90-day graduation gate + a recall meta-classifier.
  Replaced with: human eyeballs the collapsed bucket ~2 weeks, zero flagged misses
  → graduate; monthly spot-check. The deterministic US-signal guard does the real
  work.
- The 14-day "hard-stop that blocks the morning." Softened to a loud persistent
  escalation.
- Auto-switch code→DB and auto-off-at-<95%. Deferred until true auto-reject is on.

**Standing-rules home:** code constant now (in the snapshot script); move to a DB
table only when a category graduates to auto-reject.
