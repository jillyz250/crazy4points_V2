# daily-ritual — Jill's morning operating routine

## Purpose
Turn everything the overnight crons produced into a short list of decisions, one
piece of fresh content, and — new — **one concrete site improvement in every
dimension, every single day**. Presented as a **greeting + board, then one phase
at a time**, with a **confirmation receipt after every phase**. The heavy
scanning already ran overnight (`run-scout` → `build-brief` → `intel-triage-sweep`
→ `daily-digest`, ~6am ET). This ritual is the human-in-the-loop layer: decide,
publish, write, **and make the platform better than yesterday**.
**Speed, consistency, zero dropped intel, compounding improvement.**

## The golden rules of presentation (this is the whole point)
1. **Greet, then board, then ONE phase at a time.** Open with **"Good morning,
   Jill"** and the one-screen board. Then present Phase 1, wait for her call, act,
   send the receipt, then the next phase. Never paste multiple phases at once. She
   should never scroll to know what to do next.
2. **Confirmation receipt + phase retro after every phase.** When a phase's
   actions are done, send a short receipt: **`✅ Phase N done —`** then 1-3 bullet
   lines of exactly what happened. Then, before `Next →`, add a one-line
   **`🔧 Phase N retro:`** — the single best idea to make THIS phase better (or
   "running well, no change") and ask if she wants it. Jill wants every phase to
   keep sharpening (2026-08-27). If she says do it, apply the improvement to this
   skill file (and commit) before moving on; if "next"/"skip", proceed. Keep the
   retro to ONE idea, never a list. **Give an HONEST verdict — "no change" is a
   real, encouraged answer; never invent a filler improvement just to have one.
   And genuinely evaluate for yourself: if you disagree with Jill's call on a
   phase (or anything else), say so with your reason — she wants a real advisor,
   not agreement.** See [[feedback_proactive_expert_guidance]].
3. **Same layout every day.** Fixed card header (`PHASE N of 16 · TITLE`), fixed
   columns, fixed verdict words. Consistency is the feature.
4. **Empty phases auto-skip** with one line (`Phase 8 · Experiences — none new ✅`).
5. **Jill drives:** `next` / `skip` / `back` / `done`.
6. **Verdict vocabulary** (use these exact words): `PUBLISH · PAGE-NOTE ·
   NEWSLETTER · REJECT · HOLD · DISMISS`. Status marks: `Reverified ✅/⚠️` ·
   Page status in plain words: **correct** / **needs fixing** / **n/a**.
7. **ALWAYS show Jill the full draft before publishing — every time, no
   exceptions.** She approves or edits first; nothing goes live unseen. Alerts,
   social posts, and page fixes alike.

Obey the always-on rules for Jill: lead with a recommendation on every decision;
only verified facts (official issuer/program source, never a blog); clickable
links for anything to open; her outstanding actions go LAST; alert writes go
through `content_variants`, never the `alerts` mirror.

The 16 phases fall in three acts: **A. Clear the overnight (1-6)** ·
**B. Keep the site true & fed (7-12)** · **C. Improve every day (13-16)**.
**On Thursdays only, a 17th phase — the Newsletter build — runs DEAD LAST**, after
everything else, so the whole day's verified publishes and decisions feed into it.
On any other day, header the run as `PHASE N of 16`; on Thursdays, `N of 17`.

---

## Phase 0a (Jill's job, before "morning")
Jill forwards her issuer/program promo emails to the intel inbox first. They land
as `source_type=email` in the fresh-intel list. Do NOT forward Google Alerts
(one email = one item; multi-story digests lose stories). Issuer emails are gold;
third-party affiliate blasts that hide the card name are noise → reject.

