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
   actions are done, send a **categorized status** headed `✅ Phase N · TITLE —
   status`, grouping every concrete change under only the buckets that apply, each
   bullet SOURCED or LINKED where relevant (2026-08-28, Jill wants a complete,
   scannable record, not a capped dump — "status can improve"):
   - **🔍 Verified** — what was fact-checked + against which source(s)
   - **📣 Published** — alerts/social, with the clickable URL
   - **💾 Data changed** — each field/row edit (show the new value)
   - **💻 Code shipped** — each change, with the PR link
   - **🛡️ Guardrails** — monitors/rules/checks added
   - **⏲️ Auto-jobs set** — crons, reminders, auto-expiries with their date
   Skip empty buckets; list everything that changed, don't artificially cap it.
   **After sending the receipt, save progress: `node scripts/ritual-progress.mjs
   --complete N`** — so if the session ends here, the next one resumes at Phase N+1.
   Then, before `Next →`, add a one-line
   **`🔧 Phase N retro:`** — the single best idea to make THIS phase better (or
   "running well, no change") and ask if she wants it. Jill wants every phase to
   keep sharpening (2026-08-27). If she says do it, apply the improvement to this
   skill file (and commit) before moving on; if "next"/"skip", proceed. Keep the
   retro to ONE idea, never a list. **Give an HONEST verdict — "no change" is a
   real, encouraged answer; never invent a filler improvement just to have one.
   And genuinely evaluate for yourself: if you disagree with Jill's call on a
   phase (or anything else), say so with your reason — she wants a real advisor,
   not agreement.** See [[feedback_proactive_expert_guidance]].
3. **Same layout every day.** Fixed card header (`PHASE N of 25 · TITLE`; `of 26`
   on Thursdays), fixed columns, fixed verdict words. Consistency is the feature.
