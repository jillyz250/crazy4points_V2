# Card Bonus Increase — alert template (the reusable rail)

The standard structure for any "a card's welcome bonus went up / is elevated" alert.
Jill approved 2026-09-04. John's team fills it in; it makes every bonus alert
consistent, honest, and pre-compliant. Owner: **John** (SEO/content); verified by
**Priya** (facts) and **Charlie** (legal) before publish.

## When to use it
An **increase/elevated** alert is only warranted when **this offer > the card's
VERIFIED standard (baseline) offer** (`credit_card_welcome_bonuses.baseline_bonus_amount`).
If the current offer only *returned to* the standard after a higher promo ended,
that is NOT an increase — either fix the card page only, or write the honest "the
elevated offer has ended" note. (This is the Hyatt lesson: 60k was the standard, not
an increase; 75k was the elevation that ended.)

## The 7 sections
1. **Lead** — one punchy line: the card + the new number + the hook (why now).
2. **The offer** — exact terms: bonus, spend requirement, timeframe, tiered structure.
3. **The sweet spot** — ⭐ a **specific, VERIFIED redemption** the bonus unlocks (a real
   category/property/route with real program numbers, pulled from `sweet_spots`).
   NEVER generic filler like "points stretch far." Shown, not told. Qualitative — no
   cents-per-point or dollar math (house rule).
4. **Best-ever, or worth the wait?** — anchor on three numbers: the **verified standard
   (baseline)**, **this offer**, and the **recent peak**. Give an honest jump-now-or-hold
   read. Never predict a specific future offer as likely ("it'll come back") — that is
   unsubstantiated (FTC). Hedge: "past promotions are no promise it returns."
5. **The catch** — the real fine print: unguaranteed/tiered spend, annual fee,
   eligibility (e.g. 5/24), targeted vs public.
6. **Bottom line** — the call + who it's for.
7. **Disclosure** — the standard editorial line (see below). Baked in every time.

## Hard standards (non-negotiable)
- **Baseline standard (§4):** only call it an increase if `this > verified baseline`.
  Requires the baseline dataset (Priya's backfill sets `baseline_bonus_amount` per card).
- **Real sweet spot (§3):** a concrete verified redemption, never generic.
- **House rules:** no em/en dashes; no foreign-currency valuations; no derived point math;
  every figure Priya-verified (multi-source) before the draft reaches Jill.

## §7 Disclosure (Charlie, 2026-09-04)
When the alert links to the **issuer's own page** (no affiliate/referral comp), the
site-wide Affiliate Disclosure page suffices — do NOT add an affiliate line (we earn
nothing on that link; claiming otherwise is inaccurate). Append ONE editorial line
(also covers terms/eligibility/approval):

> *Editorial content, not financial advice. Offer terms, eligibility, and fees are set
> by the issuer, can change without notice, and approval is not guaranteed. Confirm
> current details on the issuer's official page before applying.*

If the link is ever swapped to an **affiliate/referral** link, an inline
material-connection disclosure becomes REQUIRED (16 CFR Part 255) and the link must
render `rel="nofollow sponsored"` (see `lib/referrals.ts`):

> *Affiliate link. We may earn a commission if you're approved, at no cost to you.*

## The publish loop (risk-tiered legal gate)
**John drafts on this template (disclosure baked in) → auto-routes to Charlie for the
required tiers → Charlie returns GREEN or a specific wording fix → Jill approves the
final → publish.** See `plans/two-eyes-policy.md` for which tiers require the legal gate.

## Related
`plans/two-eyes-policy.md` (the legal gate), `reference_sweet_spots_system`,
`reference_program_faq_house_style`, memory `feedback_never_an_open_loop` (published
alerts must expire or recheck), the card-bonus baseline backfill (Priya).
