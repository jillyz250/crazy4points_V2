# myBarcelo Benefits (Barcelo Hotel Group) -- Source List

Reference list of every URL used to author the public page at `/programs/barcelo`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored)

## Official program sources (primary)

- **Program overview and tiers:** https://www.barcelo.com/en-us/mybarcelo/
- **General conditions (T&C):** https://www.barcelo.com/en-us/mybarcelo/general-conditions/ (scraped 2026-06-17; OLD URL /terms-conditions/ returns 404 -- use /general-conditions/)
- **Airline partners page:** https://www.barcelo.com/en-us/bhg/partners/ (confirms LifeMiles + Copa ConnectMiles earn-on-stay partnerships)
- **LifeMiles x Barcelo T&C:** https://www.lifemiles.com/partners/hotel/BARGL (confirms 1 LifeMile per USD 1 spent; member must declare at checkout)
- **Copa Airlines ConnectMiles -- Barcelo partner page:** https://www.barcelo.com/en-us/bhg/partners/copa-airlines/ (page exists but returned 403 during scrape; rate not confirmed from official source)

## Secondary sources (blogs, 2025-2026)

- Upgraded Points: https://upgradedpoints.com/travel/hotels/my-barcelo-loyalty-program/
- SoLoyal: https://www.soloyal.co/barcelo-hotel-group-mybarcelo-infopage (program shape overview)

## Key facts sourced + confidence level

| Claim | Source | Confidence |
|---|---|---|
| myBarcelo is a discount + amenities program (no redeemable points) | Official tiers page 2026 scrape | HIGH (official) |
| 3 tiers: Essential, Special, Unique | Official tiers page + FAQ | HIGH (official) |
| Essential: automatic on joining | Official tiers page | HIGH (official) |
| Essential: 5% booking discount, 5% services discount | Official tiers page | HIGH (official) |
| Special: 2 stays + EUR 1,000 in 24 months | Official FAQ (tiers page) | HIGH (official) |
| Special: 10% booking discount, 10% services discount | Official tiers page | HIGH (official) |
| Unique: 4 stays + EUR 3,000 in 24 months | Official FAQ (tiers page) | HIGH (official) |
| Unique: 10% booking discount, 20% experiences/services discount | Official tiers page | HIGH (official) |
| Unique: room upgrade, early 10am check-in, late 4pm checkout, minibar, welcome gift, water | Official tiers page | HIGH (official) |
| OTA bookings = no benefits, no tier credit | Official FAQ | HIGH (official) |
| Consecutive same-property stays on consecutive dates = one stay | Official FAQ | HIGH (official) |
| Cuba excluded from program | Official FAQ | HIGH (official) |
| Spend thresholds denominated in EUR | Official FAQ | HIGH (official) |
| 24-month rolling window (no annual reset) | Official FAQ (implied by "in 24 months" language) | HIGH (official) |
| LifeMiles: 1 mile per USD 1 spent, declare at checkout | LifeMiles official T&C (lifemiles.com/partners/hotel/BARGL) | HIGH (official) |
| Copa ConnectMiles earns on Barcelo stays | Barcelo partner page URL confirmed (403 during scrape) | MEDIUM (page exists, rate unconfirmed) |
| ~180 hotels total | Barcelo hotel search ("All hotels - 180 hotels" shown in page nav) | HIGH (page UI) |
| Four brands: Barcelo, Royal Hideaway, Occidental, Allegro | Official program page + hotel listing | HIGH (official) |
| Barcelo Pro Rewards is a separate trade/agent program with points | Barcelo Pro Rewards site (barceloprorewards.com) | HIGH (separate URL, separate T&C) |
| Geographic split in benefits (Europe/MEA/Asia vs. Americas) | Official tiers page benefit table | HIGH (official) |
| No airport lounge access at any tier | Not mentioned on official page; confirmed absent | HIGH (by absence) |
| No credit card currencies transfer in; no hotel points transfer out | Transfer partner matrix research 2026 | HIGH (by absence -- no Barcelo currency exists to transfer) |

## Notes / followups

- **Copa rate unconfirmed:** The Copa ConnectMiles earn rate at Barcelo is not confirmed from an official source (page returned 403). Mentioned as a quirk with a reference URL. Verify on next refresh.
- **Barcelo Pro Rewards disambiguation:** The separate Barcelo Pro Rewards program (for travel agents/professionals) DOES have points redeemable for stays. Prominently noted in quirks to prevent reader confusion.
- **hotel_properties not seeded:** Barcelo has ~180 properties across four brands. Decision Engine will not surface Barcelo properties until scrape-properties.mjs backlog is addressed.
- **Americas benefit table:** Benefits at Caribbean all-inclusive properties (Mexico, DR, Aruba, Costa Rica, Guatemala, El Salvador, Nicaragua) differ slightly from Europe/MEA/Asia table -- some amenities like minibar appear available at all tiers at all-inclusive resorts. Not broken out in the page to avoid complexity; editorial note here for future refresh.
- **Program name:** The official program is "my Barcelo Benefits" (lowercase "my"). Rendered as "myBarcelo Benefits" in the DB to avoid ASCII issues with the accent.

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Copa ConnectMiles earn rate | Official page returned 403; rate unknown | Mentioned as available partner without a confirmed rate; follow up on next refresh |
| 2026-06-17 | "The flip side:" transition in intro | llm-audit flagged as logically incorrect framing | Changed to "That said," per audit recommendation |