4. **Empty phases auto-skip** with one line (`Phase 9 · Experiences — none new ✅`).
5. **Jill drives:** `next` / `skip` / `back` / `done`. **Never PROPOSE skipping or
   deferring a non-empty phase** (Jill, 2026-08-28: "don't suggest again to skip
   phases... we have plenty of time"). Go through them in order; she skips if she
   wants to. Empty phases still auto-skip with one line.
6. **Verdict vocabulary** (use these exact words): `PUBLISH · QUICK-TAKE ·
   PAGE-NOTE · HOLD · REJECT · DISMISS`. There is **no "NEWSLETTER" verdict**
   (Jill, 2026-08-31): a deal reaches the newsletter ONLY because it was published
   as an alert (full or QUICK-TAKE) first — nothing is "parked for the newsletter."
   Status marks: `Reverified ✅/⚠️` · Page status in plain words: **correct** /
   **needs fixing** / **n/a**.
7. **ALWAYS show Jill the full draft before publishing — every time, no
   exceptions.** She approves or edits first; nothing goes live unseen. Alerts,
   social posts, and page fixes alike.

Obey the always-on rules for Jill: lead with a recommendation on every decision;
only verified facts (official issuer/program source, never a blog); clickable
links for anything to open; her outstanding actions go LAST; alert writes go
through `content_variants`, never the `alerts` mirror.

The phases fall in three acts: **A. Clear the overnight (1-5)** ·
**B. Keep the site true & fed (6-14)** · **C. Improve & build every day (15-21)**,
then the daily wrap. The chain check runs LAST in Act B (Phase 14, after the
articles) so it sweeps **everything produced today** (publishes, page fixes, the
articles, experiences). Two standing product builds advance a little each day: the
**User Accounts build** (Phase 20) and the **AI visibility & trust build**
(Phase 21). **Analytics review is the content/performance wrap** (Phase 22), then
the day closes with three standing "are we covered / is the core asset healthy"
checks: **Deliverability & list health (Phase 23)**, **Security (Phase 24)**, and
**Backup & recovery (Phase 25)** — fast posture checks daily, with a deeper pass on
a cadence (Security deep on Mondays, a Backup restore-drill monthly). On
**Thursdays only**, the **Newsletter build** runs as Phase 22, pushing
Analytics→23, Deliverability→24, Security→25, Backup→26. Header the run as
`PHASE N of 25`; on Thursdays, `N of 26`.

---

## Phase 0a (Jill's job, before "morning")
Jill forwards her issuer/program promo emails to the intel inbox first. They land
as `source_type=email` in the fresh-intel list. Do NOT forward Google Alerts
(one email = one item; multi-story digests lose stories). Issuer emails are gold;
third-party affiliate blasts that hide the card name are noise → reject.

## Phase 0a·resume — check where we left off (FIRST, before anything)
```
node scripts/ritual-progress.mjs         # is today's ritual already in progress?
```
The ritual is long and often stops mid-way (Jill: "I don't get past 11 sometimes").
This persists progress across sessions (`ritual_progress`, mig 647). **If it says
`IN PROGRESS — RESUME at Phase N`, OFFER THE RESUME**: "You reached Phase N-1 earlier
today — resume at Phase N, or start fresh?" If she resumes, skip the board and jump
straight to Phase N (the early data-pull still runs so the feed is current). If it
says `not started` but a prior day was left incomplete, note it and **prioritize the
back-half phases today** so articles/improvements/User-Accounts/AI-visibility stop
getting starved. **After EACH phase's receipt, run
`node scripts/ritual-progress.mjs --complete N`** so progress is always saved; run
`--finish` at the CLOSE. `--reset` starts today over.

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
🩺 Health:   brief ⚠️ 2d stale · Scout ✅ · watchers ✅ · errors 🔴 1    ← flag anything red
🔴 Urgent:   1 deal ends in 48h · 2 reminders due today
📋 Decisions: ~4 real · 12 auto-handled · 7 page-affecting facts
🛠️ Improve:  today's process / data / visual picks queued (Phases 15-17)
→ say "next" to start Phase 1
```
Then wait for `next`. **The Health line MUST include a `Logged errors` state from
the snapshot's `Logged errors` HEALTH line (`system_errors` where `resolved_at IS
NULL`).** Any 🔴 there is a hard-stop flag — name it on the board and resolve or
escalate it in Phase 1; never open the day reporting "all green" while an error
sits unresolved (2026-08-28: an `experiences-coverage` error hid for a day because
the board didn't surface logged errors at all).

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

### Phase 4 · 🗂️ Triage the intel queue — BY TYPE, in TWO passes (4a → 4b)
Source: `node scripts/morning-triage-by-type.mjs` — it groups the undecided queue
by Scout's `alert_type`, collapses near-duplicate re-forwards, and flags every
item **✓ COVERED** (matches a published/expired alert) vs **🆕 NEW**. Only 🆕
items are shown.

**Walk it in TWO sub-passes, in this order (Jill's structure, 2026-09-01). Finish
4a completely — including verifying and SHOWING any draft she approves — before you
start 4b. Never jump ahead to 4b while a 4a draft is unshown.**

- **Phase 4a · PROMOS** — the promo-type groups: `limited_time_offer`,
  `signup_bonus`, `award_sale`, status/elite promos. List each group ("3 limited
  offers — here they are") and Jill decides the group. Most are REJECT; the fresh,
  genuinely-actionable few become a QUICK-TAKE or full alert.
- **Phase 4b · PROGRAM CHANGES + EARN** — the change groups: `transfer_bonus`,
  `devaluation`, `partner_change`, `fee_change`, `program_change`, `policy_change`,
  `award_availability`, and **credit-card earn**. Same group-by-group decision.

**Golden rule for BOTH passes: decide each type-group on its own — NEVER bulk-reject
the whole phase blind.** Jill wants to see each group and call it. Present the group,
your rec, and act on her word.

**Credit-card "earn" items in 4b are PAGE-ACCURACY checks, not automatic alerts.**
For each: verify the benefit against the **official issuer page**, then confirm the
relevant **card/program page reflects it** — fix the prose/data if stale (with a
PAGE-NOTE + `content_updated_at` bump on programs; note `credit_cards` has NO
`content_updated_at` column — silent-column trap). Many "earn" items turn out to be
**limited promos** (don't belong on a page → reject) or **not-ours** (e.g. an Uber
One perk, a non-covered program → reject). Only a genuine standing benefit that's
missing/stale drives a page edit. (Pattern proven 2026-09-01: of 3 "earn" items, one
was already correct on the page, one a promo, one an Uber One perk — all rejected, no
edit needed.)

**📅 SOCIAL-CALENDAR ASK (every time an alert publishes; Jill, 2026-09-01).** Right
after you publish an alert, ASK: **"Add this to the social calendar?"** If yes, drop
it into the calendar's Recommended lane so she can drag it to a day (or hit Schedule
to take the suggested date):
`node scripts/add-social-triage.mjs --topic "<short post topic>" --category <sweet_spot|deal|program_news|sweepstakes|experience|guide> --ref alert:<slug> --date <YYYY-MM-DD suggested> --link /alerts/<slug>`
Pick the category by what the post is ABOUT (a sweet spot → sweet_spot, a bonus/sale
→ deal, a devaluation/partner change → program_news). It dedups by topic + ref, so it
won't double up with the auto-ingested reminder. If she says no, skip it. See
[[project_social_media_dashboard]] (`/admin/social-calendar`).

**Rules that shape both passes (Jill, 2026-08-28):**
- **A sale / points-buy / bonus is an ALERT candidate, not "just newsletter
  fodder."** Each type-group is the unit of decision; deals reach the newsletter
  *because* an alert exists first.
- **NEVER recommend an item as a fresh alert without the COVERED check.** The tool
  does it deterministically (program overlap + title-token match); trust the 🆕
  flag, and when spot-checking use `--covered`. Guard against re-floating something
  already published (mistake caught 2026-08-28).
- Drill a group with `--type <alert_type>`. Apply verdicts by ID via
  `triage-apply.mjs`. Verdicts: PUBLISH / QUICK-TAKE / PAGE-NOTE / HOLD / REJECT
  (no "newsletter" verdict — retired). US-signal + new-program are never
  auto-collapsed.
NOTE: the nightly **`intel-autoclear` cron** (mig-free, `utils/intel/autoclear.ts`,
09:50 UTC) now pre-drains the queue of items that need no human — **already-covered**
(matches a published/expired alert), **expired** (past their own `expires_at`), and
**aged-out email forwards** (>30d) — all reversible, and it NEVER touches
`update_to_alert_id` alert-updates. So Phase 4 should open SMALL (built 2026-09-02
after a month of forwards piled to 143 undecided → 2 genuinely-new after one run). If
the queue is still large, the cron likely did not run — hit `/api/cron/intel-autoclear`
or check its logs; a truly large NEW pile is rare. This phase is the human layer over
what the autoclear leaves.

### Phase 5 · 🔥 The two NON-intel feeds (never "already done")
**The publish-decision core lives in Phase 4 (4a/4b) now** — that's where verified
intel becomes a shown-first draft and gets published. So Phase 5 is NOT "publish
decisions" anymore; it is the **two feeds 4a/4b never touch**, and it must run
every morning as its own two-item checklist. **Do NOT skip it on the reasoning
"we already published today" — that's the exact miss caught 2026-09-01; those
publishes were 4a/4b, and these two feeds are separate.** Walk each, one at a time,
verified against official first:
1. **Experiences to review — JILL REVIEWS THESE HERSELF ON THE DASHBOARD (Jill,
   2026-09-02). Do NOT present them or recommend SKIP-all.** Send her to
   **`/admin/experiences`** ("there are N new to review") — she has the judgment on
   what's genuinely good + US-worthy, and the UI lets her ⭐ Feature and use the
   **"+ Social calendar"** button. That button auto-times the post
   (`addToSocialCalendar`): **fixed-price posts RIGHT AWAY** (limited packages can
   sell out before the close date), **auctions ~5 days before close** (bid lead
   time). Reviewing/featuring/adding each stamps `editorial_reviewed_at`, clearing
   the /admin count. Your job here is just to hand her the dashboard and wait for
   `next` — she owns the curation.
2. **Legacy `newsletter_idea` item expiring soon** (snapshot `NEWSLETTER ITEMS
   EXPIRING SOON`) → **PUBLISH now** (a QUICK-TAKE or full alert before the
   deadline) or **REJECT**. There is no "keep for newsletter" anymore — the bucket
   is retired (Jill, 2026-08-31); this feed just drains the legacy parked items.
   Anything worth featuring becomes an alert the newsletter can pull.

If a genuinely alert-worthy publish candidate somehow *wasn't* caught in 4a/4b
(e.g. it came from an experience above), draft it FIRST and **SHOW HER THE FULL
DRAFT before anything goes live — ALWAYS** — then publish via the content_variants
pipeline (clean `short_slug`) and fix any **needs-fixing** page as part of it.

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
- **SIBLING CHECK (free blast-radius sweep):** whenever you fix or verify one
  card's welcome bonus on an issuer's official page, **check that card's family
  siblings while you're on the same page** — they're listed right there at no extra
  cost, and if one drifted the others often did too. (2026-09-01: Delta Reserve was
  stale at 100k; the same delta.com page confirmed Gold 80k+$250 and Platinum
  90k+$300 were already correct — 1 of 4 stale, caught in one visit.) A stale bonus
  that reads HIGHER than reality is the dangerous kind (over-promising), and the
  `card_bonus_signals` monitor is blind to hybrid cert+miles offers, so this manual
  sibling pass is the real safety net for issuer families (Delta, Marriott, Hilton,
  United, AA, Chase co-brands).
Resolve each at `/admin/card-bonus-signals`.

**Also report the "prose to re-check" queue** (same dashboard) — cards with
`good_to_know_review_at` set: the welcome-bonus DATA changed but the card's
`good_to_know` prose may still quote the OLD figure. **Give a per-item status
breakdown, never just a count** (Jill, 2026-08-28: "let me know the status of each
— 8 in the queue, one needs fixing, etc."): for each card, classify it
**🔧 NEEDS FIXING** (prose quotes a stale number → fix the prose, which clears the
flag), **🔍 VERIFY** (offer status uncertain → confirm vs official/consensus, then
fix or mark reviewed), or **⏳ PENDING** (a future-dated revert like an elevated
offer ending, or a watch for a rumored change — correctly waiting, leave it). Fix
the stale, verify the uncertain, leave the pending, and say which is which.
Auto-skip if none pending AND nothing flagged.

### Phase 8 · ♻️ Refresh queue (freshness guardrail — nothing goes stale silently)
Source: snapshot `REFRESH QUEUE — oldest due`. Walk the **oldest-due** items
(programs, transfer-partner sets, alerts, and GUIDES & evergreen articles) and
re-verify the top few against official sources (multi-source standard). Cadence:
process the **3-5 oldest due each day** so the queue never grows; if the backlog is
large, do more until it's under control. A re-verified item gets a fresh
`content_updated_at` / review date and drops off. **To clear a re-verified ALERT
from the queue, use `node scripts/mark-alert-verified.mjs <short-slug> ...`** — a
direct `alerts.last_verified` write is blocked by G6, so this stamps the alert's
content_variant metadata and lets the variants->alerts trigger mirror it. Only
stamp an alert you actually re-verified against an official source today.
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
giveaways lead. Flag the best as a Phase-18 social candidate; **Feature** the
keepers (they lead the newsletter) and **Reviewed** the rest so the board shrinks;
`⚠ Timeshare` rows are vacation-club lead-gen (hidden from the public page). Curate
at `/admin/sweepstakes`. Auto-skip if none new.

**Scope = STRICT (Jill, 2026-08-28): loyalty-program points/miles sweeps ONLY** —
run by an airline/hotel/card rewards program, OR whose prize IS that program's
points/miles. Third-party "win a free trip / free flights on route X" giveaways are
OUT (off-brand for a points site; verified 2026-08-28 that ContestGirl / Sweeps
Fanatics / Sweeps Advantage are ~all third-party travel prizes, so generic
aggregators add noise, not data). **Grow coverage from ORIGINAL first-party sources
as we go:** when a real loyalty-program points sweep surfaces (in intel, a scrape,
or anywhere), enroll ITS OWN page in `sweepstakes_sources` (kind `program`) — the
way each AAdvantage "Perks" team site is enrolled — after a quick Firecrawl→Haiku
live-test. Don't bulk-add directory aggregators; the only one that yields is Sweeps
Advantage (airlines+hotels), already enrolled. See [[reference_sweepstakes_sourcing_strict]].

### Phase 11 · ✈️ Changes/Cancellations — next airline (1/day)
Add the "Changes, Cancellations & Delays" section (`programs.changes_policy`) to
the next-priority airline page — **cadence 1 airline/day**. Verify against the
airline's OWN official change/cancel page (no blogs). Priority: United, Delta, AA,
Alaska/Atmos, Aeroplan, Avios, ANA, Cathay, Emirates, Turkish, KrisFlyer, Virgin,
LifeMiles… See [[project_award_change_cancel_section]].
**Cross-check every airline against the stored fee scaffold**
`plans/award-change-cancel-fees-reference.md` (Jill sourced it 2026-08-31): verify
official FIRST, then reconcile against that list — agreement = high confidence, a
mismatch means dig until you know which is right. The list is UNVERIFIED and
already had a wrong AA entry, and its "~$USD" conversions must be stripped (native
currency only in published prose). Author in the 4-bullet house format (How to
change or cancel / Fees / If delayed or changed / How to reach the airline), plus
a **"Cash tickets, for reference"** bullet when the airline has dropped cash change
fees (Jill, 2026-09-01 — readers book cash on the same carrier, so it's useful).
**ALSO author 2-3 structured FAQ Q&As** into that program's `faq` jsonb (renders as
FAQPage JSON-LD via the shipped rendering, #1359) covering the change/cancel facts
you just verified — so each airline ships human prose AND AI-browsable schema in one
pass (Jill, 2026-09-01). Derive the FAQ answers from the SAME verified official
source, never new unsourced claims. **Follow the FAQ house style
([[reference_program_faq_house_style]]): lead every answer with Yes/No or the direct
fact (AI extracts the first sentence), favor yes/no questions, phrase each as a real
AI query, self-contained, no dashes, no valuations.** This is the per-section-FAQ
backfill happening incrementally; see the standing FAQ-backfill project.

### Phase 12 · 🔎 Roadmap mining + reconcile (keep it CURRENT)
Two halves — mine forward, and true up what shipped:
- **Mine:** review everything done today (quick takes, page fixes, intel rejected,
  things verified) and pull out NEW article topics. Each → a `content_ideas` row
  tagged to a pillar (`roadmap_reviewed=true`), or enrich an existing idea. Use `node scripts/add-content-idea.mjs --title .. --pitch .. --pillar .. --program .. --alert ..` (handles the type/source constraints).
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

The per-card **Card Companion PDF** initiative is its own workstream — see the
Card Companion standing project at the end of this file. It is NOT one of the
two daily articles.

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

### Phase 19 · 🖼️ Campaign creative for the image library
Build ONE reusable ad creative for the library (`/admin/creatives` +
`campaign_creatives`, mirrored in `plans/campaign-creative-library.md`). Pick the
day's best campaign-worthy candidate — a marquee experience/Moment, a big transfer
bonus, a sweet spot, a flash drop — and produce a scroll-stopping creative for it:
- **Write a tailored Copilot prompt** from the reusable template
  ([[reference_campaign_landing_pages]]), swapping the **color scheme to the event's
  team/brand colors** (brand-safe — colors aren't trademarks, only logos are; NEVER
  a real team logo) and the hero words/banner/date to the offer. Hand it to Jill to
  generate in Copilot.
- When she has the image, **catalog it** (insert a `campaign_creatives` row: name,
  event, category, color_scheme, prompt, image_url in `public/campaigns/`, used_on)
  so it appears in the gallery and is one-click reusable next time.
- Build the clean `build_graphic.py` counterpart too when we'll A/B test it.
No campaign-worthy candidate today → auto-skip in one line; never force a creative
just to have one. The point is a growing library that's ready the moment a campaign
is.

### Phase 20 · 👤 User Accounts build (a little every day)
The User Accounts & Wallet Dashboard product, built in **small daily increments**
(Jill, 2026-09-01) instead of a big-bang. Each morning, **advance it by one
shippable slice** and show Jill.
- **Follow the staged roadmap** in [[project_user_accounts_wallet_dashboard]] + the
  Stage 1 plan (`scratchpad/user-accounts-stage1-plan.md`): Stage 2 auth + account
  shell → Stage 3 wallet → Stage 4 saved content → Stage 5 personalized alerts →
  Stage 6 annual-fee/credit tracker. Pick up exactly where the project memory says
  we left off; do the next small piece, not the whole stage.
- **Locked decisions (do not re-litigate):** Supabase Auth, magic-link + optional
  Google, NO stored passwords; manual wallet (balances only, never credentials);
  RLS `auth.uid() = user_id` (with a `with check`) on every user table; free now
  with a `profiles.tier` flag; new user tables go in the off-platform backup. The
  Copilot-review refinements (SMTP via Resend, subscribers-merge consent, magic-link
  hardening, account deletion/export) are captured in the project memory.
- **Show Jill each increment** and get scope approval before anything that changes
  the plan. Verify against Next.js 16 + `@supabase/ssr` docs at build time.
- **Security is non-negotiable here** (PII + auth) — this phase feeds the Security
  and Backup checks below; anything it ships must satisfy both.
Auto-skip in one line only if genuinely blocked (e.g. waiting on Jill's approval).

### Phase 21 · 🔍 AI visibility & trust (a little every day)
Make crazy4points a source AI answer engines (ChatGPT, Perplexity, Google AI
Overviews) trust and **cite by name**. Standing build — **advance ONE concrete
lever each day** and show Jill (Jill, 2026-09-01). The goal is NOT Google rich
snippets (Google retired FAQ snippets in 2023); it is being an accurate,
accountable source AI extracts and attributes. The FAQ work is one lever, not the
whole game. Levers, in leverage order:
1. **Unique + accurate + FRESH data at scale (the moat).** AI cites sources with
   specific, correct, current facts it can't reliably get elsewhere — which is what
   this whole ritual produces. Daily move: **extend the program/card FAQ backfill**
   (yes/no-lead house style [[reference_program_faq_house_style]] + FAQPage JSON-LD)
   and keep the freshness guards green (drift, `faq_reviewed_at`, prose-on-data-change).
   **ALREADY SHIPPED — do NOT rebuild (see [[project_ai_visibility]]):** site-wide
   Organization + WebSite entity `@graph` (#1149/#1151), `llms.txt` (auto-generated),
   `/programs/[slug]/md` markdown exports, `robots.ts` allowing GPTBot/ClaudeBot/
   PerplexityBot, per-page WebPage/Article JSON-LD, sitemap with lastModified. The
   foundation is real; extend and use it, don't recreate it.
2. **Trust signals AI still lacks (the real remaining lever).** The Organization
   entity exists, but readers/AI can't yet see WHO verifies this and HOW. Build:
   **author/byline signals** on guides + alerts, a **"How we verify our data" / about**
   page stating the official-source-only + multi-source rule, and **surface each
   page's last-verified date + official sources** (`plans/sources/[slug].md`). An
   accountable, dated, sourced page gets cited; an anonymous one doesn't.
3. **Per-program structured data (memory's #1 highest-impact gap).** Program pages
   have WebPage + now FAQPage, but not the program's own facts as schema: transfer
   partners as `ItemList`, tiers as `OfferCatalog`, the program as `LoyaltyProgram`.
   AI ingests that with zero parsing. Plus auto-generated per-program **meta
   descriptions** (name + alliance + top transfer partners + hub) AI grabs verbatim.
4. **Off-site corroboration.** AI weights sources mentioned/linked elsewhere — feed
   it through our social + Reddit-data presence and earned references (never spam).
5. **Answer-shaped content.** Real AI-query phrasing, answers leading with
   Yes/No/the fact (the FAQ house style), so extraction is clean.
Each day pick the next concrete step (finish an FAQ batch, add author/verify signals,
ship per-program LoyaltyProgram/ItemList schema, write the "how we verify" page), do
it, show Jill. **DISCOVERY FIRST every time** — grep + check [[project_ai_visibility]]
before building; most of the infra already exists. Auto-skip if genuinely blocked.

### Phase 22 · 📰 Newsletter build (THURSDAYS ONLY — last content phase, before Analytics)
Runs only on Thursdays (the snapshot header prints `WEEKLY: Newsletter day`), and
**always the last content phase** (only the Analytics wrap follows it) so every
alert published, page fixed, experience/sweepstakes picked, and article written
*earlier today* is eligible for it — the newsletter is the day's content wrap-up,
not a parallel track. On any other weekday this phase does not exist; do not
surface it (Analytics then becomes Phase 22).

Build it **entirely from PUBLISHED alerts** and the site's own content, newest-first
(Jill, 2026-08-31: nothing is parked for the newsletter; it pulls from what we
published):
- **recent published alerts** (this week's Phase 5 alerts + quick-takes + the
  Phase 13 articles) — the newsletter's stories,
- **experiences / sweepstakes** picked in Phases 9-10, and the week's Sweet Spot,
- **Jill's Takes** (the biweekly-anecdote inbox), and the week's best evergreen.
Do NOT pull from a `newsletter_idea` bucket — it is retired. If a deal is
newsletter-worthy and not yet published, publish it (QUICK-TAKE) first, then it
is eligible.

**SWEET SPOT — never repeat a recent one (Jill, 2026-08-28).** Before picking the
week's Sweet Spot, pull the **last 10 sweet spots from SENT newsletters only**
via `node scripts/sweet-spot-history.mjs`
and show Jill that list with dates. Pick a program/topic that is NOT on it — the
sweet spot should feel fresh every issue. When a genuinely new sweet spot is
verified (e.g. Atmos short-haul partner economy 4,500), DOCUMENT it on the
program page's `sweet_spots` too so the win compounds ([[feedback_check_prose_on_data_change]]).

Use the existing builder — `runBuildNewsletter` / the `/admin/newsletter` page —
then `verifyNewsletterDraft` before anything is shown. **Editorial rules (hard):**
no fabrication, every claim sourced to official/issuer (see
[[feedback_newsletter_no_fabrication]]); the **editorial note tops the brief**
([[feedback_brief_editorial_top]]); no foreign-currency valuations or derived
point math. **Show Jill the FULL draft before sending — always.** On her approval,
send via Resend, **throttled to ≤4/sec** ([[feedback_resend_rate_limit]]). Receipt:
what led, how many stories, recipient count.

### Phase 22 (Phase 23 on Thursdays) · 📊 Analytics review — content/performance wrap
Runs after the content phases (after the Newsletter on Thursdays); the three
safety checks below (Deliverability, Security, Backup) then close the day. Added 2026-08-28
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

### Phase 23 (Phase 24 on Thursdays) · 📬 Deliverability & list health
The newsletter is the crown jewel, so watch it like one (added 2026-08-31, Jill).
Fast daily posture check; auto-skip with one line when all healthy:
- **Deliverability:** recent Resend send stats — **bounce rate, spam-complaint
  rate, delivery/open trend**. A rising bounce or complaint rate is an early warning
  that a mailbox provider (Gmail especially) is starting to junk us; act before reach
  craters. Confirm SPF/DKIM/DMARC for crazy4points.com still pass.
- **List hygiene:** net subscriber change (added vs unsubscribed), and scan new
  signups for **bot/junk patterns** (bursts, disposable domains, plus-address spam) —
  suppress the obvious ones so the list stays real ([[project_subscriber_bot_audit]]).
- **Unsub path works:** the personalized unsubscribe link resolves (CAN-SPAM +
  reputation). Flag any spike in unsubs against what shipped.
Same accuracy bar: **no number we haven't actually pulled**; name what we still
can't see (open/click stats are a known gap — [[project_newsletter_open_click_stats]]).
Deeper pass weekly. Auto-skip in one line when bounce/complaint/unsub are normal and
no odd signups.

### Phase 24 (Phase 25 on Thursdays) · 🔒 Security check — are we covered
Confirm nothing opened a hole (added 2026-08-31, Jill). Fast green/red daily; the
**deeper audit runs Mondays**. Buckets:
- **Secrets:** no keys/env committed — `.env*` stays gitignored; scan today's diffs
  for leaked tokens. Any exposure → rotate ([[project_secret_rotation_2026_04_21]]).
- **Dependencies:** `npm audit` summary — patch any new HIGH/CRITICAL CVE
  ([[project_dependency_cve_bump]]).
- **Admin auth:** every admin route + server action calls `assertAdmin()`
  ([[feedback_admin_auth_assert_admin]]); no admin endpoint left open. Spot-check
  anything shipped today that touched `app/admin` or `actions.ts`.
- **Supabase RLS / keys:** the service-role key stays server-only (never in the
  client bundle); anon/public access is limited to what the site needs; subscriber
  PII is not exposed through any public query or API route.
- **Abuse surface:** newsletter signup + forms are rate-limited; no open write
  endpoints; cron routes require the secret.
Daily = fast pass, auto-skip in one line when clean and nothing shipped touched
auth/secrets/deps. Mondays = the deep audit + apply one hardening.

### Phase 25 (Phase 26 on Thursdays) · 💾 Backup & recovery — Supabase safety net
Make sure a Supabase failure or a bad write can't wipe us out (added 2026-08-31,
Jill). This is the one where "later" is how data gets lost:
- **Supabase backups:** confirm the project's daily backups / Point-in-Time-Recovery
  are enabled and current (plan-tier dependent) — note the last successful backup.
- **Off-platform export of critical tables:** `subscribers` above all (losing the
  list is unrecoverable), plus `alerts`, `programs`, `sweepstakes`, `experiences`.
  Verify a recent dump exists OFF Supabase (a scheduled `pg_dump`/export to storage).
  **If none exists yet, that is the #1 gap → build it** (a cron that dumps the
  critical tables to storage, retained N days).
- **Restore drill (monthly):** confirm we could actually restore — recovery steps
  are written down and a test restore works.
Daily = confirm backups current + last export date (flag any gap loudly); monthly =
the restore drill.

---

## CLOSE (send after the last phase — Phase 25 Backup, or Phase 26 on Thursdays)
A fixed recap:
```
🌙 WRAP — Aug 12
Published: 1 (Choice Japan deval)   ·   Pages fixed: 2   ·   Reminders cleared: 3
Improved today: process (verify helper) · data (10 programs enrolled) · visual (alerts CTA)
Social queued: Chase Sapphire Lounges (your post)
Still owed by you: post the social · confirm the IHG deal terms
Next-best move: <one line>
```
Her outstanding actions ALWAYS last. **Then mark the ritual done:
`node scripts/ritual-progress.mjs --finish`** (so tomorrow starts fresh, not as a
half-finished resume).

---

## 💳 Card Companion PDFs (STANDING PROJECT — not daily, no phase number)
A separate workstream, outside the daily 1-24 flow. **Do NOT run it every morning
or push it — Jill activates it when she is ready (she said so 2026-08-28).** The
deliverable is a branded, fillable **interactive PDF Jill designs** (Royal Glow,
"claim every credit + track your spend"), one per card — see the **Sapphire Reserve
Companion (v54)**, the pilot. Claude is the fact engine + plumbing, never the
layout. The phase has three setup steps, then a per-card cadence:

1. **Fact-check the pilot (Sapphire Reserve) — FIRST, do NOT publish.** Red-team
   EVERY figure on the PDF against Chase's OWN current terms (chase.com 403s
   WebFetch → use the in-app browser): the $795 fee, the $2,190 credit stack and
   each component, the dated credits (Lyft 9/30/2027, Apple TV+/Music 6/22/2027,
   $250 Chase Travel hotel 12/31/26), the $75K spend-club unlocks, earn multipliers,
   and protection limits. Deliver a per-line checklist (✅ accurate / ⚠️ changed →
   fix, with the source per line). Multi-source-verify standard
   ([[feedback_multi_source_verify_before_draft]]); nothing on the PDF changes
   unless a real discrepancy is found. **Never set it live in this step.**
2. **Email-gated hosting.** Build the delivery: a "Get the Companion" capture on the
   card page (+ a `/guides` link) that takes an email and delivers the PDF — every
   companion becomes a subscriber engine (the PDF's QR already points at the Insider
   List). Free-download-with-CTA is the lighter fallback.
3. **Fact-sheet generator template (the reusable rail).** A helper that, for any
   card, assembles + multi-source-verifies the figures the PDF needs (welcome offer,
   each credit + cap/reset/expiry, annual fee, earn, `CardBenefitStacks`, transfer
   partners, protections, key dates) into a clean sourced fact sheet Jill builds the
   PDF from. This is what makes the eventual ~1/day per-card cadence realistic.

Then per card (once activated): run the generator → hand Jill the verified fact
sheet → she builds/tweaks the PDF → Claude hosts it + checks the card page prose
can't drift ([[feedback_check_prose_on_data_change]]). Priority: highest-traffic
cards first (Sapphire Reserve pilot, then Amex Platinum/Gold, Venture X…). See
[[project_card_companion_pdfs]].

---

## 👤 User Accounts & Wallet Dashboard (now a DAILY phase — Phase 20)
Moved from a standing project to a **daily build phase** (Jill, 2026-09-01): we
advance it a little every morning at **Phase 20** (see that phase for the cadence
and the locked decisions). **Stage 1 (planning) is DONE** — the plan lives at
`scratchpad/user-accounts-stage1-plan.md`, Copilot-reviewed, with all decisions +
refinements captured in [[project_user_accounts_wallet_dashboard]]. **Stage 2
(auth + account shell) is next.** Still show Jill each increment; she approves any
scope change.

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

**REJECT/SNOOZE intel by ID, never by substring.** Use
`node scripts/triage-apply.mjs --reject|--snooze <ids> [--reason … | --until …]`
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
- **QUICK-TAKE** → same as PUBLISH but a short, one-to-two-sentence alert
  (`writeAlertVariant`, depth kept light). This is how a small-but-real deal earns
  a spot the newsletter can pull; there is no separate "newsletter" bucket.
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
