# daily-ritual — Jill's morning operating routine

## Purpose
Turn everything the overnight crons produced into a short list of decisions plus
one piece of fresh content — presented as a **board, then one card at a time**,
with a **confirmation receipt after every step**. The heavy scanning already ran
overnight (`run-scout` → `build-brief` → `intel-triage-sweep` → `daily-digest`,
~6am ET). This ritual is the human-in-the-loop layer: decide, publish, write.
**Speed, consistency, zero dropped intel.**

## The golden rules of presentation (this is the whole point)
1. **Board first, then ONE card at a time.** Never paste multiple steps at once.
   Present a card, wait for Jill's call, act, then send the confirmation receipt,
   then the next card. She should never scroll to know what to do next.
2. **Confirmation receipt after every step.** When a step's actions are done,
   send a short receipt: **`✅ Step N done — here's what I did:`** then 1-3 bullet
   lines of exactly what happened (reverified X against source, changed the Y
   program page field Z, published alert W, dismissed reminder V). Then `Next →`.
3. **Same layout every day.** Fixed card header (`STEP N of 7 · TITLE`), fixed
   columns, fixed verdict words. Consistency is the feature.
4. **Empty steps auto-skip** with one line (`Step 4 · Page accuracy — clear ✅`).
5. **Jill drives:** `next` / `skip` / `back` / `done`.
6. **Verdict vocabulary** (use these exact words): `PUBLISH · PAGE-NOTE ·
   NEWSLETTER · REJECT · HOLD · DISMISS`. Status marks: `Reverified ✅/⚠️` ·
   Page status in plain words: **correct** / **needs fixing** / **n/a**.
7. **ALWAYS show Jill the full draft before publishing — every time, no
   exceptions.** She approves or edits first; nothing goes live unseen. This
   applies to alerts, social posts, and page fixes alike.

Obey the always-on rules for Jill: lead with a recommendation on every decision;
only verified facts (official issuer/program source, never a blog); clickable
links for anything to open; her outstanding actions go LAST; alert writes go
through `content_variants`, never the `alerts` mirror.

---

## Step 0a (Jill's job, before "morning")
Jill forwards her issuer/program promo emails to the intel inbox first. They land
as `source_type=email` in the fresh-intel list. Do NOT forward Google Alerts
(one email = one item; multi-story digests lose stories). Issuer emails are gold;
third-party affiliate blasts that hide the card name are noise → reject.

## Step 0b — pull the data (two commands, read-only)
```
node scripts/morning-dedup.mjs           # flag reworded re-forwards of published alerts
node scripts/morning-dedup.mjs --apply   # after a glance, suppress the confirmed ones
node scripts/morning-reminders-sweep.mjs         # preview dead reminders (ended deals + closed auctions)
node scripts/morning-reminders-sweep.mjs --apply # auto-complete them (keeps still-live deals + evergreen)
node scripts/morning-snapshot.mjs        # the full structured feed for the cards below
```
The reminders sweep is SAFE: it only completes "…before it ends" reminders whose
tied alert has already ended (a still-live deal is kept) and auction "Bidding
closes" reminders past their date. Evergreen "Social post:" reminders are kept.
The snapshot is YOUR data source — you compose the board + cards from it; Jill
never reads the raw dump. **If `!! QUERY PROBLEM(S)` prints, STOP and fix it** —
a failed query looks exactly like an empty queue.

---

## THE BOARD (send this first, every morning)
A one-screen opener — shape of the day only, no decisions yet. Build it from the
snapshot's HEALTH block + queue counts + reminders + deals-expiring:

```
☀️ GOOD MORNING — Wed, Aug 12
🩺 Health:   brief ⚠️ 2d stale · Scout ✅ · watchers ✅        ← flag anything red
🔴 Urgent:   1 deal ends in 48h · 2 reminders due today
📋 Decisions: ~4 real · 12 auto-handled · 7 page-affecting facts
🟢 Quiet:    source gaps, drift backlog (burn a few)
→ say "next" to start
```
If HEALTH shows a stale brief / down Scout, **call it out at the top** and say
what it means (a queue may look empty because the cron failed, not because it's
clear). Then wait for `next`.