## Phase 0b — pull the data (read-only, before the board)
```
node scripts/morning-dedup.mjs           # flag reworded re-forwards of published alerts
node scripts/morning-dedup.mjs --apply   # after a glance, suppress the confirmed ones
node scripts/morning-reminders-sweep.mjs         # preview dead reminders (ended deals + closed auctions)
node scripts/morning-reminders-sweep.mjs --apply # auto-complete them (keeps still-live deals + evergreen)
node scripts/morning-snapshot.mjs        # the full structured feed for the phases below
node scripts/improvement-radar.mjs       # ranked data/content/process gaps → feeds Phases 13-15
```
The reminders sweep is SAFE: it only completes "…before it ends" reminders whose
tied alert has already ended (a still-live deal is kept) and auction "Bidding
closes" reminders past their date. Evergreen "Social post:" reminders are kept.
The snapshot is YOUR data source — you compose the board + phases from it; Jill
never reads the raw dump. **If `!! QUERY PROBLEM(S)` prints, STOP and fix it** —
a failed query looks exactly like an empty queue.

---

## THE GREETING + BOARD (send this first, every morning)
Open with a warm **"Good morning, Jill"** then a one-screen board — shape of the
day only, no decisions yet. Build it from the snapshot's HEALTH block + queue
counts + reminders + deals-expiring:

```
☀️ Good morning, Jill — Wed, Aug 12
🩺 Health:   brief ⚠️ 2d stale · Scout ✅ · watchers ✅        ← flag anything red
🔴 Urgent:   1 deal ends in 48h · 2 reminders due today
📋 Decisions: ~4 real · 12 auto-handled · 7 page-affecting facts
🛠️ Improve:  today's process / data / visual picks queued (Phases 13-15)
→ say "next" to start Phase 1
```
Then wait for `next`.

---

# ACT A — Clear the overnight

### Phase 1 · 🩺 Health check
The system's vital signs, before any decisions. From the snapshot's HEALTH block:
each overnight cron (run-scout, build-brief, intel-triage-sweep, daily-digest,
reverify, link-audit, the watchers) — **green ✅ / stale ⚠️ / down 🔴**. If
anything is red or stale, **call it out and say what it means** (a queue may look
empty because the cron failed, not because it's clear — verify before trusting an
empty phase downstream). If all green, one line: `Phase 1 · Health — all green ✅`.
Receipt: what's healthy, what's stale, and whether any downstream phase is suspect.

### Phase 2 · 🧹 Loose ends (reminders table ONLY — overdue + dead)
This phase does ONE thing: clear the reminders table. Nothing else (live
experience closings are a featuring decision → Phase 8). Two moves, same domain:
- **Overdue reminders** (`[YYYY-MM-DD]` rows) — yesterday's actions that didn't
  complete (esp. "Social post:"). Recommend **post today** (still live),
  **DISMISS** (deal ended / stale), or **keep** (→ Phase-16 candidate).
- **Dead reminders** — the reminders-sweep's past-close auction "Bidding closes"
  rows and any ended-deal rows. Bulk-**DISMISS** on her word (status='done').
Keep it to reminders. Do NOT surface experience/auction closings here — even the
featureable ones — so the phase stays single-focus.

