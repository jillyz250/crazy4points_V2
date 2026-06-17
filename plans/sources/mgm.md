# MGM Rewards -- Source List

Reference list of every URL used to author the public page at `/programs/mgm`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored)

## Official program sources

- **MGM Rewards main page:** https://www.mgmresorts.com/en/loyalty.html (Firecrawl-blocked as of 2026-06-17 -- site blocks bots)
- **MGM Rewards tier page:** https://www.mgmresorts.com/en/loyalty/rewards-tiers.html (Firecrawl-blocked)
- **FNBO card compare page:** https://card.fnbo.com/landing/mgmrewards/mgm-card-compare (fetched 2026-06-17 -- authoritative for earn rates, card benefits)
- **Marriott MGM Collection FAQs:** https://www.marriott.com/marriott-brands/mgm-collection/faqs.mi (403 at authoring -- verify Marriott tier match on next refresh)

## Secondary sources (third-party guides, 2025-2026)

- **TPG benefit changes:** https://thepointsguy.com/news/mgm-rewards-tier-benefits-changes/ -- 2025 cruise/celebration credit updates
- **Upgraded Points guide:** https://upgradedpoints.com/travel/hotels/m-life-rewards-program-mgm/ -- tier thresholds, Marriott match, earn rates
- **AwardWallet status match:** https://awardwallet.com/hotels/mgm-status-match/ -- Marriott Bonvoy tier match table (confirmed against TPG)

## Key facts sourced + confidence level

| Claim | Source | Confidence |
|---|---|---|
| Sapphire: 0-19,999 TCs; Pearl: 20,000-74,999 TCs | Upgraded Points (multiple sources agree) | MEDIUM (blog, official blocked) |
| Gold: 75,000-199,999 TCs; Platinum: 200,000+ TCs; NOIR: invite-only | Upgraded Points + multiple sources | MEDIUM (blog, official blocked) |
| Base earn: 4 TCs + 1 point per $1 on hotel/dining | Upgraded Points | MEDIUM (blog, not official) |
| Casino gaming TC earn rates | NOT CAPTURED -- official site blocked | UNCONFIRMED |
| Pearl celebration credit: $100 | TPG 2025 changes article | MEDIUM (blog) |
| Gold celebration credit: $100 | TPG 2025 changes article | MEDIUM (blog) |
| Platinum celebration credit: $200 | TPG 2025 changes article | MEDIUM (blog) |
| NOIR celebration credit: $500 | TPG 2025 changes article | MEDIUM (blog) |
| Gold cruise: oceanview up to 5 nights or $750 | TPG 2025 changes article | MEDIUM (blog) |
| Platinum cruise: balcony up to 7 nights or $1,500 | TPG 2025 changes article | MEDIUM (blog) |
| NOIR cruise: junior suite up to 10 nights or $3,000 | TPG 2025 changes article | MEDIUM (blog) |
| Onboard FreePlay: Sapphire $25, Pearl $50, Gold $75, Platinum $100, NOIR $200 | TPG 2025 changes article | MEDIUM (blog) |
| Platinum air credit: $600; NOIR air credit: $1,200 | Upgraded Points + TPG | MEDIUM (blog) |
| Gold: waived resort fees at Las Vegas properties | Upgraded Points + multiple sources | MEDIUM (blog, consistent) |
| Pearl -> Marriott Silver Elite; Gold/Plat -> Gold Elite; NOIR -> Ambassador Elite | AwardWallet + TPG (both agree) | MEDIUM (blog, consistent) |
| Points value: 1 cent per point | Upgraded Points + multiple sources | MEDIUM (blog, consistent) |
| Points expiry: Sapphire 6 months; Pearl+ non-expiring | Upgraded Points + multiple sources | MEDIUM (blog, consistent) |
| TC rollover: 50K -> 7,500 forward; 125K -> add'l 17,500 | WebSearch summary (multiple blogs) | MEDIUM (blog) |
| No inbound bank transfers (Amex/Chase/Bilt/Citi/Cap One) | Absence from all issuer partner pages | HIGH (by absence) |
| Iconic card: 6x TC+pts at MGM, 2x hotels/dining, 2x gas/grocery, 1x elsewhere | card.fnbo.com (official -- fetched) | HIGH (official) |
| Basic card: 3x at MGM, 1x hotels/dining, 2x gas/grocery, 1x elsewhere | card.fnbo.com (official -- fetched) | HIGH (official) |
| Both cards: auto Pearl status, no FX fees | card.fnbo.com (official -- fetched) | HIGH (official) |
| Iconic card: $200 resort credit, Global Entry, Priority Pass Digital, trip insurance | card.fnbo.com (official -- fetched) | HIGH (official) |

## Notes / followups

- **Casino gaming TC earn rates** not captured -- official pages Firecrawl-blocked and Claude Code cannot WebFetch mgmresorts.com. Omitted from page; add on next refresh.
- **Marriott FAQs** returned 403 at authoring. Tier match confirmed via TPG + AwardWallet (both agree: Pearl->Silver, Gold->Gold Elite, Platinum->Gold Elite, NOIR->Ambassador). Verify official table on next refresh.
- **hotel_properties not seeded.** MGM has 30+ properties. Decision Engine will not surface individual properties until scrape-properties.mjs is run for mgm.
- **LLM audit cycling** on flat-rate "no transfers" hedging (rounds 4-7 oscillated add/remove hedge). 3 remaining MEDIUM/HIGH findings accepted after 7 rounds; content is factually correct.

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Marriott tier match | Upgraded Points said Gold->Silver Elite; AwardWallet + TPG say Pearl->Silver, Gold->Gold Elite | Trusted AwardWallet + TPG (2 agreeing sources vs 1 Upgraded Points) |
| 2026-06-17 | Official URLs 404'd | /en/loyalty/mgm-rewards.html paths all return 404 | Updated scrape_urls to /en/loyalty.html; official pages Firecrawl-blocked anyway |
