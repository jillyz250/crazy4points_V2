# Sweepstakes / Giveaway — alert template

For loyalty-program points/miles sweepstakes. Owner: John/Kesha; facts verified by
Priya. **Legal tier: REQUIRES Charlie** before publish (promo law + official rules).

## When to use it — STRICT scope
**Loyalty-program points/miles sweeps ONLY** — run by an airline/hotel/card program,
OR whose prize IS that program's points/miles. Third-party "win a free trip" giveaways
are OUT (see `reference_sweepstakes_sourcing_strict`).

## The sections
1. **Lead** — the prize + the entry deadline + the hook.
2. **The prize** — what you can win (the points/miles amount or package), and the scale
   (number of winners) if known.
3. **How to enter** — a clear **"Enter here" link straight to the official entry page**
   (the direct call to action), plus the **free / no-purchase method of entry** (legally
   required to state) and the **entry deadline**.
4. **Eligibility & rules** — who can enter (US, age), a link to the **official rules**,
   and "no purchase necessary."
5. **Worth it?** — honest framing: giveaways are lottery odds. Enter if it's free and
   quick; don't overinvest or imply anyone is likely to win.
6. **Bottom line** — enter by when, in one tap.

## Hard standards (non-negotiable)
- **STRICT scope** — loyalty points/miles sweeps only; reject third-party trip giveaways.
- **"Enter here" link to the official entry page** in §3 — the reader should reach entry
  in one click.
- **Link the official rules + state "no purchase necessary"** (and the free entry method) —
  this is promo-law compliance, and it's why Charlie must clear it.
- **`end_date` = the entry deadline** (auto-expires; closed-loop).
- No hype ("you could win big"), no odds we can't cite, no dashes, no valuations.

## Legal tier — REQUIRED (Charlie)
Sweepstakes carry promo-law obligations (official rules, no-purchase-necessary, eligibility,
free method of entry). Charlie clears every one before publish (`plans/two-eyes-policy.md` Rule 4).

## Visual
- **Check first:** `node scripts/creative-for.mjs` and reuse before generating.
- **Social:** a bold giveaway graphic (the best-performing format for signups) with the prize
  as the hero and a Countdown to the deadline. Program colors, brand NAME as text, no logo.

## Related
`reference_sweepstakes_sourcing_strict`, `plans/two-eyes-policy.md`, `feedback_never_an_open_loop`,
the `/admin/sweepstakes` review flow.