### Phase 3 · ⏰ Reminders due TODAY
The snapshot's `[TODAY]` rows — today's dated actions. Flag any real time-boxed one
(a deal's last day). Same verdicts as Phase 2.

**How to dismiss/complete a reminder** (Phases 2-3): set `status='done'` +
`completed_at=now` on the `reminders` row (mirrors admin `toggleReminderDone`).
Never hard-delete unless it's junk. One bulk update when Jill says so.

### Phase 4 · 🗂️ Clear the noise (batch — nothing here needs a draft)
The non-publish pile, presented as short groups for a **single confirm** — do NOT
walk one at a time. Feeds: fresh intel + drafts marked non-actionable. The snapshot
marks each item (🇺🇸 US-signal + 🆕 new-program = ALWAYS a real decision, never
collapse — those go to Phase 5; ⤵ = auto-handled candidate). Groups:
- **auto-handled (N), flag-only:** non-US / recurring. **Act on NOTHING
  automatically.** Show count + reason; `show` to expand. If Jill says `handle
  them`, apply defaults (non-US → REJECT, recurring → NEWSLETTER). If she says
  nothing, leave them in the queue — NOT rejected (a category graduates to true
  auto-reject only after ~2 weeks of zero flagged misses).
- **clear rejects (N):** dupes, industry-only-not-actionable, auctions — one line
  each with the reason; reject on her nod.
- **newsletter-only (N):** recurring sales / minor notes → `triage_decision='newsletter_idea'`.
One bulk confirm, execute, receipt.

### Phase 5 · 🔥 Publish decisions (ONE at a time)
The candidates that need her judgment + a draft. Verify each against its official
source FIRST (see Verification), then present a **mini-block** (never a table):
```
1 of 3 · Choice Privileges Japan devaluation
What/why: <ONE plain-English sentence — what it is, why it matters, the catch>
Reverified: ✅ <source>   ·   Page: needs fixing: Choice (still shows old rates)
My rec: PUBLISH  ("book Japan before it's gone")
Publish, newsletter, or skip?
```
**If PUBLISH → draft it FIRST and SHOW HER THE FULL DRAFT before anything goes
live. ALWAYS.** She approves or edits; only then publish via the content_variants
pipeline (clean `short_slug`) and fix the **needs fixing** page as part of
publishing. Receipt, then the NEXT candidate — never batch these.

Two extra feeds are walked here too, one at a time, verified against official first:
- **Experience to review** (snapshot `NEW EXPERIENCES TO REVIEW`, ⭐ alert-worthy
  first) → **PUBLISH** (full alert), **QUICK-TAKE** (depth='quick'), or **SKIP**.
  ANY verdict (including skip) sets `editorial_reviewed_at=now` — that IS "looking
  at it," clearing it from the morning list AND the /admin "to review" count. Pure
  card-access presale tickets aren't surfaced; Marriott Moments are.
- **Newsletter item expiring soon** (snapshot `NEWSLETTER ITEMS EXPIRING SOON`) →
  **PUBLISH now** (promote to an alert before the deadline), **keep for
  newsletter**, or **REJECT**.

### Phase 6 · 🔗 Chain check (always run)
Scan the day's new intel + today's publishes for **perk chains** — where one
benefit unlocks another, which unlocks another. Canonical: Amex Platinum → free
Walmart+ → free Paramount+; a card's elite status → free Club Avolta status match
→ Radisson VIP + Avis President's Club + Plaza Premium lounge discount. For ANY
chain found: **flag it to Jill explicitly** (she asked to always be told), and
offer to add it to the **Chain Reactions guide**
(`app/(site)/guides/hidden-perk-stacks/page.tsx`, slug kept) + `lib/perkChains.ts`.
No chain today → say so in one line. See [[feedback_always_flag_perk_chains]].

---

# ACT B — Keep the site true & fed

### Phase 7 · 📄 Page accuracy (the guarantee — never skipped when facts exist)
**Every page-affecting fact updates its page, whether or not we published it.**
Source: snapshot's `📄 PAGE-AFFECTING FACTS` + the program-fact-drift section. Two
buckets:
- **Fix NOW** if the fact: contradicts a live alert · hits a **top-10 program**
  (Chase, Amex, Citi, AA, United, Delta, Hyatt, Marriott, Hilton, Alaska) · changes
  earn/burn rates · changes transfer partners · changes a currently-promoted SUB.
- **Queue to drift** if cosmetic, minor policy clarification, region-specific chart
  tweak, or a multi-section rewrite.

Drift **SLA**: nothing sits > 7 days — older auto-promotes to Fix-NOW. Burn-rate:
up to **5/morning**, but if backlog > 30, do **10/morning until < 20**. Fixing a
page = verify vs the issuer's own page, fix, resolve at `/admin/program-drift`.
Never fix from a blog.

**DIGEST SYNC — do not skip drift + change_signals here.** Jill's daily digest
(`buildDigest.ts`) is built from the SAME monitors: change_signals + program-fact
drift + card_bonus_signals. Skip them and they surface in her digest as "alerts we
never discussed" (the disconnect flagged 2026-08-14). Fast patterns: most drift is
**transient-promo false-positives** (a bonus/% flagged as a "page contradiction,"
but promos never go on program pages — they're alerts) → resolve `false_positive`
in bulk; **already-on-page** facts (detector is fuzzy) resolve too; verify only the
genuinely-distinct few vs the issuer. "Coming soon / not live yet" change_signal →
**Snooze 30d**. Google Alerts auto-quarantined at ingest (mig 625) but skim the
backlog + quarantine — GA occasionally surfaces a real gem (verify vs official).
Also fold in **source-gap coverage** here (programs in intel with no active Scout
source): propose adding + live-test Firecrawl→Haiku before adding. Usually 0.

### Phase 8 · 🎭 Experiences → alerts? (new listings + closings within 5 days)
ALL experience-featuring decisions live here, so the phase owns one thing end to
end. Two feeds, one verdict set (**FEATURE** = alert + social / hold for
newsletter · **skip**):
- **New listings** (snapshot EXPERIENCES section) — any marquee / points-
  redeemable one worth its OWN alert? Honest bid-vs-redeem; note the Chase-transfer
  angle.
- **Closings within 5 days** (snapshot EXPERIENCE / AUCTION CLOSINGS) — live
  auctions/experiences closing soon; the lead-time list Jill flagged as **huge for
  social + newsletter** (2026-08-27). A 1-day heads-up is too tight; 5 days gives
  runway to feature the great ones. **Curate** to US-relevant + ATTAINABLE points
  (audience is NY/US-heavy; skip the 300k+ mega-auctions) — don't walk all 30+.
  Auctions → always honest **bid-don't-buy** framing (no fixed price, transfers
  final).
Publish only the genuinely alert-worthy (most are directory listings, not alerts).
Auto-skip if nothing new AND nothing featureable is closing.

### Phase 9 · 🎁 Sweepstakes review
Review the day's new sweepstakes (snapshot SWEEPSTAKES section). Points/miles
giveaways lead. Flag the best as a Phase-16 social candidate; keep/dismiss the
rest. Auto-skip if none new.

### Phase 10 · ✈️ Changes/Cancellations — next airline (1/day)
Add the "Changes, Cancellations & Delays" section (`programs.changes_policy`) to
the next-priority airline page — **cadence 1 airline/day**. Verify against the
airline's OWN official change/cancel page (no blogs). Priority: United, Delta, AA,
Alaska/Atmos, Aeroplan, Avios, ANA, Cathay, Emirates, Turkish, KrisFlyer, Virgin,
LifeMiles… See [[project_award_change_cancel_section]].

### Phase 11 · 🔎 Roadmap mining
Review everything done today (quick takes, page fixes, intel rejected, things
verified) and pull out NEW article topics worth adding to the roadmap. Each →
a `content_ideas` row tagged to a pillar (`roadmap_reviewed=true`), or enrich an
existing idea. Show Jill the candidates; add on her nod.

### Phase 12 · ✍️ Write & publish one article
Pick the single highest-value roadmap-backed idea (Program-Guides-first) and WRITE
it — draft in Jill's voice, fact-check against official sources, show her the full
draft, publish. One real piece a day.

---

# ACT C — Improve every day (the compounding engine)

> Phases 13-15 are **one sharp recommendation each — not a walkthrough.** Surface
> the single highest-leverage idea in that dimension, in plain terms, with the
> **why** and a rough **effort** (S/M/L). Jill says **do it now** / **spawn a
> task** / **backlog** / **skip**. The point is momentum: one real upgrade in each
> dimension, every day, forever. Never invent filler — if the honest best idea is
> small, say it's small; if you're genuinely out of ideas in one dimension, say so
> and pull the next-best from the backlog in memory.
>
> **`scripts/improvement-radar.mjs` (run in Phase 0b) does the finding for you** —
> it ranks the real data-integrity, content, and process gaps with blast radius and
> prints a `TOP PICKS` block. Use its top data pick for Phase 14, its process line
> for Phase 13, and run the mobile sweep for Phase 15. The Radar counts array/JSON
> columns by real length (never truthiness) and prints `!! QUERY PROBLEM(S)` loudly
> if a query fails — if you see that, FIX it before trusting the numbers (a phantom
> "133 programs need reverify" on 2026-08-26 came from counting an empty `[]` as
> present; the real number was 4).

### Phase 13 · ⚙️ Process improvement of the day
One workflow/automation/rail upgrade that makes US faster or less error-prone.
Mine it from: friction in *today's* work, a manual step done ≥2x, a check-first
miss, a fragile script, a gap in `REFERENCE-existing-systems.md`, or the backlog in
memory. Format: **the pain → the fix → effort (S/M/L) → my rec.** Example: "You
hand-verify every transfer ratio in Phase 5; we already have `reverifyTransfers` —
wire a one-command `verify <program>` helper. Effort S."

### Phase 14 · 🛡️ Data-integrity improvement of the day
One concrete accuracy/coverage/freshness fix. Mine it from: `verification_findings`,
`/admin/program-drift`, reverify coverage gaps (programs with no
`reverify_source_url`), `sweet_spots` gaps, the accuracy agent (`verifyClaim` /
`claim_verifications`), stale `content_updated_at`, or a program/card whose data
looks off. Format: **what's inaccurate or unguarded → the fix → blast radius (how
many records) → my rec.** Quantify the blast radius. Example: "31 of 82 airline
programs have no `reverify_source_url`, so the weekly drift sweep skips them — enroll
the top 10 today. Effort M."

