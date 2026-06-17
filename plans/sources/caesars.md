# Caesars Rewards -- Source List

Reference list of every URL used to author the public page at `/programs/caesars`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored)

## Official program sources (primary)

- **Benefits overview + full tier table:** https://www.caesars.com/myrewards/benefits-overview (scraped 2026-06-17 -- authoritative for all 6 tier thresholds, hotel discounts, lounge access, cruise discounts, bonus bet amounts)
- **Earn and redeem page:** https://www.caesars.com/myrewards/earn-and-redeem (scraped 2026-06-17 -- TC + RC earn rates by activity, daily TC bonus structure, full tier threshold table, redemption options)
- **Seven Stars page:** https://www.caesars.com/myrewards/sevenstars (scraped 2026-06-17 -- Retreat, Celebration Dinner, Norwegian Cruise, Atlantis, Companion Card, Elite tiers)
- **TC earn FAQ:** https://caesarsrewards.custhelp.com/app/answers/detail/a_id/233 (scraped 2026-06-17 -- TC earn rates by game type, hotel, dining; confirms 1 TC/$1 hotel)
- **Seven Stars rules 2026:** https://www.caesars.com/myrewards/sevenstars/rules
- **Wyndham partnership:** https://www.caesars.com/myrewards/partners/wyndham_resorts
- **Visa credit cards page:** https://www.caesars.com/myrewards/partners/cr-visa

## Secondary sources (WebSearch, 2026)

- bettingusa.com/vip-loyalty/caesars-rewards/ -- tier overview overview
- rg.org/guides/caesars/caesars-reward-tiers -- Platinum/Diamond/Diamond Plus benefits
- caesarsrewards.custhelp.com/app/answers/detail/a_id/1035 -- TC expiration and renewal FAQ
- playingpoints.com/2025/10/03/the-caesars-rewards-devaluation-we-need-to-talk-about/ -- 2025 program changes context
- hurdygurdytravel.com/2025/12/05/earning-caesars-rewards-status-in-2026/ -- 2026 status earning overview

## Key facts sourced + confidence level

| Claim | Source | Confidence |
|---|---|---|
| Gold: 0-4,999 TCs; Platinum: 5,000-14,999 TCs | caesars.com/myrewards/earn-and-redeem TC table | HIGH (official) |
| Diamond: 15,000-24,999 TCs; Diamond Plus: 25,000-74,999 TCs | caesars.com/myrewards/earn-and-redeem TC table | HIGH (official) |
| Diamond Elite: 75,000-149,999 TCs; Seven Stars: 150,000+ TCs | caesars.com/myrewards/earn-and-redeem TC table | HIGH (official) |
| Slot earn: 1 TC/$5; video poker: 1 TC/$10 | earn-and-redeem page + custhelp FAQ | HIGH (official) |
| Hotel earn: 1 TC/$1 on room rates and resort fees | earn-and-redeem page + custhelp FAQ | HIGH (official) |
| Dining: 1 TC/$1; shopping: 1 TC/$1 | earn-and-redeem page | HIGH (official) |
| Sports: up to 10 TCs/$100 straight, 30 TCs/$100 parlay | earn-and-redeem page | HIGH (official) |
| No resort fees: Diamond and above | benefits-overview (4 checkmarks = Diamond through Seven Stars) | HIGH (official) |
| Room upgrade at check-in: Seven Stars only | benefits-overview (1 checkmark) + Seven Stars page | HIGH (official) |
| Early check-in / late checkout: Diamond and above | benefits-overview + Seven Stars page | HIGH (official) |
| Celebration Dinner: Diamond $100, Seven Stars $500 | benefits-overview (explicit dollar amounts) | HIGH (official) |
| Seven Stars Retreat: $1,200 airfare + 4 nights + $500 folio | caesars.com/myrewards/sevenstars | HIGH (official) |
| Seven Stars Voyage: up to 7-day Norwegian Cruise | caesars.com/myrewards/sevenstars | HIGH (official) |
| Atlantis complimentary stay: Seven Stars | caesars.com/myrewards/sevenstars | HIGH (official) |
| Monthly bonus bet amounts by tier (Pt $10, Di $20, DiP $30, DiE $75, SS $150) | benefits-overview table | HIGH (official) |
| Norwegian Cruise discounts: Pt 10%, Di 20%, DiP 20%, DiE 25%, SS 30% | benefits-overview table | HIGH (official) |
| $600 airfare credit to Las Vegas: Diamond Elite and Seven Stars | benefits-overview (2 checkmarks in last 2 columns) | HIGH (official) |
| Wyndham Rewards bidirectional transfer | earn-and-redeem page | HIGH (official) |
| Wyndham transfer ratio | NOT captured -- verify at caesars.com/myrewards/partners/wyndham_resorts | UNCONFIRMED |
| No Amex MR / Chase UR / Bilt / Citi / Capital One transfer in | Absence from all issuer transfer partner pages + WebSearch | HIGH (by absence) |
| Seven Stars invitation-only above 150K TCs | caesars.com/myrewards/sevenstars/faq (referenced) | HIGH |
| Seven Stars Elite: 500K TC and 1M TC sub-tiers | caesars.com/myrewards/sevenstars | HIGH (official) |
| "Diamond in a Day" daily bonus structure | earn-and-redeem page (5,000 TCs/day + 10,000 bonus = 15,000) | HIGH (official) |
| Visa cards: 5x Caesars, 2x dining/travel/entertainment, 1x elsewhere | WebSearch + caesars.com/myrewards/partners/cr-visa (referenced) | MEDIUM (not scraped from card page) |
| Laurel Lounge: Diamond and above | benefits-overview (complimentary row has bullets at Diamond+) | HIGH (official) |

## Notes / followups

- **Wyndham transfer ratio** not confirmed from official scrape. The earn-and-redeem page confirms the partnership exists but doesn't state the ratio. Verify at caesars.com/myrewards/partners/wyndham_resorts on next refresh.
- **Laurel Lounge paid vs complimentary column mapping** not 100% clear from scrape (icons rendered as separate row). Diamond and above confirmed complimentary from the Diamond tier context; whether Platinum gets paid access was excluded from tier_benefits to avoid contradicting lounge_access field.
- **hotel_properties not seeded.** Caesars Entertainment has 50+ properties. Decision Engine will not surface individual properties until scrape-properties.mjs is run for caesars.
- **Card earn rates** sourced from WebSearch results and the caesars.com/myrewards/partners/cr-visa page (referenced but the page itself is JavaScript-heavy and earn rates come from the product pages). MEDIUM confidence -- verify on next card review.

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Tier thresholds | Initial scrape URLs returned homepage (all 636 lines identical) | Fixed scrape_urls to /myrewards/ prefix; second scrape returned real data |
| 2026-06-17 | Laurel Lounge tier eligibility | Benefits scrape has two rows (paid access + complimentary) with unclear column mapping | Excluded Platinum from Laurel Lounge bullet; kept Diamond and above only |
| 2026-06-17 | LLM audit: no-transfer claim hedging | LLM cycled through contradictory fix recommendations (add "currently", then "as of June 2026", then remove date, then add parenthetical) | Accepted 2 remaining MEDIUM findings after 12 rounds; content is accurate with "currently" + verify link |
