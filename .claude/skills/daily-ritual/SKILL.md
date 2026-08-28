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
3. **Same layout every day.** Fixed card header (`PHASE N of 19 · TITLE`; `of 20`
   on Thursdays), fixed columns, fixed verdict words. Consistency is the feature.
4. **Empty phases auto-skip** with one line (`Phase 9 · Experiences — none new ✅`).
5. **Jill drives:** `next` / `skip` / `back` / `done`. **Never PROPOSE skipping or
   deferring a non-empty phase** (Jill, 2026-08-28: "don't suggest again to skip
   phases... we have plenty of time"). Go through them in order; she skips if she
   wants to. Empty phases still auto-skip with one line.
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

The phases fall in three acts: **A. Clear the overnight (1-5)** ·
**B. Keep the site true & fed (6-14)** · **C. Improve every day (15-18)**, then the
daily wrap. The chain check runs LAST in Act B (Phase 14, after the articles) so it
sweeps **everything produced today** (publishes, page fixes, the articles,
experiences). **Analytics review is the daily wrap and runs LAST every day**
(Phase 19). On **Thursdays only**, the **Newsletter build** runs just before it as
Phase 19, pushing Analytics to Phase 20. Header the run as `PHASE N of 19`; on
Thursdays, `N of 20`.

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
node scripts/morning-triage-by-type.mjs  # undecided intel grouped BY TYPE, near-dupes collapsed, already-covered flagged (Phase 4)
node scripts/improvement-radar.mjs       # ranked data/content/process gaps → feeds Phases 15-17
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
🛠️ Improve:  today's process / data / visual picks queued (Phases 15-17)
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

**Also resolve logged errors here (added 2026-08-28, Jill).** Query the
`system_errors` table for **unresolved** rows (`resolved_at IS NULL`). For each:
verify whether it's still true (the watchdog may have caught a gap that has since
self-healed) — if stale, mark `resolved_at=now`; if still real, **investigate the
root cause or spawn a tracked task**, and leave it open. Never blanket-resolve
without checking (2026-08-28: a coverage error listed chase/amex/united/citi as
stale — united/citi had recovered but chase/amex were genuinely 5 days dead, a real
scrape bug). Watchdogs should auto-resolve when their condition clears; where one
doesn't yet, resolve it by hand here.
Receipt: what's healthy, what's stale, which errors were resolved vs escalated,
and whether any downstream phase is suspect.

### Phase 2 · 🧹 Loose ends (reminders table ONLY — overdue + dead)
This phase does ONE thing: clear the reminders table. Nothing else (live
experience closings are a featuring decision → Phase 9). Two moves, same domain:
- **Overdue reminders** (`[YYYY-MM-DD]` rows) — yesterday's actions that didn't
  complete (esp. "Social post:"). Recommend **post today** (still live),
  **DISMISS** (deal ended / stale), or **keep** (→ Phase-18 candidate).
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

### Phase 4 · 🗂️ Triage the intel queue — BY TYPE (grouped, one type at a time)
Source: `node scripts/morning-triage-by-type.mjs` — it groups the undecided queue
by Scout's `alert_type`, collapses near-duplicate re-forwards, and flags every
item **✓ COVERED** (matches a published/expired alert) vs **🆕 NEW**. Only 🆕
items are shown. **Rules that shape this phase (Jill, 2026-08-28):**
- **A sale / points-buy / bonus is an ALERT candidate, not "just newsletter
  fodder."** Each type-group ("5 transfer bonuses — here they are") is the unit of
  decision; they only reach the newsletter *because* an alert exists. So walk the
  groups and decide which few become alerts (even a one-to-two-sentence quick take).
- **NEVER recommend an item as a fresh alert without the COVERED check.** The tool
  does it deterministically (program overlap + title-token match); trust the 🆕
  flag, and when spot-checking use `--covered`. This is the guard against floating
  something we've already published (the mistake caught 2026-08-28).
- Walk the **change-type groups first** (transfer_bonus, devaluation, partner_
  change, fee_change, program_change, policy_change) — those make real alerts —
  then the promo groups (limited_time_offer, signup_bonus, award_sale), deciding
  the genuinely-fresh few. Drill a group with `--type <alert_type>`.
