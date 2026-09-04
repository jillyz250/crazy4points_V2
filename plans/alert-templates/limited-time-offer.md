# Limited-Time Offer — alert template (the catch-all)

The flexible template for time-boxed deals that aren't a card SUB, transfer bonus,
or devaluation: bonus-points promos, flash offers, status boosts, stay/spend promos.
Owner: John; facts verified by Priya. It's a **checklist, not a rigid form** — use the
sections that fit the deal.

## The sections
1. **Lead** — the deal in one line + the deadline + the hook.
2. **The deal** — exactly what you get (amount / %, conditions), whether **registration
   is required**, and the **dates** (register-by, book-by, travel-by are often different).
3. **Is it worth it?** — an honest value read: meaningful or minor, and WHO benefits
   (a frequent guest vs a one-off traveler). Match enthusiasm to significance — no hype
   on a small promo (`feedback_no_just_dropped_opener`, brand-voice).
4. **How to get it** — the steps: register here, use this code, book by X, eligibility.
5. **The catch** — restrictions, blackouts, registration-required, targeted-vs-public,
   US eligibility.
6. **Bottom line** — who should act, by when.

## Hard standards
- **`end_date` = the deadline** (auto-expires; closed-loop). If register-by, book-by, and
  travel-by differ, the `end_date` is the last date to ACT (usually register/book-by).
- **Distinguish the dates** — register-by vs book-by vs travel-by; conflating them misleads.
- **Flag registration-required** prominently (a promo you must opt into before earning).
- **Targeted / personalized offers can't be verified as general → usually REJECT**, not
  publish (or note "targeted, check your account").
- No foreign-currency valuations, no derived point math, no dashes; figures Priya-verified.
- Superlative guard (library-wide): observational, never absolute unless issuer-confirmed.

## Legal tier — DEPENDS
- **Skips Charlie:** a plain program promo (bonus points per stay, a points sale, a status boost).
- **Requires Charlie:** if it's **card-linked**, carries an **affiliate/referral link**, or
  makes an **advice-like claim** → card rules + the legal gate (`plans/two-eyes-policy.md` Rule 4).

## Disclosure
None for a plain program promo. Card-linked / affiliate → the card disclosure + Charlie.

## Visual
- **Check first:** `node scripts/creative-for.mjs` and reuse before generating.
- **Social:** match the KIT template to the deal (Big Word for excitement, Deal Dashboard for a multi-part promo). Program/brand colors, brand NAME as text, no logo. Match enthusiasm to significance.

## Related
`card-bonus-increase.md`, `devaluation.md`, `transfer-bonus.md`, INDEX global rules,
`feedback_never_an_open_loop` (end_date = deadline).
