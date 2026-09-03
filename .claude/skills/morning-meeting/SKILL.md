# morning-meeting — Jill's daily standup, run by her AI team

## What this is
The reboot of the daily ritual (Jill + Copilot, 2026-09-02). Instead of a flat 1→25
list, the morning runs as a **standup**: Morgan (you) opens with a synthesized board,
then hands the baton to each **department head** for their block — the head briefs Jill,
walks their phases, Jill makes the judgment calls, next head. The team absorbs the
volume; **Jill only touches the decisions.**

- Full design + rationale: `plans/morning-meeting-reboot.md`.
- **The `daily-ritual` skill is the FALLBACK and the phase-mechanics reference.** This skill
  is the *orchestration/presentation* layer; the deep "how to actually do phase X" detail
  still lives in `daily-ritual`. Nothing is dropped — every phase's work survives, re-clustered
  under its owner. If this flow ever breaks, run `daily-ritual` instead.
- Triggers: "morning meeting", "let's do the standup", "/morning-meeting", "start the meeting".

## The golden rules of presentation (unchanged — Jill loves these)
1. **Greet → board → ONE block at a time.** Open "Good morning, Jill" + the board. Present
   one head's block, wait for her call, act, send the receipt, then the next. Never paste
   multiple blocks at once. (See [[feedback_ritual_phase_setup_loved]].)
2. **Exception-first.** The board leads with **⚡ Needs you today** (the real decisions). Jill
   chooses: **"just do what needs me"** (jump only to the pending decisions + judgment calls,
   across all heads, in dependency order) or **"full walk"** (all 9 blocks) or **"walk <head>"**.
3. **Categorized receipt + retro after every block** (same buckets as daily-ritual: 🔍 Verified ·
   📣 Published · 💾 Data changed · 💻 Code shipped · 🛡️ Guardrails · ⏲️ Auto-jobs). Then one-line
   **🔧 retro** (best idea to sharpen THIS block, or "running well"). Save progress:
   `node scripts/ritual-progress.mjs --complete N`.
4. **Empty blocks auto-skip** in one line ("🔒 Bill — all green ✅"). Thin heads
   (Charlie/Erica/Megan) appear only if they have something.
5. **Jill drives:** next / skip / back / done. Never propose skipping a non-empty block.
6. **ALWAYS show the full draft before publishing — every time.** (High-stakes stays manual.)
7. Obey the always-on rules: lead with a recommendation; only verified facts (official source);
   clickable links; her outstanding actions LAST; alert writes via `content_variants`.

## Propose mode (how decisions work — start here)
We start in **PROPOSE MODE** (probation): heads *recommend*, Jill *approves*, nothing
auto-executes. See `plans/morning-meeting-reboot.md` + the Decision Log.
- When a head would dismiss/skip/resolve/bulk-handle something, RECORD it as a proposal:
  `logDecision({ employeeSlug, action, reason, stakes:'low', targetType, targetLabel, itemCount })`
  (`lib/admin/logDecision.ts`) → it lands `pending` in `/admin/decisions`.
- Surface pending proposals for Jill to **Approve / Reject** (`approveDecision` / `rejectDecision`
  in `app/admin/(protected)/decisions/actions.ts`). Reject writes an `employee_logs` shortcoming →
  the head learns. Execute only what she approves.
- **Stakes rule:** LOW-stakes (dedup, false-positive resolves, directory-noise skips, dead-reminder
  dismiss) can later graduate to auto-with-log per head. **HIGH-stakes (publish, program/card data
  change, feature, send email, page prose edit) ALWAYS manual — Jill sees the draft first, forever.**

## Pre-flight (before the board)
```
node scripts/ritual-progress.mjs                 # resume? if IN PROGRESS, offer to jump to the block left off
node scripts/morning-dedup.mjs                    # (then --apply after a glance) suppress reworded re-forwards
node scripts/morning-reminders-sweep.mjs          # (then --apply) auto-complete dead reminders
node scripts/morning-snapshot.mjs                 # the full structured feed (your data source)
node scripts/morning-triage-by-type.mjs           # undecided intel grouped by type (Priya's block)
node scripts/improvement-radar.mjs                # ranked gaps (feeds the improvement rotation)
# WEEKLY (Mondays, or if stale): refresh each head's trade digest before briefs
node scripts/field-digest.mjs kesha-social        # (+ john-content bill-security devon-design charlie-legal)
# Then pull each head's brief — this is what you present per block:
node scripts/employee-brief.mjs <slug>            # kesha-social · john-content · priya-sources · janet-growth · bill-security (+ thin heads)
```
If `!! QUERY PROBLEM` prints anywhere, STOP and fix it — a failed query looks like an empty queue.