Per group, Jill calls PUBLISH / QUICK-TAKE / NEWSLETTER / REJECT on the 🆕 items;
apply by ID via `triage-apply.mjs`. US-signal + new-program are never auto-collapsed.
NOTE: going forward the classifier drains this automatically once the build-brief
re-feed-undecided fix lands; this phase is the human layer over what's left.

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

---

# ACT B — Keep the site true & fed

### Phase 6 · 📄 Page accuracy (the guarantee — never skipped when facts exist)
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

### Phase 7 · 💳 Welcome-bonus changes (card SUB moves — never miss one)
**TWO sources, because the scraper is blind to the big issuers.** (1) the
`card_bonus_signals` monitor (`/admin/card-bonus-signals`; snapshot QUEUE COUNTS
"Welcome-bonus changes" + "Prose to re-check") — but it scrapes issuer pages, and
Amex/Chase BLOCK scraping, so it goes blind on exactly the cards that matter most.
(2) the **`signup_bonus` type-group from `morning-triage-by-type`** — Scout catches
issuer SUB changes via newsrooms/blogs when the scraper can't (that's how the Delta
Reserve "2 Comfort certs + 50k" offer came in as a draft 2026-08-28, while the
scraper had nothing). Always check BOTH; the scraper alone is not coverage.
A raised or brand-new
sign-up bonus is often ALERT-worthy (Jill's audience is ~50% points-value), and a
DROPPED bonus makes a card page stale. For each pending signal:
- **Verify against the ISSUER's own card page** (multi-source standard — a SUB
  number is exactly the kind of figure that must be official + corroborated before
  publishing). Issuer marketing/apply pages are authoritative.
- **Raised / new best-ever** → PUBLISH a short factual alert + update the card
  page's welcome bonus. **Lowered / expired** → PAGE-NOTE (fix the card page).
- **Elevated offers use the card's built-in display.** The card page already shows
  an elevated offer as a red strikethrough of the standard + "Elevated offer" /
  "Limited-time offer" badge (`is_elevated` + `baseline_bonus_amount`,
  `app/(site)/cards/[slug]/page.tsx`). **But CHECK it FITS first** ([[feedback_check_existing_mechanism_before_editing]]):
  the tile renders a MILE JUMP (lower baseline struck through, higher bonus shown),
  and does NOT render `extras` (statement credits) or certs. A same-miles-plus-a-
  credit offer (Delta Gold/Platinum, 2026-08-28) or a cert offer (Delta Reserve)
  does NOT fit, marking it elevated would show a badge with no visible boost and
  MISLEAD, so route those to an alert instead (or enhance the tile to show extras).
  Our welcome-bonus rows deliberately track the STANDARD "BAU" offer (see the row
  `notes`), not temporary promos; don't overwrite that without cause.
  **Targeted/personalized** → can't verify as general → REJECT.
- **Coverage guardrail:** if Jill flags a SUB change we did NOT catch (Delta,
  2026-08-28 — the monitor had nothing that day), treat it as a monitor gap:
  verify + publish manually, and note the miss so the monitor can be widened.
Resolve each at `/admin/card-bonus-signals`. Auto-skip if none pending AND nothing flagged.

### Phase 8 · ♻️ Refresh queue (freshness guardrail — nothing goes stale silently)
Source: snapshot `REFRESH QUEUE — oldest due`. Walk the **oldest-due** items
(programs, transfer-partner sets, alerts, and GUIDES & evergreen articles) and
re-verify the top few against official sources (multi-source standard). Cadence:
process the **3-5 oldest due each day** so the queue never grows; if the backlog is
large, do more until it's under control. A re-verified item gets a fresh
`content_updated_at` / review date and drops off.
**Guides & evergreen articles enter the queue on a 6-MONTH cadence (Jill,
2026-08-28):** every guide carries an `updated` (last-verified) date in
`lib/guides.ts`. Run `node_modules/.bin/tsx scripts/guides-due-refresh.ts` to list
any past 6 months; re-verify each vs official (multi-source standard), correct, and
bump its `updated` date. Exactly how our Chase page went stale on the Hyatt ratio, a
guide would too. This is guardrail #2 (freshness) for the content itself.
Auto-skip if nothing is due.

### Phase 9 · 🎭 Experiences → alerts? (new listings + closings within 5 days)
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

### Phase 10 · 🎁 Sweepstakes review
Review the day's new sweepstakes (snapshot SWEEPSTAKES section). Points/miles
giveaways lead. Flag the best as a Phase-18 social candidate; keep/dismiss the
rest. Auto-skip if none new.

