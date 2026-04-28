# The World of Hyatt Business Credit Card — Source List

Reference list of every URL/document used to author the public page at `/cards/chase-world-of-hyatt-business`. Per-card audit trail.

---

## Last reviewed
**April 29, 2026** by JZ (with Claude Code assist)

## Card identity
- Issuer: JPMorgan Chase Bank, N.A.
- Network: Visa Signature Business
- Co-brand partner: World of Hyatt
- Currency earned: Hyatt points directly
- Migration: [supabase/migrations/051_card_chase_world_of_hyatt_business.sql](../../../supabase/migrations/051_card_chase_world_of_hyatt_business.sql)

## Authoritative sources (used for migration 051)

### Chase official offer page
- **URL:** https://creditcards.chase.com/business-credit-cards/world-of-hyatt-business-card
- **Used for:** annual fee, welcome bonus, earn rates, anniversary benefits, status, EQN, $50 Hyatt credit, 10% rebate, Hyatt Leverage, DashPass, FX fee, APR ranges, employee cards, Trip Cancellation/Interruption coverage

### Chase Visa Signature Business Guide to Benefits (PDF)
- **File:** BGC11374_v2.pdf (28 pages, 866 KB)
- **Effective:** 10/01/24
- **Title:** "Guide to Benefits — Visa Signature® Business and Visa Business"
- **Used for:** auto rental coverage (primary for business), baggage delay, lost luggage, purchase protection ($10K/item, $50K/year), extended warranty, travel accident, roadside assistance, travel and emergency assistance
- **Claim portal:** https://chasecardbenefits.com (1-800-349-2634)

### The Points Guy review
- **URL:** https://thepointsguy.com/credit-cards/reviews/world-of-hyatt-business-credit-card-review/
- **Used for:** confirming earn-rate structure, status path comparison vs personal card

## Aggregator/blog references (cross-checked, not authoritative)

- TPG was the only blog URL that fetched cleanly during research
- AwardWallet, OMAAT, Upgraded Points, NerdWallet — all 404'd or gated; not used

## Hyatt program references
- [Hyatt source archive](../hyatt.md)
- [World of Hyatt Discoverist tier benefits](https://world.hyatt.com/content/gp/en/tiers-and-benefits.html)

## Comparison to personal card (chase-world-of-hyatt)

Key differences readers most often confuse:

| | Personal | Business |
|---|---|---|
| Annual fee | $95 | $199 |
| Anniversary Cat 1-4 free night | YES | **NO** |
| $15K-spend bonus free night | YES | **NO** |
| Hyatt statement credits | none | $50 × 2 per anniversary year |
| 10% redemption rebate | none | YES (after $50K spend) |
| TQN per year (flat) | 5 nights | 0 (no flat — only spend-based) |
| TQN per spend | 2 per $5K | 5 per $10K (uncapped) |
| Auto rental CDW (US) | secondary | **primary** for business rentals |
| Purchase protection per-item cap | $500 | $10,000 |
| Trip Cancellation insurance | not on card | **YES** ($1,500/$6,000) |
| Hyatt Leverage corporate program access | none | YES |
| Discoverist gifting for employees | n/a | up to 5 employees |
| DashPass | none | 1-year complimentary + $10/qtr non-restaurant |
| Top-3 quarterly category 2x | no | yes (8 eligible categories) |
| Earn at Hyatt | 4x | 4x |

## Fact-check audit (Step 3 of skill, 2026-04-29)

Both Copilot and ChatGPT reviewed; verdict 98% accurate.

### Copilot pass
All core numbers, earn rates, benefits, protections matched Chase's published terms and BGC11374_v2.

### ChatGPT pass
Pushed harder than Copilot on:
- **Trip Cancellation:** suggested "treat as unconfirmed" since not in PDF — superseded by user direction (see resolution below)
- **No-free-night landmine:** explicit callout in intro requested — accepted, intro now bolds the absence
- **10% rebate cap:** rephrase to surface the 200K-back-per-year = ~2M points-redeemed-per-year ceiling — accepted

### Resolution: Trip Cancellation/Interruption
PDF (BGC11374_v2 effective 10/01/24) contains zero language on trip cancellation. Chase's customer-facing offer page advertises $1,500 per traveler / $6,000 per trip. User direction 2026-04-29: "if it's on the chase website then it's good." Memory rule [feedback_chase_marketing_page_authoritative.md](../../../../.claude/projects/-Users-jillzeller-Desktop-Github-crazy4points-V2/memory/feedback_chase_marketing_page_authoritative.md) saved. Trip Cancellation included in migration without hedging language.

### Net migration changes from fact-check
1. Intro bolded the "no anniversary free night, no $15K-spend bonus" callout
2. 10% rebate description added the effective 2M-points-redeemed ceiling explanation
3. Trip Cancellation row stripped of UNCONFIRMED warning per user direction

## Verification cadence
- Welcome bonus: re-check at next public-offer change (TPG noted offer ended Apr 30, 2026 — monitor)
- Earn rates: stable; check annually
- Top-3 quarterly category list: stable; verify if Chase changes the eligible 8
- Insurance/protections: BGC11374 effective 10/01/24; check for new Guide each fall
- Trip Cancellation: monitor for inclusion in next BGC version (currently only on marketing page)
- Annual fee: stable since launch ($199)

## Followups (backlog)

- [ ] **Referral bonus** — same gap as personal card; existing cardholders earn referral bonuses for approved apps. Capture once 3+ cards have data.
- [ ] **Confirm Trip Cancellation in next BGC release** — should appear in next quarterly Guide to Benefits update; if not, raise with Chase via cardmember services.