### Phase 15 · 🎨 Visual / UX improvement of the day
One design, mobile, or usability upgrade. Mine it from: the mobile contract
(overflow at 375px, tap targets), a page that renders plain/dated, a component that
could be sharper, a slow or confusing flow. **Verify against a real render when you
can** (the preview browser). Format: **the page/element → what's weak → the fix →
my rec.** Example: "/alerts cards wrap awkwardly at 320px and the CTA is a thin
text link — bump to a real button and tighten the grid. Effort S."

### Phase 16 · 📣 Social post (pick ONE, LAST)
The daily social post. Candidates: the ⭐ sweepstakes pick (Phase 9), a deal
expiring in 48h (last-chance), a marquee experience, or today's best published
quick take / article (Phase 5/12). Recommend THE one with a one-line
why-it-engages + our value-add. Draft only on Jill's go (facebook-post /
instagram-post skill). We always want a daily post.

### Phase 17 · 📰 Newsletter build (THURSDAYS ONLY — dead last)
Runs only on Thursdays (the snapshot header prints `WEEKLY: Newsletter day`), and
**always last** so every alert published, page fixed, experience/sweepstakes
picked, and article written *earlier today* is eligible for it — the newsletter is
the day's wrap-up, not a parallel track. On any other weekday this phase does not
exist; do not surface it.