---

## THE STEPS (one card each, in order)

### Step 1 · 🧹 Loose ends (OVERDUE)
The snapshot's overdue reminders (`[YYYY-MM-DD]` rows) — yesterday's actions that
didn't complete (esp. "Social post:" / "Social post before it ends:"). For each,
recommend: **post today** (still live), **DISMISS** (deal ended / stale), or
**keep** (still relevant, becomes a Step-5 candidate). Bulk-dismiss the passed
ones on her word. Auction "Bidding closes" reminders are shown as a collapsed
count — offer to bulk-dismiss them.
Receipt example: `✅ Step 1 done — dismissed 3 ended-deal + 8 auction reminders;
kept Chase Sapphire Lounges for today's social.`

### Step 2 · ⏰ Reminders due TODAY
The snapshot's `[TODAY]` rows — today's dated actions. Flag any real time-boxed
one (a deal's last day). Same verdicts as Step 1.

**How to dismiss/complete a reminder** (both steps): set `status='done'` +
`completed_at=now` on the `reminders` row (mirrors the admin `toggleReminderDone`).
Never hard-delete unless it's junk. Do it in one bulk update when Jill says so.

### Step 3 · 🔥 Decisions (the core) — batch the noise, then ONE publish-candidate at a time
Feeds: fresh intel + pending drafts + transfer-data + welcome-bonus signals. The
snapshot marks each item (🇺🇸 US-signal + 🆕 new-program = ALWAYS a real decision,
never collapse; ⤵ = auto-handled candidate). Split the work in two:

**Step 3a — clear the non-publish pile in ONE batch (nothing here needs a draft).**
Present these as short groups for a single confirm — do NOT walk them one at a time:
- **auto-handled (N), flag-only:** non-US / recurring. **Act on NOTHING
  automatically.** Show the count + reason; `show` to expand. If Jill says
  `handle them`, apply defaults (non-US → REJECT, recurring → NEWSLETTER). If she
  says nothing, leave them in the queue — NOT rejected (that's the point of
  flag-only; a category graduates to true auto-reject only after ~2 weeks of zero
  flagged misses).
- **clear rejects (N):** dupes, industry-only-not-actionable, auctions — one line
  each with the reason; reject on her nod.
- **newsletter-only (N):** recurring sales / minor notes → `triage_decision='newsletter_idea'`.
One bulk confirm, execute, receipt.

**Step 3b — then walk the PUBLISH candidates ONE AT A TIME.** These are the only
ones that need her judgment + a draft. Verify each against its official source
FIRST (see Verification), then present a **mini-block** (never a table):
```
1 of 3 · Choice Privileges Japan devaluation
What/why: <ONE plain-English sentence — what it is, why it matters, the catch>
Reverified: ✅ <source>   ·   Page: needs fixing: Choice (still shows old rates)
My rec: PUBLISH  ("book Japan before it's gone")
Publish, newsletter, or skip?
```
She decides. **If PUBLISH → draft it FIRST and SHOW HER THE FULL DRAFT before
anything goes live. ALWAYS. Never publish an alert she hasn't seen.** She approves
or edits; only then publish via the content_variants pipeline (clean `short_slug`)
and fix the **needs fixing** page as part of publishing. Receipt, then the NEXT
candidate. One at a time — never batch the publish candidates.

### Step 4 · 📄 Page accuracy (the guarantee — never skipped when facts exist)
**Every page-affecting fact updates its page, whether or not we published it.**
Source: the snapshot's `📄 PAGE-AFFECTING FACTS` list + the program-fact-drift
section. Two buckets:

- **Fix NOW (same morning)** if the fact: contradicts a live alert · hits a
  **top-10 program** (Chase, Amex, Citi, AA, United, Delta, Hyatt, Marriott,
  Hilton, Alaska) · changes earn/burn rates · changes transfer partners · changes
  a currently-promoted signup bonus.
- **Queue to drift** (burn down later) if: cosmetic, minor policy clarification,
  region-specific chart tweak, or a multi-section rewrite.

Drift **SLA**: nothing sits > 7 days — anything older auto-promotes to Fix-NOW.
Burn-rate: up to **5/morning**, but if the backlog > 30, do **10/morning until
< 20**. Fixing a page = verify vs the issuer's own page, fix, resolve at
`/admin/program-drift`. Never fix from a blog.
Receipt example: `✅ Step 4 done — fixed Choice page Japan rates (8k→20k Tokyo,
sourced aa/choice), queued 2 minor Marriott drifts, promoted 1 that hit day 7.`

### Step 6 · 🔎 Mine today's work for roadmap topics
Review everything done today (quick takes published, pages fixed, intel rejected,
things verified) and pull out NEW article topics worth adding to the roadmap.
Each becomes a `content_ideas` row tagged to a pillar (`roadmap_reviewed=true`),
or an existing idea gets enriched. Turns the day's work into a compounding
content pipeline. Show Jill the candidates; add on her nod.

### Step 6b · ✍️ Write + publish ONE article from the roadmap
Pick the single highest-value roadmap-backed idea (Program-Guides-first) and
WRITE it — draft in Jill's voice, fact-check against official sources, show her
the full draft, publish. One real piece a day. (Supersedes the old propose-only
step: we write + publish now, not just pitch.)

### Step 7 · ✈️ Changes/Cancellations — next-up airline (1/day)
Add the "Changes, Cancellations & Delays" section (`programs.changes_policy`) to
the next-priority airline page — **cadence 1 airline/day**. Verify each against
the airline's OWN official change/cancel page (no blogs). Priority: United,
Delta, AA, Alaska/Atmos, Aeroplan, Avios, ANA, Cathay, Emirates, Turkish,
KrisFlyer, Virgin, LifeMiles… See [[project_award_change_cancel_section]].

### Step 8 · 🎭 New experiences → alerts?
Review the day's new experiences (snapshot EXPERIENCES section). Any marquee /
points-redeemable one worth its own alert? Honest bid-vs-redeem; note the
Chase-transfer angle. Publish only the genuinely alert-worthy (most are just
directory listings, not alerts).

### Step 9 · 🎁 New sweepstakes review
Review the day's new sweepstakes (snapshot SWEEPSTAKES section). Points/miles
giveaways lead. Flag the best for Step 10; keep/dismiss the rest.

### Step 10 · 📣 Social post (pick ONE, LAST)
The daily social post. Candidates: the ⭐ sweepstakes pick (Step 9), a deal
expiring in 48h (last-chance), a marquee experience, or today's best published
quick take / article. Recommend THE one with a one-line why-it-engages + our
value-add. Draft only on Jill's go (facebook-post / instagram-post skill). We
always want a daily post.

### Coverage (folds into Step 4, only if non-empty)
Source gaps: programs in blog/email intel with no active Scout source. Propose
adding + live-test Firecrawl→Haiku before adding. Usually 0. Google Alerts are
now auto-quarantined at ingest (mig 625) so they no longer pollute the queues.

---

## CLOSE (send after the last step)
A fixed recap:
```
🌙 WRAP — Aug 12
Published: 1 (Choice Japan deval)   ·   Pages fixed: 2   ·   Reminders cleared: 3
Social queued: Chase Sapphire Lounges (your post)
Still owed by you: post the social · confirm the IHG deal terms
Next-best move: <one line>
```
Her outstanding actions ALWAYS last.

---

## Execution cheat-sheet (what each verdict actually DOES)
Run DB scripts with `node_modules/.bin/tsx` from the repo root; a tsx script that
imports `@/…` must live INSIDE the repo (copy to `scripts/_tmp-*.ts`, run, delete)
for the alias + node_modules to resolve. Alert writes go through `writeAlertVariant`
/ the content_variants pipeline — the `alerts` mirror blocks direct writes (G6).

**REJECT/NEWSLETTER/SNOOZE intel by ID, never by substring.** Use
`node scripts/triage-apply.mjs --reject|--newsletter|--snooze <ids> [--reason … | --until …]`
with the exact `id=` values the snapshot prints beside each item (the snapshot
also prints a ready `REJECT ALL FLAGGED DUPES →` command). NEVER hand-write a
throwaway script that matches on a headline substring — on 2026-08-14 a
`headline.includes('aeroplan')` filter over-rejected 5 non-dupes (a $2.5B stake
sale, partnership news) alongside the real re-forwards. **Rule: when a targeted
action returns 0 rows or errors, diagnose the target (wrong column? exact string?)
— do NOT broaden the filter to "just make it work."** The intel column is
`headline`, not `title`. `--dry` previews; prefixes need 8+ chars and must be
unambiguous or the run aborts.

- **PUBLISH (new)** → `writeAlertVariant({status:'published', short_slug, title,
  summary, description, type, action_type, primary_program_id, program_slugs,
  end_date, source_url, …})`. Guardrails learned the hard way: `action_type` must
  be a valid enum (`book·transfer·apply·status_match·buy_miles·activate·monitor·
  learn` — there is no "enter"); impact/value/rarity scores ≤ 5 (check constraint);
  `end_date` = the ACTIONABLE deadline stored as the calendar date (renders via
  UTC); set a clean `short_slug`; NEVER put an internal note in `history_note`
  (it renders publicly as "Historical Context").
- **PUBLISH (existing draft)** → updateAlertVariantBody → logAlertOverride
  (tnc/factcheck/voice/source) → checkAlertGates (must `canPublish`) →
  publishAlertVariant. See [[reference_publish_alert_programmatically]].
- **PAGE-NOTE** → edit the program/card page field (issuer source only, no
  foreign-currency valuations, no em/en-dashes) and set `content_updated_at`
  (SQL-authored pages 404 without it). This is also how a **📄 page-affecting**
  fix lands.
- **NEWSLETTER** → `intel_items.triage_decision='newsletter_idea'` (stays in the
  newsletter bucket, leaves the alert queue).
- **REJECT** → `intel_items` set `rejected_at=now, processed=true,
  rejected_reason=…`.
- **HOLD / SNOOZE** → `intel_items.snoozed_until=<date>` (re-surfaces later).
- **DISMISS reminder** → `reminders` set `status='done', completed_at=now`.

---

## Verification (run on chart-worthy candidates BEFORE Step 3's card)
Same method every time:
1. **Never verify from a blog/aggregator** — they contradict themselves. Blogs
   are a tip, never the source. Cite issuer/official or nothing.
2. A forwarded email's `source_url` is a tracking blob → don't cite/verify from it.
3. Structural facts → check `programs.scrape_urls` as a shortcut (53/154 have it),
   else Firecrawl `site:<issuer-domain>`.
4. Transient promos → scrape the canonical global/en page; beware stale-regional
   pages seeding expired terms.
5. Read the fine print the marketing hides: booking-window vs stay-window, tier
   gating, registration-required, US eligibility, direct-booking-only.
6. `end_date` = the ACTIONABLE deadline, not the stay-through date.
7. Strip foreign-currency valuations.
8. Targeted/personalized offers can't be verified → can't publish as general alerts.

## Notes
- The dashboard's daily-routine checklist was removed 2026-08-13 (Jill drives the ritual via this skill in chat, so the on-screen board was redundant). The ritual now lives ONLY here — there's no dashboard board to keep in sync.
- Standing auto-filters are FLAG-ONLY today; a category only graduates to true
  auto-reject after ~2 weeks of zero flagged misses (US-signal + new-program are
  permanent hard guards, never collapsed). Standing-rules live in the snapshot
  script for now (code constant); move to a DB table if/when auto-reject turns on.
- Reminders can be auto-generated from a published alert's explicit ISO `end_date`
  (skip fuzzy "through August" dates); auto-expire past ones to keep the table lean.
- Related: [[feedback_morning_pretriage]], [[project_daily_ritual_plan]],
  [[reference_publish_alert_programmatically]], the redesign spec at
  `plans/morning-routine-redesign.md`.
