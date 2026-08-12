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
   `Pages ✅/✍️/—`.

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
node scripts/morning-dedup.mjs          # flag reworded re-forwards of published alerts
node scripts/morning-dedup.mjs --apply  # after a glance, suppress the confirmed ones
node scripts/morning-snapshot.mjs        # the full structured feed for the cards below
```
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

### Step 1 · 🧹 Loose ends from yesterday
Yesterday's decisions that didn't complete. Source: overdue reminders of kind
`todo` (esp. "Social post:" / "Social post before it ends:") + any alert you
published yesterday with no social posted. Present as a short list with a rec
each (post today / dismiss because the deal ended / still relevant). Bulk-dismiss
the truly-passed ones on her word.
Receipt example: `✅ Step 1 done — dismissed 3 ended-deal reminders; kept Chase
Sapphire Lounges for today's social.`

### Step 2 · ⏰ Reminders due today
From the snapshot REMINDERS `[TODAY]` list. Bid-to-win auction reminders
(Wyndham/Marriott/Accor "Bidding closes") are low-priority — note, don't push.
Flag any real time-boxed action (a deal's last day).

### Step 3 · 🔥 Decisions (the core)
Feeds: fresh intel + pending drafts + transfer-data + welcome-bonus signals.
**Pre-filter to the real ones.** The snapshot marks each item:
- **🇺🇸 US-signal** and **🆕 new-program** → ALWAYS a real decision (never collapse).
- **⤵ auto-handled candidate** (non-US / recurring-sale) → collapse into one
  `auto-handled (N)` line. **FLAG-ONLY for now — reject nothing automatically.**
  Show the line, say "say `show` to expand," and if Jill doesn't, they carry to
  the default (non-US → reject, recurring → newsletter) but she saw the count.
- Everything else → the decision card.

Verify the chart-worthy candidates BEFORE presenting them (see Verification
below), so the **Reverified** column is real. Card format:
```
STEP 3 of 7 · 🔥 DECISIONS (4 real · 12 auto-handled)

#  Item                              Reverified    Pages         My rec
1  Choice Privileges Japan deval     ✅ TPG/LL     ✍️ Choice pg   PUBLISH
2  AA Admirals fee → $1,400          ✅ aa.com     ✍️ AA page     PAGE-NOTE
3  IHG 10k Ruby / 8k every 4 nts     ⚠️ verifying  —             HOLD
4  Air Canada sells 25% of Aeroplan  ✅ OMAAT      —             REJECT (industry, not actionable)

auto-handled (12): 8 non-US → reject · 4 recurring sales → newsletter   (say "show")
Your calls?  (e.g. "1 yes, 2 yes, 3 hold, 4 reject")
```
Execute to her brand voice: publish via content_variants pipeline, set a clean
`short_slug`, fix any `✍️` page as part of publishing.

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

### Step 5 · 📣 Social & posts (pick ONE)
One step, **two sub-cards** (different logic, different volume):
- **Sweepstakes** (usually 3-10) — the snapshot ⭐ is the ranked pick; points/miles
  giveaways lead (Jill's best format). Avoid re-posting the same program two days
  running; skip bid-to-win auctions and the HGV timeshare one for social.
- **Experiences** (usually 0-2) — marquee/points-redeemable ones; be honest
  bid-vs-redeem, note the Chase-transfer angle.
Also weigh a deal expiring in 48h (last-chance) and a fresh publishable intel
angle. Recommend THE one to post today with a one-line why-it-engages + our
value-add. Draft it only when Jill says go (facebook-post / instagram-post skill).

### Step 6 · ✍️ Article (propose-only)
Pitch the single best article idea from today's intel + `/admin/content-ideas`.
Write nothing until Jill picks it.

### Coverage (folds into Step 4, only if non-empty)
Source gaps: programs in blog/email intel with no active Scout source. Propose
adding + live-test Firecrawl→Haiku before adding. Usually 0.

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
- The dashboard "Your day" checklist mirrors these steps — keep in sync.
- Standing auto-filters are FLAG-ONLY today; a category only graduates to true
  auto-reject after ~2 weeks of zero flagged misses (US-signal + new-program are
  permanent hard guards, never collapsed). Standing-rules live in the snapshot
  script for now (code constant); move to a DB table if/when auto-reject turns on.
- Reminders can be auto-generated from a published alert's explicit ISO `end_date`
  (skip fuzzy "through August" dates); auto-expire past ones to keep the table lean.
- Related: [[feedback_morning_pretriage]], [[project_daily_ritual_plan]],
  [[reference_publish_alert_programmatically]], the redesign spec at
  `plans/morning-routine-redesign.md`.