### Phase 11 · ✈️ Changes/Cancellations — next airline (1/day)
Add the "Changes, Cancellations & Delays" section (`programs.changes_policy`) to
the next-priority airline page — **cadence 1 airline/day**. Verify against the
airline's OWN official change/cancel page (no blogs). Priority: United, Delta, AA,
Alaska/Atmos, Aeroplan, Avios, ANA, Cathay, Emirates, Turkish, KrisFlyer, Virgin,
LifeMiles… See [[project_award_change_cancel_section]].

### Phase 12 · 🔎 Roadmap mining + reconcile (keep it CURRENT)
Two halves — mine forward, and true up what shipped:
- **Mine:** review everything done today (quick takes, page fixes, intel rejected,
  things verified) and pull out NEW article topics. Each → a `content_ideas` row
  tagged to a pillar (`roadmap_reviewed=true`), or enrich an existing idea.
- **Reconcile (added 2026-08-28, Jill):** the roadmap must reflect reality — if we
  shipped something, mark it done. Check `lib/contentRoadmap.ts` `PLATFORM_TRACK`
  (statuses `done`/`next`/`planned`) against what actually shipped and flip stale
  `next` items — Jill noticed the perk-chain line still read "up next" after we'd
  built a chunk of it (2026-08-28: added a `done` "Benefits on card pages" item and
  narrowed the "moat" to the unbuilt stack-builder). A `content_ideas` row whose
  guide is now live also drops off automatically (status derives from GUIDES), but
  the PLATFORM_TRACK is hand-authored, so it's the one that goes stale.
- **Drain the backlog:** `content_ideas` has a large un-actioned pile (~775 on
  2026-08-28: 203 `new` + 572 `idea_bank`, ~747 with no pillar). Like the intel
  queue, it needs a per-bucket drain — group by pillar (`roadmap_pillar` /
  `suggested_pillar`; NOTE the column is `roadmap_pillar`, not `pillar` — the
  silent-column trap), dedup, surface the best per bucket, retire stale ones
  (261 are >90 days old). Walk ONE pillar-bucket at a time: promote the valuable
  to the roadmap, dismiss dupes/stale. (A `content-ideas-by-bucket` tool mirroring
  `morning-triage-by-type` is the intended rail — build when there's time.)
Show Jill the candidates + any status flips; apply on her nod.

### Phase 13 · ✍️ Write & publish TWO articles a day
**Two pieces daily (Jill, 2026-08-28), one from each content system:**

**A) The evergreen GUIDE — from the ROADMAP ladder, pillar rotation.** Always from
`lib/contentRoadmap.ts` `ROADMAP` (the structured guides), NEVER from fresh news.
**Rotate pillars** so coverage grows evenly: fixed cycle **foundations → skills →
programs → sweet-spots → trips → tricks → (loop)**. Find the pillar of the
most-recently-published ladder guide (a ladder item gets a `guideSlug` once live;
check guides' publish dates), advance to the NEXT pillar, skip any pillar with no
unwritten items, and write that pillar's highest-priority unwritten guide (lowest
`order`). Present the pick + 2-3 same-pillar alternates. (Ladder ~50 guides, ~8
written; programs 0/18 and trips 0/6 are emptiest.)

**B) The general-content BLOG — from the `content_ideas` pool.** The topical/
timely piece (explainers, comparisons, "perks you're missing", a news idea now
evergreen enough to write). Pick the highest-value un-written `content_ideas` row
(status `new`/`idea_bank`), preferring roadmap_pillar-tagged + tied to recent
verified work. When a general blog turns out to be a durable guide, promote it into
the ladder (Phase 12).

**Both:** draft in Jill's voice, **multi-source verify EVERY fact BEFORE showing
her** (the Verification standard — official + independent current source,
staleness-guard, red-team, show sourcing per fact), show the FULL draft, publish
on her nod. Two real pieces a day: one evergreen guide + one general blog.

### Phase 14 · 🔗 Chain sweep (LAST in Act B — covers the whole day)
Runs last in Act B so it sweeps **everything produced today** — publishes (Phase 5),
page fixes (Phase 6), the article (Phase 13), experiences/sweepstakes reviewed — not
just the morning intel. Look for **perk chains**: one benefit unlocks another, which
unlocks another. Canonical: Amex Platinum → free Walmart+ → free Paramount+; a card's
elite status → free Club Avolta status match → Radisson VIP + Avis President's Club +
Plaza Premium lounge discount. Best candidates cluster in the `card_credit` /
`partner_change` / `status_promo` intel type-groups (`morning-triage-by-type`).

