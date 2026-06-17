# Sonesta Travel Pass -- Source List

Reference list of every URL used to author the public page at `/programs/sonesta`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored). Lean style: avoid derived math + over-specificity; keep only official figures, lightly.

## Official program sources (primary -- Firecrawl-scraped 2026-06-17)

- **Main Travel Pass page + FAQ:** https://travelpass.sonesta.com/ (authoritative -- tiers, earn rates by brand, redemption, status carryover, status match, family-transfer of reward nights, qualifying rules, brands/geography)
- **Member benefits PDF:** https://travelpass.sonesta.com/wp-content/uploads/2025/07/STP-Member-Benefits.pdf (per-tier benefit chart -- exact bonus multipliers; NOT yet fetched, use on next refresh)
- **Terms & conditions:** https://www.sonesta.com/travel-pass/terms-conditions (expiry window, qualifying rates, transfer rules)
- **Our partners:** https://www.sonesta.com/our-partners (brand partners = travel services, not points transfers)

Note: https://www.sonesta.com/sonesta-travel-pass and .../sonesta-travel-pass-terms-conditions 404'd; the live program content lives at travelpass.sonesta.com.

## Secondary sources (WebSearch, 2026)

- upgradedpoints.com/travel/hotels/sonesta-travel-pass-loyalty-program/ -- tier benefits detail
- nerdwallet.com/travel/learn/your-guide-to-the-sonesta-travel-pass-loyalty-program -- overview
- frequentmiler.com/complete-guide-to-sonesta-travel-pass/ -- redemption tier range
- awardwallet.com/blog/sonesta-travel-pass-points-expire/ -- expiry (24 months inactivity)
- nerdwallet.com/credit-cards/learn/sonesta-credit-card -- Sonesta World Mastercard discontinuation (BofA, Feb 13 2026)

## Key facts sourced + confidence level

| Claim | Source | Confidence |
|---|---|---|
| Tiers Bronze (enroll) / Silver (10 nights) / Gold (20) / Platinum (40), or points equivalent | travelpass.sonesta.com main + FAQ | HIGH (official) |
| Status earned in a year holds through end of following year | travelpass.sonesta.com FAQ | HIGH (official) |
| Earn full rate/$1 most brands; reduced rate at Simply Suites/ABVI/CBVI/Signature Inn | travelpass.sonesta.com FAQ | HIGH (official) |
| Free/award night from ~10,000 points, scales by hotel tier; shown next to cash price | travelpass.sonesta.com FAQ | HIGH (official) |
| Reward night transferable to immediate family member | travelpass.sonesta.com FAQ | HIGH (official) |
| Status match to Silver/Gold/Platinum from competing programs | travelpass.sonesta.com main + FAQ | HIGH (official) |
| Military/veterans rate confers Gold status (promo MILR) | travelpass.sonesta.com main | HIGH (official) |
| Direct-booking only; OTA/wholesale/group/award stays don't qualify | travelpass.sonesta.com FAQ | HIGH (official) |
| 13 brands, 1,100+ hotels; US + Latin America + select intl | travelpass.sonesta.com | HIGH (official) |
| Silver = bonus multiplier; Platinum = largest multiplier | upgradedpoints + main page ("Tier Bonus Multipliers") | MEDIUM (exact % per tier in benefits PDF, not yet fetched -- kept qualitative) |
| Points expire after ~24 months inactivity | AwardWallet | MEDIUM (secondary; stated qualitatively as "prolonged inactivity") |
| No co-brand card (Sonesta World Mastercard discontinued early 2026, BofA) | NerdWallet | MEDIUM (secondary; well-reported) |
| No airline/bank transfer partners | official partners page (absence) + secondary | HIGH (by absence) |
| JetBlue/Lufthansa 5:1 airline transfer | WebSearch only -- NOT on official partner roster | OMITTED -- unconfirmed, possibly stale; do not assert |

## Notes / followups

- **Clean authoring run.** Main page + FAQ scraped richly via Firecrawl. Both audits clean.
- **Lean style applied:** avoided derived dollar/value math and exact bonus-multiplier percentages (Silver 50% / Platinum 100% appear in secondary sources but Gold's figure is unconfirmed; kept qualitative). Earn rate and tier night-counts kept (official, low-clutter).
- **JetBlue/Lufthansa airline transfer (5:1)** seen in secondary sources is NOT on Sonesta's official partner page (which lists car rental, food delivery, fitness, fuel). Omitted per no-unsourced-claims rule -- verify on next refresh; if confirmed official, add to transfer_partners_outbound.
- **Member benefits PDF not yet fetched** -- it has the exact per-tier bonus multipliers and full benefit matrix. Fetch on next refresh to firm up Gold's multiplier and any benefits the main-page icon grid didn't map.
- **hotel_properties not seeded.** 1,100+ Sonesta properties. Decision Engine won't surface individual hotels until scrape-properties.mjs runs for sonesta.

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Airline transfer partners | WebSearch claimed JetBlue/Lufthansa 5:1; official partners page lists none | Trusted official-page absence; omitted the claim |
| 2026-06-17 | sonesta.com program/terms URLs | /sonesta-travel-pass + /...terms-conditions 404'd | Live content is at travelpass.sonesta.com; used that |