Build it from the day's material, newest-first:
- **today's verified publishes** (Phase 5 alerts + Phase 12 article),
- **newsletter items expiring soon** (snapshot `NEWSLETTER ITEMS EXPIRING SOON`)
  and **parked `newsletter_idea` intel** (Phase 4 sent items here),
- **Jill's Takes** (the biweekly-anecdote inbox), and the week's best evergreen.

Use the existing builder — `runBuildNewsletter` / the `/admin/newsletter` page —
then `verifyNewsletterDraft` before anything is shown. **Editorial rules (hard):**
no fabrication, every claim sourced to official/issuer (see
[[feedback_newsletter_no_fabrication]]); the **editorial note tops the brief**
([[feedback_brief_editorial_top]]); no foreign-currency valuations or derived
point math. **Show Jill the FULL draft before sending — always.** On her approval,
send via Resend, **throttled to ≤4/sec** ([[feedback_resend_rate_limit]]). Receipt:
what led, how many stories, recipient count.

---

## CLOSE (send after the last phase — Phase 16, or Phase 17 on Thursdays)
A fixed recap:
```
🌙 WRAP — Aug 12
Published: 1 (Choice Japan deval)   ·   Pages fixed: 2   ·   Reminders cleared: 3
Improved today: process (verify helper) · data (10 programs enrolled) · visual (alerts CTA)
Social queued: Chase Sapphire Lounges (your post)
Still owed by you: post the social · confirm the IHG deal terms
Next-best move: <one line>
```
Her outstanding actions ALWAYS last.

