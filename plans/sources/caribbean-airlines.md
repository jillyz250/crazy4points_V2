# Caribbean Airlines (Caribbean Miles) — Source List

Reference list of every URL used to author the public page at `/programs/caribbean-airlines`. This is **per-program audit trail** — not the intel sources DB table.

The Caribbean Airlines website is a hash-routing SPA, which means Firecrawl returned the homepage shell for every loyalty URL during research. Most editorial content was sourced from third-party blogs, news coverage, the official program email to members dated 08 May 2026, and the official Caribbean Club enrolment PDF. Items flagged "verify on next review" should be re-checked against the official program page directly when a future authoring pass can render the SPA properly.

---

## Last reviewed
**May 2026** by Claude (initial author)

## Official program sources

- **Program FAQ / terms:** https://www.caribbean-airlines.com/caribbean-miles/terms-and-conditions (SPA — content not directly scrapable)
- **Program redemption page:** https://www.caribbean-airlines.com/caribbean-miles/redeem-miles (SPA)
- **Program tiers page:** https://www.caribbean-airlines.com/caribbean-miles/tiers (SPA)
- **Program partners page:** https://www.caribbean-airlines.com/caribbean-miles/partners (SPA)
- **Lounge page:** https://www.caribbean-airlines.com/lounges (SPA)
- **Login portal:** https://caribbeanairlines.frequentflyer.aero/pub/
- **News & promotions:** https://www.caribbean-airlines.com/news-and-promotions (seeded into Scout sources, requires Firecrawl)
- **Caribbean Club enrolment PDF:** https://newwebsiteblobs.blob.core.windows.net/marketing/CaribbeanClubEnrolmentForm.pdf
- **Caribbean Club brochure (procurement portal):** https://procurement.caribbean-airlines.com/wp-content/uploads/2024/03/Club-brochure-2.pdf

## Social channels (for ongoing signal monitoring)

- **Facebook:** https://www.facebook.com/caribbeanairlines
- **Instagram:** @caribbeanairlines
- **X / Twitter:** @CaribbeanAirlines

## Research articles cited (by section)