**⚠️ VERIFY BEFORE FLAGGING OR ADDING (2026-08-28).** Do NOT present something as a
chain until you've confirmed it against the **issuer/network's official terms**. Two
perks listed together ("free Instacart+ and Peacock") are usually NOT a chain — that
one looked like Amex Plat → Walmart+ → Paramount+ but the terms showed Instacart+ and
Peacock are two **separate** Mastercard perks, no "A unlocks B". Flag as *candidates*
until verified.

**Two homes, pick the right one:**
- **True chain** (A unlocks B unlocks C) → `lib/perkChains.ts` + the Chain Reactions
  guide (`app/(site)/guides/hidden-perk-stacks/page.tsx`, slug kept). Renders on
  program pages AND card pages (via `cardSlug` / `programSlugs`).
- **Network-level perk** (a standalone benefit shared across a network tier, e.g.
  Mastercard World Elite) → `lib/networkPerks.ts` (NOT the chain guide). One
  definition renders on every matching card via `CardBenefitStacks`, with `validThrough`
  auto-expiry. `source`/`verifiedAt` are internal (not rendered); a `sourceUrl` shows
  as a public "official terms" link.

**Flag any chain to Jill explicitly** (she asked to always be told). No chain today →
say so in one line. See [[feedback_always_flag_perk_chains]], [[feedback_verify_before_correcting]].

---

# ACT C — Improve every day (the compounding engine)

> Phases 15-17 are **one sharp recommendation each — not a walkthrough.** Surface
> the single highest-leverage idea in that dimension, in plain terms, with the
> **why** and a rough **effort** (S/M/L). Jill says **do it now** / **spawn a
> task** / **backlog** / **skip**. The point is momentum: one real upgrade in each
> dimension, every day, forever. Never invent filler — if the honest best idea is
> small, say it's small; if you're genuinely out of ideas in one dimension, say so
> and pull the next-best from the backlog in memory.
>
> **`scripts/improvement-radar.mjs` (run in Phase 0b) does the finding for you** —
> it ranks the real data-integrity, content, and process gaps with blast radius and
> prints a `TOP PICKS` block. Use its top data pick for Phase 16, its process line
> for Phase 15, and run the mobile sweep for Phase 17. The Radar counts array/JSON
> columns by real length (never truthiness) and prints `!! QUERY PROBLEM(S)` loudly
> if a query fails — if you see that, FIX it before trusting the numbers (a phantom
> "133 programs need reverify" on 2026-08-26 came from counting an empty `[]` as
> present; the real number was 4).

### Phase 15 · ⚙️ Process improvement of the day
One workflow/automation/rail upgrade that makes US faster or less error-prone.
Mine it from: friction in *today's* work, a manual step done ≥2x, a check-first
miss, a fragile script, a gap in `REFERENCE-existing-systems.md`, or the backlog in
memory. Format: **the pain → the fix → effort (S/M/L) → my rec.** Example: "You
hand-verify every transfer ratio in Phase 5; we already have `reverifyTransfers` —
wire a one-command `verify <program>` helper. Effort S."

### Phase 16 · 🛡️ Data-integrity improvement of the day
One concrete accuracy/coverage/freshness fix. Mine it from: `verification_findings`,
`/admin/program-drift`, reverify coverage gaps (programs with no
`reverify_source_url`), `sweet_spots` gaps, the accuracy agent (`verifyClaim` /
`claim_verifications`), stale `content_updated_at`, or a program/card whose data
looks off. Format: **what's inaccurate or unguarded → the fix → blast radius (how
many records) → my rec.** Quantify the blast radius. Example: "31 of 82 airline
programs have no `reverify_source_url`, so the weekly drift sweep skips them — enroll
the top 10 today. Effort M."

### Phase 17 · 🎨 Visual / UX improvement of the day
One design, mobile, or usability upgrade. Mine it from: the mobile contract
(overflow at 375px, tap targets), a page that renders plain/dated, a component that
could be sharper, a slow or confusing flow. **Verify against a real render when you
can** (the preview browser). Format: **the page/element → what's weak → the fix →
my rec.** Example: "/alerts cards wrap awkwardly at 320px and the CTA is a thin
text link — bump to a real button and tighten the grid. Effort S."

