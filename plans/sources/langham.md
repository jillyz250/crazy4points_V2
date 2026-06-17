# Brilliant by Langham -- Source List

Reference list of every URL used to author the public page at `/programs/langham`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored)

Program note: DB row was legacy "Langham Club 1865"; renamed to "Brilliant by Langham" (relaunched 2024, replaced 1865 Privilege).

## Official program sources (primary -- all Firecrawl-scraped 2026-06-17)

- **About:** https://www.brilliantbylangham.com/en/about-brilliant (brands, ~30 hotels)
- **Member benefits:** https://www.brilliantbylangham.com/en/member-benefits (authoritative tier matrix -- Status Point thresholds, elite bonus %, dining %, room upgrade + late checkout values)
- **FAQ:** https://www.brilliantbylangham.com/en/faq (earn rate, expiry, reset, rules)
- **Points redemption:** https://www.brilliantbylangham.com/en/points-redemption (dynamic redemption, airline partners)
- **Points-to-Miles T&C:** https://www.brilliantbylangham.com/en/Points-to-Miles-Conversion-Terms-and-Conditions
- **Status match / Mastercard fast-track:** https://www.brilliantbylangham.com/en/enrolment/statusmatch
- **Programme T&C:** https://www.brilliantbylangham.com/en/programme-terms-conditions

## Secondary sources (WebSearch, 2026)

- thepointsguy.com/loyalty-programs/brilliant-by-langham-loyalty-program/ -- Status Point earn rate confirmation (108,000 = US$3,600), dynamic redemption
- businesstraveller.com/.../brilliant-by-langham-launches-points-conversion-option-with-four-airlines/ -- airline conversion ratio (12,500 pts : 250 miles)
- milelion.com/2026/02/28/mastercard-offering-instant-brilliant-by-langham-elite-status/ -- Mastercard fast-track tier mapping + 2027 extension
- pointhacks.com.au/brilliant-by-langham/ -- check-in/out + welcome amenity tier mapping
- prnewswire PR -- "Have a Brilliant Flight" four-airline launch (incl. China Eastern)

## Key facts sourced + confidence level

| Claim | Source | Confidence |
|---|---|---|
| Tiers: Onyx (0), Topaz 12k, Diamond 108k, Sapphire 360k, Ruby 720k Status Points | brilliantbylangham.com/member-benefits + faq | HIGH (official) |
| Earn 150 Award + 150 Status Points per US$5 on rooms/dining | brilliantbylangham.com/faq | HIGH (official; Status rate corroborated by TPG) |
| Dollar equivalents (Topaz ~$400, Diamond ~$3,600, Sapphire ~$12k, Ruby ~$24k) | derived from 150/US$5; TPG confirms 108k=$3,600 | HIGH (math checks vs official thresholds) |
| Elite Bonus Points: Topaz 10%, Diamond 15%, Sapphire 25%, Ruby 50% | brilliantbylangham.com/member-benefits | HIGH (official) |
| Dining discount: 5% (Onyx/Topaz) / 10% (Diamond+) outside HK, 15% designated HK | brilliantbylangham.com/member-benefits footnotes | HIGH (official) |
| Room upgrade voucher = Sapphire + Ruby | member-benefits (explicit text) | HIGH (official) |
| Late checkout 2pm (Sapphire) / 4pm (Ruby), excludes resorts | member-benefits (values official; tier map via Point Hacks) | HIGH values / MEDIUM tier-map |
| Early check-in = Diamond and above | Point Hacks / TPG | MEDIUM (secondary; official matrix didn't preserve columns) |
| Welcome amenity (Elite Amenity Pts / drink / dining credit; Ruby adds local gift) = Sapphire/Ruby | member-benefits (amenity options) + Point Hacks (tier map) | MEDIUM (tier map secondary) |
| Award Points expire 24 months inactivity; Status Points reset annually | brilliantbylangham.com/faq | HIGH (official) |
| Redemption is dynamic, no published chart, no blackout, full-cash-or-full-points | brilliantbylangham.com/points-redemption + faq + TPG | HIGH (official) |
| Earn on up to 3 rooms/reservation; non-transferable; direct-booking only | brilliantbylangham.com/faq | HIGH (official) |
| Airline partners: Cathay Asia Miles, Singapore KrisFlyer, Air China PhoenixMiles, China Eastern | points-redemption (official, lists 3) + PR (adds China Eastern) | HIGH partners |
| Airline conversion ratio ~12,500 pts : 250 miles, 25k min, 6-8 wk | Business Traveller / PR (official T&C omits ratio, "subject to change") | MEDIUM (secondary; stated approximately + verify link) |
| Mastercard fast-track: World Elite->Ruby, World->Sapphire, Plat/Titanium->Diamond, thru 2027-12-31 | MileLion + OzBargain + official statusmatch page | HIGH |
| ~30 hotels, 5 brands (Langham/Cordis/Eaton/Ying'nFlo/Chelsea Toronto) | brilliantbylangham.com/about-brilliant | HIGH (official) |
| No co-brand card, no inbound bank transfers | absence | HIGH (by absence) |

## Notes / followups

- **Clean authoring run.** All target official pages scraped via Firecrawl; both regex + LLM audits CLEAN on first/second pass.
- **Status Point earn rate** (150/US$5) is the same as the official Award Point rate and TPG explicitly confirms the dollar math (108,000 = US$3,600). Stated as fact.
- **Airline conversion ratio** is the one MEDIUM-confidence number: the official Points-to-Miles T&C page lists partners but not the ratio ("subject to change without notice"). The 12,500:250 figure is from Business Traveller / the launch PR. Stated approximately with a verify pointer -- no precise ratio asserted as fixed.
- **Check-in/out + welcome-amenity tier mapping** partly secondary (Point Hacks/TPG): the official member-benefits matrix lists the benefit rows and the 2pm/4pm + room-upgrade Sapphire/Ruby values, but the scrape did not preserve per-column checkmarks for early check-in / welcome amenity tier cutoffs. Page directs readers to the official benefits page to confirm exact cutoffs.
- **hotel_properties not seeded.** ~30 Langham-group hotels. Decision Engine won't surface individual properties until scrape-properties.mjs runs for langham.
- **DB row renamed** from "Langham Club 1865" to "Brilliant by Langham."

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Airline conversion | Initial WebSearch said generic "converts to miles"; official page lists partners but no ratio | Confirmed 4 partners official; ratio from Business Traveller/PR stated approximately + verify link |
| 2026-06-17 | Elite bonus % | Early WebSearch said flat "15% bonus points"; official matrix is tier-stepped 10/15/25/50 | Used official tier-stepped values |
| 2026-06-17 | "earn" scrape URL | /en/earn-and-redeem 404'd | Real page is /en/points-redemption -- scraped separately |
