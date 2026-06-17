# Omni Select Guest -- Source List

Reference list of every URL used to author the public page at `/programs/omni`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored)

## Official program sources (primary -- all Firecrawl-scraped 2026-06-17)

- **Main loyalty page:** https://www.omnihotels.com/loyalty
- **Member tiers:** https://www.omnihotels.com/loyalty/member-tiers (authoritative -- tier thresholds, earn rates, per-tier benefits)
- **Member benefits matrix:** https://www.omnihotels.com/loyalty/member-benefits (full grid, revised January 2024; PDF: sg-benefits-grid.pdf)
- **FAQ:** https://www.omnihotels.com/loyalty/faq (Tier Dollar definition, redemption rules, 36-month expiry, 2024 relaunch + legacy conversion -- most data-dense)
- **Terms and conditions:** https://www.omnihotels.com/loyalty/terms-and-conditions
- **Blackout dates:** https://www.omnihotels.com/loyalty/blackout-dates

## Secondary sources (WebSearch, 2025-2026)

- thepointsguy.com/news/omni-loyalty-program/ -- 2024 revenue-based relaunch context
- awardwallet.com/hotels/omni-select-guest/ -- program overview
- nerdwallet.com/travel/learn/omni-select-guest -- maximizing guide
- frequentmiler.com/omni-hotels-resorts-added-as-mesa-transfer-partner/ -- Mesa partnership (now defunct)
- upgradedpoints.com/news/mesa-omni-points-transfer-partnership/ -- Mesa partnership (now defunct)

## Key facts sourced + confidence level

| Claim | Source | Confidence |
|---|---|---|
| Tiers: Member $0-999, Insider $1,000-3,999, Champion $4,000-7,999, Icon $8,000+ | omnihotels.com/loyalty/faq + member-tiers | HIGH (official) |
| Member/Insider earn 5 Omni Credits/night; Champion/Icon earn 10/night | omnihotels.com member-tiers + faq | HIGH (official) |
| Beyond-room: 1 credit/$100 (Member/Insider/Champion), 2/$100 (Icon) | omnihotels.com member-benefits grid + faq | HIGH (official) |
| Note: Champion earns 1/$100 NOT 2 -- corrected a WebSearch error | member-benefits grid (authoritative) | HIGH (official) |
| 100 Omni Credits = 1 Free Night at ANY property (flat, no chart) | omnihotels.com/loyalty/faq | HIGH (official) |
| Free Night covers room + taxes; waives Resort Service Charges + Destination Fees | omnihotels.com/loyalty/faq | HIGH (official) |
| Omni Credits expire 36 months from date of issue (fixed, not activity-reset) | omnihotels.com/loyalty/faq | HIGH (official) |
| Icon suite upgrade when redeeming Free Nights | member-tiers + main | HIGH (official) |
| Status valid for rest of earning year + following year | omnihotels.com/loyalty/faq | HIGH (official) |
| Tier Dollars = room-folio qualifying charges; excludes taxes/gratuities/fees | omnihotels.com/loyalty/faq | HIGH (official) |
| Max 2 rooms earn Free Night awards per stay; non-transferable | omnihotels.com/loyalty/faq | HIGH (official) |
| OTA/wholesale/airline/employee rates don't qualify | omnihotels.com/loyalty/faq | HIGH (official) |
| Excluded brands: Villas of Amelia Island Plantation, Lodge + Townhomes at Bretton Woods | omnihotels.com/loyalty/faq | HIGH (official) |
| 2024 relaunch: 1 Award Credit = 5 Omni Credits; 20-credit night = 100; Gold/Plat/Black -> Insider/Champion/Icon | omnihotels.com/loyalty/faq | HIGH (official) |
| Full benefits matrix (Wi-Fi, water, beverage, pressing, amenity, check-in/out, upgrades) | omnihotels.com/loyalty/member-benefits | HIGH (official) |
| No co-brand Omni credit card | WebSearch (NerdWallet, WalletHub) + absence | HIGH (by absence) |
| No active transfer partner (Mesa added 6/2025, shut down 12/12/2025) | FrequentMiler + Upgraded Points + Mesa shutdown reports | HIGH |
| No inbound bank transfers (Amex/Chase/Bilt/Citi/Cap One) | Absence from all issuer partner pages | HIGH (by absence) |
| Amex Platinum FHR/Hotel Collection includes some Omni properties | WebSearch (NerdWallet) | MEDIUM (Amex benefit, not Omni program -- noted as aside) |

## Notes / followups

- **Clean authoring run.** All four official pages scraped successfully via Firecrawl (WebFetch 403'd but the research orchestrator's Firecrawl path got through). Both regex and LLM audits CLEAN.
- **Regex audit:** 2 accepted `recent_year_2024` flags -- both reference the accurate January 2024 relaunch date, which is correct and relevant.
- **Sweet-spot examples** (Amelia Island, Bedford Springs, PGA National, Barton Creek as premium resorts) stated qualitatively ("cash rates can run several hundred dollars a night") -- no specific dollar rates cited, since I did not scrape live rates. Flat-redemption value logic is directly supported by the official "every property costs the same" rule.
- **hotel_properties not seeded.** Omni has 50+ properties. Decision Engine will not surface individual properties until scrape-properties.mjs is run for omni.
- **Mesa transfer partnership** existed June-December 2025 but Mesa shut down 2025-12-12. Excluded from transfer_partners (no active route). Removed from quirks prose after LLM flagged it as potentially-misleading defunct trivia.

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Champion beyond-room earn rate | WebSearch said Champion earns 2 credits/$100; official member-benefits grid says 1/$100 (only Icon earns 2) | Trusted official grid -- WebSearch was wrong |
| 2026-06-17 | WebFetch vs Firecrawl | omnihotels.com 403'd on WebFetch | research-program.mjs Firecrawl path scraped all 4 pages successfully |
