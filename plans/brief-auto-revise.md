# Daily Brief — Auto-Revise Loop

**Status:** Proposed 2026-04-23. Not yet built.
**Goal:** Emailed brief is a **final** runbook, not a triage queue. Everything likely-wrong gets silently corrected before send; Jill opens the email and publishes.

---

## Problem today

Build-brief already runs `verifyAlertDraft` → `webVerifyClaims` and surfaces verdicts in the approve card. But if a claim comes back `likely_wrong` (or high-severity `unverifiable`), the draft text is **unchanged** — Jill has to manually edit the alert before publishing.

Example from 2026-04-23: Hawaiian/oneworld alert said "bookable now," but web-verify confirmed partner bookability takes weeks. The chip flagged it; the alert body still lied.

## Desired outcome

Jill opens the brief and can one-click publish every approve card without editing copy. Revisions happen internally; she sees *what* was revised and *why* in a small "reviser notes" strip under the card, so nothing is hidden.

---

## Architecture

Add a 4th Sonnet step in the per-alert pipeline inside `/api/build-brief`:

```
1. writer       → draft (title, summary, description)
2. verify       → claims[] with supported=true/false
3. webVerify    → verdicts on unsupported claims
4. revise  ←─── NEW: rewrite draft using verdicts + evidence
5. verify       → re-check revised draft
6. webVerify    → re-verify any still-unsupported claims
```

Loop steps 4–6 up to **2 iterations**. Exit when:
- No `likely_wrong` claims remain, AND
- No *new* unsupported high-severity claims introduced by revision

If still flagged after 2 loops → ship the last-good version with a flag in the approve card ("Reviser couldn't resolve: see claims").

### Revise prompt shape

Input:
- Original source `raw_text` + `source_url`
- Current draft (title/summary/description)
- List of problem claims: `{claim, web_verdict, web_evidence, web_url}`
- Brand voice reminder (from `editorialRules.ts BRAND_VOICE`)

Instructions:
- Rewrite so the claim reflects web evidence, not the source's overclaim
- Keep sassy/funny traveler-friend voice (don't hedge into mush)
- Preserve the action (what reader should do); change the framing
- Return the revised draft in the same shape as the writer

### Persistence

New column on `alerts`:
```sql
revision_log jsonb
-- shape: [{iter, changed_fields: ['description'], reason: '...', source_url: '...', before: '...', after: '...'}]
```

New counters on `daily_briefs`:
- `revisions_run int` — how many alerts went through revise
- `revisions_resolved int` — how many exited with no likely_wrong
- `revisions_persistent int` — how many still flagged after 2 loops

### Approve card change

Under the fact-check chip area, add a "Reviser notes" strip (collapsible) that shows `revision_log` entries in plain English:

> **Revised:** The original draft said "bookable now." Per Prince of Travel, partner bookability takes a few weeks to filter through — rewrote to "bookable in the coming weeks, with some partners live today." [source](...)

Stand-in sees what changed; if disagreement, they can open the alert and override.

---

## Constraints

### Time budget
Build-brief is at 300s cap today. Each revise loop adds ~30–60s per alert (Sonnet + verify + webVerify).

**Mitigation:**
- Run revision **in parallel per alert**, not sequentially. The current pipeline already parallelizes writer+verify per intel; extend to include revise.
- Only revise alerts with `likely_wrong` claims — skip "clean" drafts entirely.
- If the total time estimate (n_flagged × ~45s) would exceed budget, cap at N highest-priority alerts and mark the rest "not revised — check claims manually."

### Cost
Each revision iteration: 1 Sonnet call + 1 verify + 1 webVerify ≈ $0.03–0.08 per flagged alert. At ~2–4 flagged alerts/day × 2 iterations max ≈ $0.50/day ceiling. Acceptable.

### Voice drift
Reviser may over-hedge ("might," "could potentially") to be safe. Prompt must include explicit brand-voice example before/after pairs to calibrate.

### Trust
If the reviser ever writes something *wrong* (e.g. misreads web evidence), it now ships to email instead of being caught in admin review. Mitigations:
1. **Only revise `likely_wrong`** for v1, not `unverifiable`. `Unverifiable` stays as-flag-only.
2. Every revision shows in the card. Stand-in can still override.
3. Max 2 iterations — no runaway.
4. Log every revision to `revision_log` + a new `ai_revisions` table (or just the jsonb column) so we can audit.

---

## Build phases

### Phase 1 — Revise one-shot (no loop yet)
- [ ] Add `utils/ai/reviseAlertDraft.ts` — Sonnet call with prompt above
- [ ] Migration 019: `alerts.revision_log jsonb`
- [ ] Extend `/api/build-brief` to call revise **once** if `likely_wrong` present, after webVerify
- [ ] Persist revised draft + revision_log
- [ ] Show revision strip in approve card (briefEmail.ts)
- [ ] Manual test on a known-wrong alert (re-run today's Hawaiian case)

### Phase 2 — Loop to 2 iterations ✅ shipped 2026-04-23
- [x] Wrap reviser in a `while (likely_wrong && iter < 2)` loop
- [x] Track `revisions_run / succeeded / failed / resolved / persistent` counters in build-brief response
- [x] Approve card revision strip goes amber when reviser ran but flags persist

### Phase 3 — Reliability polish ✅ shipped 2026-04-23
- [x] Standalone "Revise alert" admin button (same pattern as Re-run web verify) — sidesteps 300s budget when build-brief skips revise
- [x] Add revise counters to daily brief email footer ("3 alerts auto-revised today")

### Deferred (v2+)
- Extend to `unverifiable` high-severity claims (more false-positive risk)
- Voice-check pass on revised draft (currently only on content-ideas)
- Confidence score per revision ("reviser is 80% confident")
- Learn from human overrides (if Jill rejects a reviser change, flag the pattern)

---

## Success criteria

1. Zero `likely_wrong` claims in the published version of any approve-card alert for 7 consecutive days
2. Brief email is publishable without opening the admin to edit copy (per Jill)
3. Revision notes strip visible and useful in ≥80% of revised cards (per Jill judgment)
4. Build-brief stays under 300s on 14-day average
