# Editor Pass — Value-Add Rewriter with Live-Verified Sweet Spots

## Problem

`writeAlertDraft` (Writer) does one shot: factual draft in brand voice, no
invented claims. Output is accurate but often reads like an AI essay:
formal transitions, meta-narration ("this one's squarely for the reader
who…"), no specific value-add beyond what's in the source.

We need alerts to read like a human travel-friend wrote them **and** add
a concrete, actionable sweet-spot that helps readers act on the news —
without fabricating award prices that may have changed.

## Solution: Writer → Editor → Verify → Editor-loop

The Writer produces a source-grounded draft (unchanged). A new **Editor**
pass:

1. Removes AI-tells and punches up sass.
2. Proposes **one value-add sweet-spot** — a concrete use case
   (e.g. "4.5k Avios one-way for short-haul AA flights under 650mi").
3. The sweet-spot claim flows through `verifyAlertDraft` + `webVerifyClaims`.
4. If the web says `likely_wrong` or `unverifiable` → Editor runs again with
   the failed claim in a "don't-try-this-again" list and generates a
   different sweet-spot.
5. Loop up to **N=3** attempts. If all 3 fail verification, Editor produces
   a final version **with no value-add** (pure source facts + sass polish).

The Editor is *not* trusted to self-verify. Every fact it adds gets the
same web-check treatment as source claims. Stale award charts auto-fail.

## Architecture

### New pieces
- `utils/ai/editAlertDraft.ts` — Editor prompt + call. Takes Writer draft
  + optional `rejected_sweetspots[]` + optional `problem_claims[]`, returns
  polished draft with at most one editorial sweet-spot injected into
  description.
- Add `kind: 'editorial' | 'source'` field to `VerifyClaim` so the reviser
  treats editor-added claims differently (strip vs rewrite).
- New stats in build-brief route: `editor_attempts`, `editor_succeeded`,
  `editor_gave_up`, `editorial_claims_stripped`.

### Pipeline flow (replaces current Writer → Verify)
```
intel
  ↓
Writer  (existing — source-grounded draft)
  ↓
Editor attempt 1  (polish + add sweet-spot A)
  ↓
verifyAlertDraft + webVerifyClaims  (grounds all claims, marks editorial ones)
  ↓
likely_wrong or unverifiable on editorial claim?
  ├── YES → Editor attempt 2 with rejected_sweetspots=[A]
  │         ↓
  │         verify + web-verify again
  │         ├── YES again → Editor attempt 3 with rejected_sweetspots=[A, B]
  │         │                 ↓
  │         │                 verify + web-verify
  │         │                 ├── YES → Editor attempt 4 with STRIP_VALUE_ADD=true
  │         │                 │         (produces polished draft with no sweet-spot)
  │         │                 └── NO → persist & publish
  │         └── NO  → persist & publish
  └── NO  → persist & publish
  ↓
Existing reviseAlertDraft loop still runs for any residual likely_wrong
on source claims (editorial claims get stripped, not revised, if they
survive to this point somehow).
```

### Editor prompt shape

```
You are the senior editor for crazy4points. The Writer produced a
source-grounded draft — your job is to:

1. REMOVE AI-TELLS: "this one's for the reader," "the calculus," "closes
   the gap," "gymnastics" (overused), "squarely," "straightforward,"
   "well-documented," any phrase that sounds like a press release or a
   consulting deck. Rewrite with direct address, sharp cadence.

2. ADD ONE VALUE-ADD: in the description (NOT title or summary), propose
   ONE concrete sweet-spot the reader can act on. It must be:
   - Specific: a real route, price, or use case (not "great for awards")
   - Current: reflect today's award chart, not last year's
   - Different from the rejected_sweetspots list below

3. NO SOURCE FABRICATION: you may not change, add, or remove any claim
   from the title/summary/description that was in the Writer's draft.
   Your sweet-spot is ADDITIVE, in its own paragraph.

REJECTED SWEETSPOTS (do not repeat):
<list from prior failed attempts>

If STRIP_VALUE_ADD=true: polish tone only, no sweet-spot.

Output JSON: { title, summary, description, editorial_sweetspot: string|null }
```

### Claim tracking

Update `VerifyClaim`:
```ts
interface VerifyClaim {
  claim: string
  kind: 'source' | 'editorial'     // NEW
  supported: boolean
  severity: 'high' | 'low'
  source_excerpt: string | null
  web_verdict?: 'likely_correct' | 'likely_wrong' | 'unverifiable'
  web_evidence?: string | null
  web_url?: string | null
  acknowledged?: boolean
}
```

`verifyAlertDraft` tags claims as `editorial` when the draft passed in
includes an `editorial_sweetspot` string — any claim whose text appears
in that string (or is the string itself) is editorial.

### Stripping, not revising, editorial claims

In the existing `reviseAlertDraft` flow, when a claim is `kind: 'editorial'`
and `web_verdict: 'likely_wrong'`:
- Don't ask Sonnet to fix it (there's no source to ground against).
- Just remove the paragraph containing the sweet-spot from description.
- Log to revision_log with `{ kind: 'editorial_strip', reason, ... }`.

