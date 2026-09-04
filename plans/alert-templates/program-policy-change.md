# Program / Policy Change — alert template

For rule/benefit/policy changes that aren't award-price devaluations (those use
`devaluation.md`): elite requirements, cancellation/change policy, a benefit added or
removed, T&C rewrites, status-earning changes. Covers program_change, policy_change,
status_change. Owner: John; facts verified by Priya. **Legal tier: skip Charlie.**

## The sections
1. **Lead** — what changed + the effective date + the one-line impact.
2. **What changed** — the specific rule/benefit stated **old → new**, effective date.
3. **Who it affects** — which members / tiers / travelers actually feel it.
4. **What to do** — the action. This can be **good OR bad news** (a benefit added, a rule
   relaxed, or a perk cut) — frame to the ACTUAL news, never force doom or hype.
5. **The catch / nuance** — exceptions, grandfathering, fine print.
6. **Bottom line** — the honest take + any deadline to act.

## Hard standards (non-negotiable)
- **Page-affecting:** a standing rule/benefit change updates the **program page** too
  (the alert and the page must agree; bump `content_updated_at`).
- **Good-or-bad honesty:** match the framing to reality (`feedback_facebook_happy_news`
  refined: lead with the opportunity when there is one, but don't spin a genuine cut).
- **`end_date`:** if it's a "do X before DATE" change, set it (auto-expire). A permanent
  rule change has no deadline → it rides the recheck guard so it can't silently go stale.
- Verify old → new against the program's own page; no valuations, no dashes.

## Legal tier — skip Charlie (everyday points news), unless it changes a card benefit
(then card rules apply).

## Visual
- **Check first:** `node scripts/creative-for.mjs` and reuse before generating.
- **Social:** a clean Split "old → new" or a Big-Word graphic for the headline change.
  Program colors, brand NAME as text, no logo. Frame to the real news.

## Related
`devaluation.md` (award-price cuts), the change-signal Apply-to-page flow,
`feedback_facebook_happy_news`, `feedback_never_an_open_loop`.
