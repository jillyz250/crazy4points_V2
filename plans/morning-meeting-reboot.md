# Morning Meeting — the daily-ritual reboot (plan)

**Owner:** Morgan (orchestrator) · **Approved by Jill 2026-09-02** (after a Copilot consult).
**Keep `daily-ritual` skill UNTOUCHED as the fallback.** New skill = `morning-meeting`.

## The goal (why we're doing this)
Jill's pain: the flat 1→25 ritual is long and stalls ("I don't get past 11"). The org
now exists, so the fix is: **the team absorbs the volume; Jill only touches the judgment
calls.** The morning becomes an *exception-first standup*, not an exhaustive walk.

## Principles
1. **Hybrid, not full person-by-person.** Morgan keeps the dependency spine (the causal
   chain that makes the ritual zero-dropped) and hands the baton to each head for their
   clustered block. (Copilot's key call — full person-grouping would break dependencies.)
2. **Exception-first.** The opening board surfaces "⚡ Needs you today" (the 3-5 real
   decisions). Jill can "just do what needs me" (jump to those) OR "walk the full meeting."
3. **Heads do grunt; Jill keeps judgment.** Heads auto-handle routine (dedup,
   false-positives, bulk-skip noise) and only escalate genuine calls. Jill always sees
   every draft before publish (standing rule — never bends).
4. **Zero-dropped preserved.** All 25 phases' work survives — re-clustered under owners,
   never trimmed. Empty blocks auto-skip in one line.
5. **Propose-mode first, graduate by stakes** (see Decision Log below).

## The reordered agenda (9 blocks, dependency-safe)
Morgan pulls every head's brief (`scripts/employee-brief.mjs <slug>`) up front → synthesizes
the board → then walks the blocks. Each head's brief is their block intro; their phases are
the work; the existing per-phase receipt is the outro. Order preserves dependencies
(facts → content → social → sweep).

| # | Block | Owner | Phases folded in (old numbers) |
|---|---|---|---|
| — | **Open** | Morgan | 0a resume · 0b data+briefs · board · 2 reminders · 3 reminders-due |
| 1 | **System health** | Bill | 1 health + logged errors (baseline before trusting any queue) |
| 2 | **Facts in & accurate** | Priya | 4 triage → publishes · 6 page accuracy · 7 welcome-bonus · 16 data-integrity |
| 3 | **Content authored & fresh** | John (+Paige/Artie/Gwen/Nora) | 8 refresh · 11 program pages · 12 roadmap · 13 articles+guides · 5b legacy-newsletter drain · 22 newsletter (Thu) |
| 4 | **Experiences, sweeps & social** | Kesha (+Reese) | 5a experiences review · 9 experiences→alerts · 10 sweepstakes · 18 social post · 19 creative |
| 5 | **Sweep & build** | Morgan | 14 chain-sweep (after ALL publishes) · 15 process improvement · 20 user-accounts · 21 AI-visibility · 21b org build |
| 6 | **Design** | Devon | 17 visual/UX improvement |
| 7 | **Growth wrap** | Janet (+Ana) | 22/23 analytics · 23 deliverability + list health |
| 8 | **Safety close** | Bill | 24 security · 25 backup |

Dependency notes: Kesha (block 4) runs after John (block 3) so social pulls the day's
publishes; chain-sweep (block 5) runs after Kesha so it covers everything; Bill bookends
(health opens, security/backup closes).

## Cadence trims (not everything is daily — cuts ~⅓ of the daily path)
- **Improvements (process/data/visual):** ✅ DECIDED — rotate ONE dimension per day
  (Mon process, Wed data, Fri visual) instead of all three daily.
- **Standing builds (user-accounts, AI-visibility):** Morgan advances them in the
  background, reports progress **weekly**, not as daily ceremony.
- **Analytics:** daily = the subscriber trend already on the dashboard Pulse; a real
  deep-dive **2-3×/week**.
- **Thin heads (Charlie/Erica/Megan):** appear only when they actually have something.

## The Decision Log (mig 655) — visibility + safety net (BUILD FIRST)
The precondition for letting heads handle anything on their own. Table `decision_log`:
every action a head takes on Jill's behalf → {employee, action, stakes, mode, status,
target, reason, count, correlation_id=morning date, reviewed_by_jill, timestamps}.

- **Surfaced:** "Recent decisions" on each head's `/admin/org/[slug]` page + a consolidated
  **`/admin/decisions`** feed (filter by head/date/reviewed) + a "⚡ Needs you today"
  pending-approval queue on the dashboard.
- **Reversible:** every dismissal/skip has one-click **Undo / bring it back**.
- **Learning loop:** a reject/undo writes an `employee_logs` `shortcoming` for that head →
  feeds the meters → the head sharpens. Early on Jill reviews a sample each morning; bad
  patterns surface + get corrected fast.

### Propose → Auto graduation (stakes-based)
- **PROPOSE MODE (default / probation):** heads write `mode='proposed' status='pending'`;
  **nothing executes** until Jill approves. She sees everything — today's flow, by head.
- **AUTO MODE (per head + category, once trusted):** `mode='auto' status='executed'`,
  still logged + undoable. Graduate **LOW-stakes only.**
- **LOW stakes (graduatable):** dedup, false-positive drift resolve, directory-noise
  experience skip, dead-reminder dismiss, snooze.
- **HIGH stakes (ALWAYS manual, never auto):** publish alert, publish social, program/card
  DATA change, feature an experience, send email, page prose edit. Jill always sees the draft.

## Build order
1. **mig 655 `decision_log`** (+ RLS) — DONE/foundation.
2. **`logDecision` helper** — one call heads use to record a proposed/auto decision.
3. **Decision Log UI** — `/admin/decisions` feed + per-head "Recent decisions" + dashboard
   "⚡ Needs you today" pending queue + Undo. (Devon.)
4. **`morning-meeting` skill** — the clustered agenda above, brief-per-head, exception-first
   entry ("just do what needs me" vs "full walk"), propose-mode approvals inline. Leaves
   `daily-ritual` intact.
5. **Wire heads to log** — each head records its dismissals/skips via `logDecision` (propose
   mode) instead of acting silently.
6. **Graduation controls (later)** — a per-head/category auto toggle once trust is earned.

## Decided
- Improvements: rotate one/day (Mon process / Wed data / Fri visual).
- **Opening board = three tiers** (Morgan's pick, Jill deferred): (1) Health line (as today) ·
  (2) **⚡ Needs you today** — the pending-approval decisions, the hero · (3) a compact
  **one line per head** (emoji · name · their brief headline / queue count). Familiar +
  exception-first + per-head glance.
