# Allegiant Allways Rewards - Source List

Reference list of every URL used to author `/programs/allegiant` (May 2026).

---

## Last reviewed
**May 2026** by Claude (research-program.mjs orchestrated, Copilot + ChatGPT cross-fact-checked)

## Official program sources

- **Program FAQ:** https://www.allegiantair.com/rewards-faqs
- **Program terms:** https://www.allegiantair.com/rewards-terms
- **Program homepage:** https://www.allegiantair.com/deals/allways-rewards/
- **Cardholder expiry FAQ:** https://www.allegiantair.com/faq/5c-allways-rewards-visa-cardholder-do-points-i-earn-ever-expire
- **Press room / news:** https://newsroom.allegiantair.com/
- **Investor relations:** https://ir.allegiantair.com/

## Co-brand card sources

- **Allways Rewards Visa (Bank of America):** https://www.bankofamerica.com/credit-cards/products/allways-rewards-visa-credit-card/
- **Card page on Allegiant:** https://www.allegiantair.com/allways-rewards-visa-card
- **Card benefits guide:** https://www.allegiantair.com/allegiant-credit-card-benefits
- **Card program summary:** https://www.allegiantair.com/allegiant-credit-card-program-summary
- **Upgraded Points card review (Apr 2026):** https://upgradedpoints.com/credit-cards/reviews/allways-rewards-visa-card/
- **U.S. News card review (2026):** https://money.usnews.com/credit-cards/bank-of-america/bank-of-america-allways-rewards-visa-credit-card

## Social channels (for ongoing signal monitoring)

- **Facebook:** https://www.facebook.com/Allegiant
- **X / Twitter:** @Allegiant - https://twitter.com/Allegiant
- **Instagram:** @allegiant - https://www.instagram.com/allegiant/
- **YouTube:** https://www.youtube.com/user/AllegiantAir
- **LinkedIn:** https://www.linkedin.com/company/allegiant-air

## Research articles cited (by section)

### Program structure / earn / redeem
- [Allegiant Allways Rewards Loyalty Program Review - Upgraded Points (Feb 2026)](https://upgradedpoints.com/travel/airlines/allegiant-air-allways-rewards-loyalty-program/)
- [Guide to Allegiant Air Loyalty Program Allways - NerdWallet](https://www.nerdwallet.com/travel/learn/allegiant-air-loyalty-program-allways)
- [Allegiant Allways Rewards Guide - Forbes Advisor (Sep 2025)](https://www.forbes.com/advisor/credit-cards/travel/allegiant-allways-rewards/)
- [Allegiant Air Allways Rewards Program Guide - 10xTravel](https://10xtravel.com/allegiant-air-allways-rewards-program-guide/)
- [How Does Allegiant Air's Allways Rewards Program Work? - SimpleFlying](https://simpleflying.com/allegiant-air-allways-rewards-explained/)
- [What to Know About Allways Rewards - AwardWallet](https://awardwallet.com/airlines/allegiant-allways-rewards/)

### Co-brand card
- [Allways Rewards Visa Review 2026 - U.S. News](https://money.usnews.com/credit-cards/bank-of-america/bank-of-america-allways-rewards-visa-credit-card)
- [Allways Rewards Visa Full Review - Upgraded Points (Apr 2026)](https://upgradedpoints.com/credit-cards/reviews/allways-rewards-visa-card/)
- [Allegiant Credit Card Reviews - WalletHub (2026)](https://wallethub.com/d/allegiant-credit-card-2314c)
- [Allegiant Air Bank of America Credit Card - Travelpander (Feb 2026)](https://travelpander.com/allegiant-air-bank-of-america/)

### Recent program / fleet / route news
- [Allegiant Q1 2026 Financial Results (Apr 30, 2026)](https://ir.allegiantair.com/news-releases/news-release-details/allegiant-travel-company-first-quarter-2026-financial-results)
- [Allegiant Adds 30 New Nonstop Routes (Nov 18, 2025)](https://ir.allegiantair.com/news/news-details/2025/Allegiant-Adds-30-New-Nonstop-Routes-Entering-Four-New-Markets/default.aspx)
- [Allegiant Special Offer for Spirit Passengers (May 2, 2026)](https://newsroom.allegiantair.com/press-releases/press-release-details/2026/Allegiant-Launches-Special-Offer-to-Passengers-Affected-by-Closure-of-Spirit-Airlines/default.aspx)
- [Allegiant Sun Country Acquisition Board Composition (2026)](https://newsroom.allegiantair.com/press-releases/press-release-details/2026/Allegiant-Announces-Future-Board-Composition-Following-Sun-Country-Acquisition/default.aspx)
- [Allegiant Trims Capacity Amid Fuel Prices - FlightGlobal (May 2026)](https://www.flightglobal.com/american-airlines-group/2026/05/not-immune-allegiant-trims-capacity-amid-elevated-fuel-prices/)

## Fact-check disagreements / resolutions

| Claim | Copilot | ChatGPT | Resolution |
|---|---|---|---|
| Points post 72 hours after itinerary completion | UNVERIFIED | CORRECT (FAQ) | Confirmed in scraped T&C (`tc.md:50`) and FAQ (`earn.md:97`). Kept. |
| 6-month discrepancy reporting window | UNVERIFIED | UNVERIFIED | Confirmed in scraped T&C (`tc.md:29`). Kept. |
| Largest leisure-focused US carrier (post-Sun Country) | NEEDS CLARIFICATION (superlative) | UNVERIFIED | Removed superlative. Now reads as "significantly expand the leisure-focused footprint of both carriers." |
| Fleet breakdown 17 MAX + 106 Airbus | NEEDS CLARIFICATION (specific breakdown not in public release) | UNVERIFIED | Removed specific numbers. Now reads as "around 123 jets - a mix of A320-family aircraft transitioning toward Boeing 737 MAX." |
| Targeted 25K bonus offer variant | NEEDS CLARIFICATION (no public source) | UNVERIFIED | Removed. Page now lists only the public 30K offer. |

## Notes / followups

- **Sun Country acquisition (~May 13, 2026)** - if/when the deal closes, revisit:
  1. Whether Allways Rewards and Sun Country Rewards merge
  2. Whether the fleet/route footprint claims need updating
  3. Whether tier_benefits gain anything (Sun Country has no elites either, so probably still empty)
- **Allegiant has no transfer partners** - if Bilt or Cap One ever add Allways as a partner (unlikely given the cash-equivalent structure), update transfer_partners array.
- **Award chart structure** - if Allegiant ever introduces a chart or zone-based pricing (unlikely), the award_chart field needs full rewrite.