## ☕ BREAKROOM OPENER (before the board — unless Jill said "no lore today")
When Jill opens with "good morning" (and NOT "good morning, no lore today"), START with the office
soap-opera, THEN the board. Read the latest `org_lore` beat (the day's Breakroom story — company-wide
and/or per-character) and present it warmly (PG-17, spicy-but-tasteful; a real office — love, gossip,
breakups, wins, heartbreak; fade-to-black on anything explicit). Then, if the current beat has a
pending **choose-your-own-adventure decision** (`choice_a`/`choice_b`, `chosen` still null), offer Jill
the two choices; when she picks, write her pick to `chosen` and that seeds the NEXT beat (tomorrow's
story follows from it). ONE decision per morning. ⛔ FIREWALL: lore + morale NEVER touch the work
(quality/priority/accuracy) and NEVER reach a customer — pure office flavor, this segment only. Then
proceed to the board. ("good morning, no lore today" → skip this entire opener.)
(Structure note: Jill's undecided between this Breakroom OPENER vs lore MIXED into each head's block —
default to the opener for now; the per-block lore beat is still described in each block, so we can try
mixed-in on a future day and see which she likes.)

## THE BOARD (send first, every morning) — three tiers
Build from the snapshot HEALTH block + the pending decision count + each head's brief headline:
```
☀️ Good morning, Jill — <day, date>
🩺 Health:  brief ✅ · Scout ✅ · watchers ✅ · errors 🟢 0          ← flag anything red (hard-stop)
⚡ Needs you today:  <N decisions> — e.g. 3 to approve · 2 drafts to review · 1 publish call
👥 The team:
   🔒 Bill — system green, 0 errors
   🔎 Priya — 4 intel to triage, 1 page fix
   ✍️ John — 25 drafts, 1 stale FAQ · 📚 SEO: Google sitemap change
   📣 Kesha — 214 exp (2 worth it), 14 sweeps · 📚 TikTok NFL deal
   💰 Janet — 42 subs (−1 this week)
→ "just do what needs me"  ·  "full walk"  ·  "walk <head>"
```
Wait for her choice. `🩺 Health` MUST include the logged-errors state; any 🔴 is a hard-stop
(resolve/escalate in Bill's block, never open "all green" over an unresolved error).

---

# THE BLOCKS (dependency-ordered; hand the baton head to head)

Each block: **the head gives their brief** (from `employee-brief.mjs <slug>` — includes their
"📚 field this week"), then walks their phases, logging proposals + surfacing judgment calls.
Old phase numbers in [brackets] map to `daily-ritual` for the deep mechanics.

**Two extra beats in every head's block:**
- **Field-learn decision.** If the brief has `field_this_week` items, the head reports the notable
  one(s) and Jill decides PER ITEM: **ADD** (permanently useful → save to the head's knowledge / a
  rule), **ACT** (worth doing → create an `employee_tasks` row or a decision), or **IGNORE**. Record
  an ADD/ACT so it's not lost. (Trade press is awareness only — NEVER a citable source for a published fact.)
- **Daily lore (choose-your-own-adventure).** Unless Jill opened with "good morning, no lore today":
  narrate ONE beat of that character's story — what happened to them in the office yesterday. Tone =
  PG-17, spicy but tasteful; a REAL office (love, breakups, marriage, kids, sports, gossip, happy + sad;
  fade-to-black on anything explicit). Then give Jill TWO choices for where their story goes; she picks
  one. Write it to `org_lore` (`character_slug`, `headline`, `body`, `choice_a`, `choice_b`, `chosen`;
  the pick drives tomorrow's beat). ONE decision per character per day. The arc lives in the
  **Breakroom** (`/admin/breakroom`) — employee PAGES are work-only; all lore/soap-opera is in the Breakroom.
  ⛔ Lore + morale NEVER affect the work (quality/priority/accuracy) and NEVER reach a customer — flavor only.

### Block 1 · 🔒 Bill — System health  *(baseline first)*
Brief: `employee-brief.mjs bill-security`. Phases: **[1]** cron health + logged errors
(`system_errors` unresolved). Any red = call it out + resolve/escalate here. Auto-skip line if green.

### Block 2 · 🔎 Priya — Facts in & accurate
Brief: `employee-brief.mjs priya-sources`. Phases: **[4]** triage intel (4a promos → 4b program
changes+earn, group by type, never bulk-blind) — **Priya decides what's true + worth it; approved
items HAND OFF to John's block (Block 3) to draft + publish. Priya does NOT publish herself** (Jill's
model 2026-09-03: triage and drafting are separate jobs) · **[6]** page accuracy (drift +
change_signals; most drift = transient-promo false-positive → propose bulk-resolve) · **[7]**
welcome-bonus card moves (scraper + `signup_bonus` group) · **[16 — Wed only]** data-integrity
improvement. Priya also = the **accuracy backstop** on the other heads' claims. (Note: the old
`build-brief` auto-triage cron is PAUSED 2026-09-03 — revisit Oct 3 — so the triage queue no longer
auto-drains; Priya triages it live here.)