### Phase 18 · 📣 Social post (pick ONE, LAST)
The daily social post. Candidates: the ⭐ sweepstakes pick (Phase 10), a deal
expiring in 48h (last-chance), a marquee experience, or today's best published
quick take / article (Phase 5/13). Recommend THE one with a one-line
why-it-engages + our value-add. Draft only on Jill's go (facebook-post /
instagram-post skill). We always want a daily post.

### Phase 19 · 📰 Newsletter build (THURSDAYS ONLY — last content phase, before Analytics)
Runs only on Thursdays (the snapshot header prints `WEEKLY: Newsletter day`), and
**always the last content phase** (only the Analytics wrap follows it) so every
alert published, page fixed, experience/sweepstakes picked, and article written
*earlier today* is eligible for it — the newsletter is the day's content wrap-up,
not a parallel track. On any other weekday this phase does not exist; do not
surface it (Analytics then becomes Phase 19).

Build it from the day's material, newest-first:
- **today's verified publishes** (Phase 5 alerts + Phase 13 article),
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

### Phase 19 (Phase 20 on Thursdays) · 📊 Analytics review — the daily wrap
Runs **LAST every day** (after the Newsletter on Thursdays). Added 2026-08-28
(Jill). Review the numbers and pull **1-2 insights that should change tomorrow's
priorities** — do not just recite metrics:
- **Traffic:** top pages + search movement (Google Search Console / Vercel
  Analytics) — which alerts/guides/programs draw, what's rising or falling.
- **Newsletter:** opens / clicks / unsubs when available (open+click stats are a
  backlog build — flag the gap if we still can't see them).
- **Social:** engagement on recent FB/IG posts (Jill reports what she sees; not
  auto-pulled yet).
- **Conversion:** newsletter signups (subscribers added), referral/affiliate clicks.
- **Content:** the day's top-performing alert / experience / sweepstakes.
Format: **what moved → why it likely moved → one thing to do differently tomorrow.**
Same accuracy bar as everything else: **no number we haven't actually pulled**, and
name which metrics we CAN'T yet see (a gap to build). See [[project_newsletter_open_click_stats]],
[[project_gsc_pickup_2026_05_07]], [[project_social_media_dashboard]].

---

## CLOSE (send after the last phase — Phase 19 Analytics, or Phase 20 on Thursdays)
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
we haven't built yet."** That sharpens Phases 15-17 toward the biggest unbuilt win.

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

## Verification (run on ANY factual draft BEFORE it reaches Jill)
**⭐ GLOBAL STANDARD — see [[feedback_multi_source_verify_before_draft]].** The
accuracy safety net is MY process, not Jill; she approves voice/judgment, never
catches my facts. Before presenting ANY new factual item (alert, program page,
`changes_policy`, card, chain/network perk, guide, social, newsletter):
- **A) Multi-source BEFORE the draft.** Every specific figure (fee, %, date,
  threshold, ratio, count) confirmed by the **official page AND ≥1 independent
  current source** — one search is NEVER enough. Sources disagree → dig or flag.
- **B) Staleness guard.** Recently rebranded/merged program (Atmos, any rename) →
  old pages are suspect; explicitly hunt the CURRENT policy. An official page can
  be stale and search will still hand it back as authoritative.
- **C) Red-team my own draft** ("what would an expert dispute?") and re-verify the
  shakiest facts myself — I am the adversarial check.
- **D) Show sourcing per fact**; flag single-source / low-confidence out loud.
  (2026-08-28: I nearly shipped a stale Atmos $125 fee off one search; caught only
  because Jill asked Copilot. Never again.)

Same method every time:
1. **A blog is corroboration, never the sole source.** Blogs contradict themselves,
   so cite issuer/official first — but note an official page can be STALE, so
   confirm with a current independent source too (rule A above).
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
  Phase 1 Health check as its own phase, and added Act C (Phases 15-17) — the daily
  process / data-integrity / visual improvement engine. Greeting is now
  "Good morning, Jill."
- Related: [[feedback_morning_pretriage]], [[project_daily_ritual_plan]],
  [[reference_publish_alert_programmatically]], [[feedback_system_quality_is_prime_directive]],
  the redesign spec at `plans/morning-routine-redesign.md`.