### Intro / program overview
- [Caribbean Airlines Miles Program for Loyal Customers Revamped — SFLCN](https://sflcn.com/caribbean-airlines-miles-program-for-loyal-customers-revamped/) — third-party reporting on the 01 January 2025 reboot, source for Silver $3K and Platinum $12K spend thresholds
- [On January 1st, 2025 the newly refreshed Caribbean Miles — Caribbean Airlines Facebook](https://www.facebook.com/caribbeanairlines/posts/938679588296983/) — official program announcement
- [Caribbean Miles program email to members, 08 May 2026 — pasted by user] — peak rate elimination details (HIGH source for chart, refund mechanics, peak windows)

### Award chart
- [Caribbean Miles program email to members, 08 May 2026 — pasted by user] — 15K Economy / 25K Business / Classic Upgrade 15K / Flex Upgrade 10K post-08-May rates; refund mechanics for already-booked peak windows

### Lounge access / Caribbean Club
- [Caribbean Airlines Club Caribbean — Sleeping in Airports](https://www.sleepinginairports.net/airport-lounges/caribbean-airlines-club-caribbean.htm) — lounge size + amenities
- [Review: Caribbean Airlines Business Class Club Lounge — JetToAJet](https://www.jettoajet.com/post/review-caribbean-airlines-business-class-club-lounge-port-of-spain-piarco-airport)
- [Caribbean Airlines Revamps Business Class Lounge at Piarco — Airways Magazine](https://www.airwaysmag.com/legacy-posts/caribbean-business-lounge-piarco)
- Caribbean Club enrolment form PDF (linked above) — paid membership pricing ($350 USD individual, $650 USD couple), partner lounge access at JFK / MIA / MCO / YYZ / KIN / GEO

### RBC co-brand card
- [RBC Caribbean Airlines Visa Platinum — RBC Royal Bank Caribbean](https://www.rbcroyalbank.com/caribbean/credit-cards/details/personal/curacao/caribbean-airlines-visa-platinum/index.page)
- [RBC Caribbean Airlines Visa Platinum — Trinidad](https://www.rbcroyalbank.com/caribbean/credit-cards/details/personal/trinidad/cal-visa-business-platinum/index.page)
- [Earn Caribbean Miles and fly faster — RBC Benefits Guide PDF](https://www.rbcroyalbank.com/caribbean/credit-cards/assets/caribbean-cc/documents/benefits-guide-cal-platinum.pdf)

### Fleet & route network
- [Caribbean Airlines Drops Final B737-800, Shakes Up 2026 Travel Routes — Travel And Tour World](https://www.travelandtourworld.com/news/article/caribbean-airlines-drops-final-b737-800-shakes-up-2026-travel-routes-what-it-means-for-tourism-across-trinidad-jamaica-barbados-guyana-and-latin-america/)
- [Caribbean Airlines Fleet 2026 — Flight Seatmap](https://flightseatmap.com/airlines/caribbean-airlines/fleet)
- [Caribbean Airlines (BW/BWA) Fleet, Routes & Reviews — Flightradar24](https://www.flightradar24.com/data/airlines/bw-bwa)
- [List of Caribbean Airlines destinations — Wikipedia](https://en.wikipedia.org/wiki/List_of_Caribbean_Airlines_destinations)

### Miles expiry / inactivity
- [Caribbean Miles — Caribbean Air (third-party Weebly mirror)](https://caribbeanair.weebly.com/caribbean-miles.html) — 36-month activity rule, 24-month statement-suppression rule

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution + source |
|---|---|---|---|
| 2026-05-08 | Lounge eligibility (initial draft said Caribbean Miles Gold/Platinum elites get auto access) | Copilot fact-check ⚠️: only business class passengers + Caribbean Club paid members confirmed in 2026 sources | Rewrote lounge_access section. Caribbean Club ($350/yr) gates lounge access; Caribbean Miles tier alone does not. Caribbean Club auto-enrols members in Miles, but the reverse is not true. Verified via [Sleeping In Airports](https://www.sleepinginairports.net/airport-lounges/caribbean-airlines-club-caribbean.htm) + [Airways Magazine](https://www.airwaysmag.com/legacy-posts/caribbean-business-lounge-piarco) + Caribbean Club enrolment PDF. |
| 2026-05-08 | Per-tier earning multipliers (e.g. Silver = 1.25x, Platinum = 2x) | Copilot fact-check ❓: concept of multipliers confirmed but no specific values published | Removed numeric multipliers from tier_benefits draft. Each tier now lists "bonus mile multiplier" qualitatively without a specific factor. |
| 2026-05-08 | Silver $3K / Platinum $12K spend thresholds | Copilot fact-check ❓: not verifiable from public 2025-2026 sources | Kept thresholds in draft tagged with "third-party reported - verify on next review" qualifier. Original source: SFLCN coverage of the 2025 reboot. |
| 2026-05-08 | Award chart structure (15K Economy / 25K Business flat year-round) | Copilot fact-check ❓: post-08-May chart not publicly published; verifiable only from member email | Kept rates in award_chart draft; flagged that distance-band structure + one-way vs round-trip directionality are not publicly published; source is the program email dated 08 May 2026. |

## Notes / followups

- **High-priority verify on next review:** Gold spend threshold (currently "not publicly documented"). If Caribbean Airlines publishes tier qualifications on the SPA, capture and update.
- **High-priority verify on next review:** per-tier earning multipliers. Currently absent from tier_benefits.
- **Verify on next review:** post-08-May-2026 chart structure - is it flat single-rate or distance-banded? Are rates one-way or round-trip?
- **Verify on next review:** lounge access at outstation airports (JFK / MIA / MCO / YYZ / KIN / GEO) - which specific contracted lounges does Caribbean Club provide access to as of mid-2026?
- The Bank of America Caribbean Airlines MasterCard referenced in older articles is out of date - the current US-issuance status of any Caribbean Airlines co-brand should be confirmed; as of May 2026 only RBC Caribbean-territory issuance is documented.
- No flexible-currency transfer-in path exists as of May 2026; recheck on each review whether this changes (especially if Capital One adds Caribbean partners or if Marriott adds them as a hotel-to-airline partner).
- Site is a hash-routing SPA - any future research-program.mjs run will return shell-only content unless the orchestrator gains JS-rendering capability. Manual paste-in or Firecrawl with extended waits may be required for direct official scraping.