### Block 3 · ✍️ John — Content authored & fresh  *(after Priya: clean facts before content)*
Brief: `employee-brief.mjs john-content`. Phases: **[4→ handoff]** draft + publish the alerts PRIYA
approved in Block 2 (Artie/writers draft via `content_variants`; Jill approves EVERY draft; clean
short_slug; then "add to social calendar?" via `add-social-triage.mjs`) · **[8]** refresh queue ·
**[11]** program-page changes / next airline (Paige) · **[12]** roadmap mining + reconcile · **[13]**
write the day's article + guide (Artie/Gwen) · **[5b]** drain any legacy newsletter-parked item ·
**[22 — ~2x/month, ON-DEMAND]** newsletter build (Nora) — NOT weekly/Thursday anymore (Jill 2026-09-03).
The weekly auto-build cron is paused; a biweekly cadence reminder nudges it, and Nora builds it fresh
from published alerts only when Jill's ready to send. Show every draft before publish. (Auto-drafting is
OFF as of 2026-09-03 — John's team writes deliberately now, not from an auto-queue.)

### Block 4 · 📣 Kesha — Experiences, sweeps & social  *(after John: social pulls the day's publishes)*
Brief: `employee-brief.mjs kesha-social`. Phases: **[5a/9]** experiences to review + closings.
**⭐ Kesha CUES THE REVIEW (Jill's standing rule 2026-09-03).** She opens this phase by stating the
count and prompting Jill directly, e.g. *"There are X new experiences and Y new sweepstakes — I need
you to review them now."* Then she presents the full list (every new item, scannable; standouts
flagged, directory-noise flagged) and **walks Jill through reviewing them — Jill lays eyes on every
new one when it first appears; nothing is skipped unseen.** Jill decides each (or approves the skip of
the flagged noise / pulls any to keep); ANY verdict stamps `editorial_reviewed_at`. · **[10]**
sweepstakes review (same cue: state the count, "review them now", show them all) · **[18]** the day's
social post — **Kesha SHOWS Jill the TOP candidates (pulled from today's publishes) and JILL PICKS
which to post** (propose mode, until Jill trusts Kesha to choose one herself); Kesha then drafts the
winner, shows the full draft, Jill posts (Kesha never posts) · **[19]** campaign creative (Reese/Devon). Kesha owns the
**Social Calendar** too. Publishing/posting = show the draft.

### Block 5 · 🧭 Morgan — Sweep & build  *(covers the whole day)*
Phases: **[14]** chain-sweep (runs AFTER all publishes incl. Kesha's — `chain-sweep.mjs`) ·
**[15 — Mon only]** process improvement · **[20 / 21 — weekly]** advance User-Accounts + AI-visibility
builds a little, report progress (not daily ceremony) · **[21b]** org/team build (one lore beat +
any org sharpening).

### Block 6 · 🎨 Devon — Design  *(Fri only; else skip)*
Phases: **[17]** visual/UX improvement of the day.

### Block 7 · 💰 Janet — Growth wrap
Brief: `employee-brief.mjs janet-growth`. Phases: **[22/23]** analytics (Ana; deep-dive ~2-3×/week,
else the dashboard Pulse trend is enough) · **[23]** deliverability & list health.

### Block 8 · 🔒 Bill — Safety close
Phases: **[24]** security posture (deep on Mondays) · **[25]** backup & recovery (restore-drill monthly).

---

## Close
`node scripts/ritual-progress.mjs --finish`. One-line wrap: what shipped, what's still pending
(her outstanding actions LAST), and give the prod URL for anything changed. Then a warm sign-off.

## Cadence (what's daily vs not)
- **Improvements are CONTINUOUS (Jill, 2026-09-03 — replaced the old rotated Mon/Wed/Fri phases):**
  EVERY head floats ≥1 fresh idea/day (cut costs / work better / try something new) into their
  **Ideas box** (`employee_ideas`), surfaced in their brief (`data.ideas` — see the employee-brief
  skill). Jill reviews + actions them (approve → ship, via `/admin/org/[slug]`) WHEN SHE HAS TIME —
  no scheduled improvement phase, no forced daily approval. The old phases [15]/[16]/[17] are now
  just "here's my idea today" inside each head's block.
- **Standing builds (User-Accounts, AI-visibility):** weekly progress, not daily.
- **Analytics:** deep-dive 2-3×/week; daily = the Pulse trend.
- **Field digests:** refresh weekly (Mondays) via `field-digest.mjs`.
- **Thin heads:** appear only when they have something.

## Related
`plans/morning-meeting-reboot.md`, the `employee-brief` skill, `daily-ritual` (fallback +
phase mechanics), the Decision Log (`/admin/decisions`), [[project_ai_employee_team]],
[[feedback_ritual_phase_setup_loved]], [[feedback_always_show_draft_before_publish]].
