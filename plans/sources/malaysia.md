# Malaysia Airlines Enrich -- Source List

Reference list of every URL used to author `/programs/malaysia`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored). Lean style. oneworld member. Program refreshed effective 2026-01-01.

## Official sources (Firecrawl-scraped 2026-06-17)
- **Main:** https://enrich.malaysiaairlines.com/ (two point types, earn/redeem, Enrich Hotels)
- **2026 update (AUTHORITATIVE):** https://enrich.malaysiaairlines.com/EnrichUpdates2026 (multipliers, Elite Status thresholds, Elite Points rules)
- **oneworld member page:** https://www.oneworld.com/members/malaysia-airlines (tier mapping)

## Secondary (WebSearch / WebFetch, 2026)
- frequentmiler.com/citi-thankyou-rewards-airline-and-hotel-transfer-partners/ -- CONFIRMED Citi ThankYou -> Enrich is a current 1:1 partner (WebFetched 2026-06-17)
- upgradedpoints / pointhacks / ringgitplus -- 2026 program changes, oneworld context

## Key facts + confidence
| Claim | Source | Confidence |
|---|---|---|
| Alliance = oneworld; hub KUL | oneworld.com + official | HIGH |
| Two point types: Enrich Points (spend, valid 3 yrs) + Elite Points (status, distance+cabin) | EnrichUpdates2026 | HIGH (official) |
| Enrich Points multiplier: Blue 1.5 / Silver 1.8 / Gold 2.2 / Platinum 2.5 per RM1 (MH+Firefly) | EnrichUpdates2026 | HIGH (official) |
| Elite thresholds: 2026 yr = 30/60/100; 2027 qual (2026 flying) = 35/70/140 Elite Points | EnrichUpdates2026 | HIGH (official) |
| Elite Points only on MH/Firefly/oneworld (non-oneworld partners ineligible) | EnrichUpdates2026 | HIGH (official) |
| Enrich Points valid 3 years | EnrichUpdates2026 | HIGH (official) |
| Tier mapping: Silver=Ruby, Gold=Sapphire, Platinum=Emerald | oneworld standard + member page | HIGH |
| Silver: +10kg baggage, priority baggage handling | EnrichUpdates2026 | HIGH (official) |
| Citi ThankYou transfers to Enrich at 1:1 (current 2026; 1-2 days) | FrequentMiler (WebFetched, maintained list) | HIGH |
| Marriott Bonvoy transfers in (standard ~3:1) | WebSearch | MEDIUM-HIGH (verify ratio on marriott.com) |
| Amex / Chase / Capital One do NOT transfer; no US Enrich card | WebSearch (multiple) | HIGH (by absence) |
| A350 Business Suite = standout home redemption | WebSearch + general | MEDIUM (qualitative) |

## Notes / followups
- **Citi 1:1 confirmed via WebFetch** of FrequentMiler's maintained Citi partner list -- resolved a hedge during the confidence pass. The 2022 Citi drop was temporary; Enrich is back on the list. Added `citi` to transfer_partners (1:1).
- **Award chart NOT cited numerically** -- I did not have verified Enrich award point levels, so award_chart is qualitative and points to enrich.malaysiaairlines.com. FM notes Enrich award values are modest (post-2017 devaluation) -- reflected in the "book MH via Avios/AAdvantage instead" framing.
- **Elite Points are an abstract unit** (e.g. KL-Tokyo biz = 10), earned by distance + cabin; thresholds 35/70/140 are small numbers of long-haul premium flights.
- **Marriott ratio** stated as standard ~3:1 -- verify exact current ratio on marriott.com on refresh.
- both audits CLEAN after the Citi resolution.

## Fact-check disagreements / resolutions
| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Citi -> Enrich | One source said Citi dropped Enrich 2022; others said it transfers in 2026 | WebFetched FM's maintained list -- Enrich IS a current Citi 1:1 partner. Stated as current fact. |