## Rollout

### Phase 1 — Editor scaffolding (no loop)
- Build `editAlertDraft.ts` as stateless one-shot: Writer draft in,
  polished draft + optional sweet-spot out.
- Wire into `build-brief` after Writer, before Verify.
- Ship with STRIP_VALUE_ADD=true hardcoded. Just tests the polish pass
  in isolation so we can tune the AI-tell list without fact-check noise.

### Phase 2 — Live-verify loop
- Flip STRIP_VALUE_ADD=false. Editor proposes sweet-spots.
- Wire the retry loop (up to 3 attempts).
- Editor sees prior rejected sweet-spots in its prompt.
- If all 3 fail → strip the sweet-spot, keep the polish.

### Phase 3 — Tune + observability
- Admin fact-check page: show a purple "editorial" chip next to editorial
  claims so you can eyeball what the editor is adding.
- Brief email: surface editor_gave_up count. High rate = prompt needs work
  OR the verification is too strict OR the web is truly bare on this
  program.
- Per-alert: admin can manually strip the sweet-spot via Edit form if
  they don't like it even when it passed verification.

### Phase 4 — Regenerate parity
- Add same Editor pass to `regenerateAlertDraftAction` so re-staging a
  pre-editor alert goes through the full pipeline.

## Cost & latency

Per alert, roughly:
- Before: 1 Sonnet call (Writer) + 1 (verify) + 0-1 (webVerify) + 0-2 (revise)
  = ~$0.02-0.05, ~10-30s
- After: +1-4 Sonnet calls for editor loop + re-verification on each attempt
  = ~$0.05-0.12, ~30-90s

For daily brief runs (maybe 10 approves): ~$0.50-1.20 incremental per day.
Acceptable. Worth it for reader-facing quality.

## Risks

1. **Editor reintroduces source fabrications.** Mitigation: strict rule in
   prompt + `kind: 'source'` claims still get re-verified post-edit; if the
   editor changed a source claim, it'll flag on the next pass.

2. **Verification API bare on a program** (new or obscure). Editor will
   always burn 3 attempts then give up. Mitigation: accept this; editor's
   `editorial_sweetspot: null` skip path catches it. Monitor
   editor_gave_up by program to spot patterns.

3. **Editor keeps proposing the same sweet-spot across attempts.**
   Rejected list prevents repetition *within* a run, but nothing stops
   "Aer Lingus transatlantic" being the first pick on every Avios alert.
   That's fine — if verified, it's accurate. If the reader pattern-matches
   across alerts, we can add a "recently-used sweetspots" list later.

4. **Editorial strip breaks paragraph flow.** If the sweet-spot is the
   middle paragraph, stripping leaves a weird two-paragraph draft.
   Mitigation: editor always puts sweet-spot as the LAST paragraph; strip
   just pops the tail cleanly.

## Decisions

- **Scope of rewriting**: Editor rewrites description + summary. Leaves
  title alone (SEO-sensitive).
- **Per-alert toggle**: not shipped. Low-risk pass; fact-check catches
  bad editorial additions. Revisit if manual overrides become common.
- **Brand-voice samples**: curated, hand-picked set hardcoded in
  `utils/ai/editorSamples.ts`. Updating = code change (intentional —
  keeps voice calibration stable, not drifting with every brief run).
  User selects 3-5 best-voice published alerts; I populate the file.