---

## The daily prompt (what Jill says to start)
Just **"morning"** fires the whole ritual. To also prime the discovery engine, she
can add: **"and give me your single highest-leverage upgrade for the site today —
the one thing that would make us more accurate, more useful, or more efficient that
we haven't built yet."** That sharpens Phases 13-15 toward the biggest unbuilt win.

---

## Execution cheat-sheet (what each verdict actually DOES)
Run DB scripts with `node_modules/.bin/tsx` from the repo root; a tsx script that
imports `@/…` must live INSIDE the repo (copy to `scripts/_tmp-*.ts`, run, delete)
for the alias + node_modules to resolve. Alert writes go through `writeAlertVariant`
/ the content_variants pipeline — the `alerts` mirror blocks direct writes (G6).

**REJECT/NEWSLETTER/SNOOZE intel by ID, never by substring.** Use
`node scripts/triage-apply.mjs --reject|--newsletter|--snooze <ids> [--reason … | --until …]`
with the exact `id=` values the snapshot prints beside each item (the snapshot also
prints a ready `REJECT ALL FLAGGED DUPES →` command). NEVER hand-write a throwaway
script that matches on a headline substring — on 2026-08-14 a
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

## Verification (run on chart-worthy candidates BEFORE Phase 5's card)
Same method every time:
1. **Never verify from a blog/aggregator** — they contradict themselves. Blogs are
   a tip, never the source. Cite issuer/official or nothing.
2. A forwarded email's `source_url` is a tracking blob → don't cite/verify from it.
3. Structural facts → check `programs.scrape_urls` as a shortcut (~53/154 have it),
   else Firecrawl `site:<issuer-domain>`.
4. Transient promos → scrape the canonical global/en page; beware stale-regional
   pages seeding expired terms.
5. Read the fine print the marketing hides: booking-window vs stay-window, tier
   gating, registration-required, US eligibility, direct-booking-only.
6. `end_date` = the ACTIONABLE deadline, not the stay-through date.
7. Strip foreign-currency valuations.
8. Targeted/personalized offers can't be verified → can't publish as general alerts.

## Notes
- The dashboard's daily-routine checklist was removed 2026-08-13 (Jill drives the
  ritual via this skill in chat). The ritual lives ONLY here.
- Standing auto-filters are FLAG-ONLY today; a category only graduates to true
  auto-reject after ~2 weeks of zero flagged misses (US-signal + new-program are
  permanent hard guards, never collapsed). Standing-rules live in the snapshot
  script for now (code constant); move to a DB table if/when auto-reject turns on.
- Reminders can be auto-generated from a published alert's explicit ISO `end_date`
  (skip fuzzy "through August" dates); auto-expire past ones to keep the table lean.
- **Phase renumber (2026-08-26):** flattened old 3a/3b/3c into Phases 4/5/6, added
  Phase 1 Health check as its own phase, and added Act C (Phases 13-15) — the daily
  process / data-integrity / visual improvement engine. Greeting is now
  "Good morning, Jill."
- Related: [[feedback_morning_pretriage]], [[project_daily_ritual_plan]],
  [[reference_publish_alert_programmatically]], [[feedback_system_quality_is_prime_directive]],
  the redesign spec at `plans/morning-routine-redesign.md`.
