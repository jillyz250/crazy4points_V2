# Devaluation — alert template

For "a program's awards got more expensive / a benefit got cut" alerts
(devaluation, earn_rate_change, category_change, fee_change on the negative side).
Owner: John; facts verified by Priya. **Legal tier: skip Charlie** (everyday points
news) unless it involves a card benefit being cut (then card rules apply).

## When to use it
A loyalty program makes a redemption or earning WORSE: award chart goes up, transfer
ratio drops, a category/tier gets pricier, a valuable benefit is removed. Bad news,
but our job is to lead with **what the reader can still DO.**

## The sections
1. **Lead** — one line: what's getting worse, the **effective date**, and (crucial) the
   window to act. Lead with the opportunity, not the doom.
2. **What's changing** — the specific change stated as **old → new** (e.g., "a saver
   flight goes from 50,000 to 65,000 points"), and the **effective date**. Exact, verified.
3. **Who it hits** — which members / routes / redemptions actually feel it (don't imply
   it's universal if it isn't).
4. **⭐ Beat the clock** — what you can still DO **before** the effective date: book now at
   the old rate, lock in a redemption, transfer only for a specific award you're ready to
   book. This is the point of the alert. (Respect the no-speculative-transfer rule.)
5. **The workaround / silver lining** — a verified alternative that still works: another
   program, a routing, or a sweet spot that dodges the change (if one genuinely exists;
   don't invent one).
6. **Bottom line** — the honest take + the deadline to act.

## Hard standards (non-negotiable)
- **Lead with the opportunity** (`feedback_facebook_happy_news` refined: even on negative
  news, focus on what readers can still do). Never pure doom.
- **`end_date` = the effective date of the devaluation** — after it lands, the "book before"
  advice is moot, so the alert auto-expires (closed-loop guard). This is the natural
  expiry for this type.
- **Old → new figures verified** (official + independent); no derived valuations, no
  foreign-currency, no dashes.
- **§5 alternatives must be real + verified** — never a fabricated "silver lining."
- If a program devalues, its **sweet spots get auto-flagged for recheck** (the
  sweet-spot-recheck guard) — so a §5 workaround we cite stays honest.

## Disclosure
None required (no affiliate/card). If a card benefit is being cut, escalate to card
rules + Charlie.

## Visual
- **Check first:** `node scripts/creative-for.mjs` and reuse before generating.
- **Social:** a Countdown / beat-the-clock graphic anchored to the effective date. Program colors, brand NAME as text, no logo. Frame the opportunity (book before), not doom.

## Related
`card-bonus-increase.md`, `transfer-bonus.md`, `feedback_facebook_happy_news`,
`feedback_never_transfer_without_redemption`, `feedback_never_an_open_loop` (end_date
= effective date), the sweet-spot-recheck guard.
