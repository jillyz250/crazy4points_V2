# Alert Template Library

The reusable section-templates for our recurring alert types. Each turns a
recurring alert into a fill-in-the-blanks job that's consistent, honest, and
pre-compliant. **Owner: John (Head of Content).** Within each template, **Charlie**
owns the legal/disclosure sections and **Priya** owns the accuracy standards
(verified figures, real sweet spots). Approved by Jill 2026-09-04.

## How templates work
- A template = an ordered set of **bold-labelled bullet sections** (they render as the
  alert's scannable bullets) + **hard standards** + a **legal tier** + a **disclosure**
  slot where needed.
- Global rules apply to every template: no em/en dashes; no foreign-currency valuations;
  no derived point math; every figure multi-source verified (Priya) before the draft
  reaches Jill; the ⭐ **sweet spot is always a SPECIFIC verified redemption**, never
  generic filler; and the ⭐ **SUPERLATIVE GUARD** — use observational phrasing ("the
  biggest we've seen/tracked"), **never an absolute "record / highest ever / never been
  this high" unless confirmed on the issuer's own page** (a blog calling it a record is
  not proof). An unprovable superlative is a false claim.
- **Legal tier** per template says whether it must pass Charlie before publish (see
  `plans/two-eyes-policy.md` Rule 4): card content, sweepstakes, and anything with an
  affiliate link / disclosure / advice-claim = REQUIRED; everyday points news = skip.
- Templates are **guidance docs** (versioned here), not code — John's team + the drafting
  agents follow them. If the library matures we can make them structured.

## The library (by our real published alert types)
| Template | Covers alert types | Legal gate | Status |
|---|---|---|---|
| [card-bonus-increase](card-bonus-increase.md) | signup_bonus, card_credit | ✅ required | ✅ done |
| [transfer-bonus](transfer-bonus.md) | transfer_bonus | ⛔ skip (unless card) | ✅ done |
| [devaluation](devaluation.md) | devaluation, earn_rate_change, category_change, fee_change | ⛔ skip | ✅ done |
| [award-sale / buy-points](award-sale-buy-points.md) | award_sale, point_purchase | ⛔ skip | ✅ done |
| [partner-change](partner-change.md) | partner_change, new_partner, ended_partner | ⛔ skip (page-affecting) | ✅ done |
| [program / policy change](program-policy-change.md) | program_change, policy_change, status_change | ⛔ skip | ✅ done |
| [status promo](status-promo.md) | status_promo | ⛔ skip | ✅ done |
| [sweepstakes / giveaway](sweepstakes.md) | (sweepstakes) | ✅ required | ✅ done |
| award availability | award_availability | ⛔ skip | ▫️ planned |
| experience / Moment | experience | ⛔ skip | ▫️ planned |
| [limited-time-offer](limited-time-offer.md) | limited_time_offer (catch-all) | depends | ✅ done |

Build order follows volume + value: transfer-bonus done next after cards; then the
big buckets (limited_time_offer 19, program_change 15, partner_change 12).

## Creative prompts
Copilot image prompts for each type live in `creative-prompts.md` (swap the placeholders per deal; check `creative-for.mjs` and reuse first).

## Related
`plans/two-eyes-policy.md` (legal gate), `reference_program_faq_house_style`,
`reference_sweet_spots_system`, memory `reference_card_bonus_template_and_legal_gate`,
`feedback_never_an_open_loop` (published alerts must expire or recheck).
