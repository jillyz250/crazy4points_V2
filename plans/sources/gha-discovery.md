# GHA Discovery — Source List

Reference list of every URL used to author the public page at `/programs/gha-discovery`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored)

## Official program sources (primary — scraped 2026-06-17)

- **Tier benefits overview:** https://www.ghadiscovery.com/gha-discovery-benefits
- **Terms & Conditions (earn rates, expiry, tier qualification, ineligible rates):** https://www.ghadiscovery.com/terms-conditions
- **DISCOVERY Dollars (D$ mechanics):** https://www.ghadiscovery.com/DISCOVERY-Dollars
- **Our Partners (lifestyle partners — no airline transfers):** https://www.ghadiscovery.com/our-partners
- **Our Brands (60-plus member brands):** https://www.ghadiscovery.com/our-brands

## Key facts sourced + confidence level

| Claim | Source | Confidence |
|---|---|---|
| D$1 = USD 1 (fixed value) | T&C + D$ page | HIGH (official) |
| Silver 4%, Gold 5%, Platinum 6%, Titanium 7% D$ earn | T&C section 5 | HIGH (official) |
| D$ expiry: Silver 12mo / Gold 18mo / Platinum 24mo / Titanium 24mo | T&C section 5 | HIGH (official) |
| Promotional D$ expire in 6 months | T&C section 5 | HIGH (official) |
| Silver: join automatically | T&C section 3.7 | HIGH (official) |
| Gold: 2 stays OR USD 1,000 spend | T&C section 3.8 | HIGH (official) |
| Platinum: 10 nights OR 2 brands OR USD 5,000 | T&C section 3.9 | HIGH (official) |
| Titanium: 30 nights OR 3 brands OR USD 15,000 | T&C section 3.10 | HIGH (official) |
| NH Hotels + NH Collection + nhow = 1 brand for tier purposes | T&C section 16 | HIGH (official) |
| Platinum: one-category room upgrade at check-in | T&C section 4 | HIGH (official) |
| Platinum: late checkout 3pm (subject to availability) | T&C section 4 | HIGH (official) |
| Titanium: two-category room upgrade | T&C section 4 | HIGH (official) |
| Titanium: early check-in 11am (must request 2 days prior) | T&C section 4 | HIGH (official) |
| Titanium: complimentary breakfast for two (brand-dependent) | T&C + breakfast page | HIGH (official) |
| Breakfast NOT available at Platinum/Gold/Silver | T&C + WebSearch blogs | HIGH (official + confirmed) |
| ASMALLWORLD membership for Platinum/Titanium | Partners page | HIGH (official) |
| No airline transfer partners | Partners page (no airline listed) | HIGH (stated by absence) |
| OTA bookings ineligible for D$ and tier credit | T&C section 11 | HIGH (official) |
| D$ redeemed in expiration order (soonest first) | T&C section 6.6 | HIGH (official) |
| Member rates 5-10% off published direct rate | T&C section 4 | HIGH (official) |
| Status downgrade one level at a time | T&C section 3.12 | HIGH (official) |
| D$ valid for use on rooms, dining, spa, golf, Experiences | D$ page | HIGH (official) |
| More than 40 member brands | T&C (lists ~55 brand names; external sources cite "45 distinct brands"; downgraded to "more than 40" — conservative and defensible) | MEDIUM (conflicting counts) |
| Hundreds of properties, 100-plus countries | WebSearch (multiple 2026 sources) | MEDIUM (not directly scraped from official page) |

## Notes / followups

- **Titanium breakfast brand list** at https://www.ghadiscovery.com/complimentary-breakfast/titanium-members — page scraped but brand IDs in URL filter params could not be decoded to confirm specific brands. Page copy says "we're bringing it to more soon!" (not all GHA brands participate). Sweet spot now links to the official page instead of naming specific brands. If you want to verify exact brand list, load that URL in a browser — it shows a hotel grid filtered by breakfast-eligible brands.
- **Status match promotions** run periodically (paid, half fee back in D$). No permanent URL — watch GHA promotions page.
- **Mastercard status partnership** (instant Platinum/Titanium for cardholders) is a recurring promotion. Monitor GHA partners page.
- **hotel_properties not seeded** — GHA has hundreds of properties across 40+ brands. Decision Engine will not surface GHA properties until scrape-properties.mjs backlog is addressed.
- **No airline transfer partners as of mid-2026** — the partners page lists only lifestyle partners (Plum Guide, Blacklane, SIXT, Regent Cruises, ASMALLWORLD, Wolseley restaurants). Monitor the partners page for any new airline addition.
- **Buy D$ at discount** — GHA runs periodic 15% discount sales on D$. Pricing is login-gated; the discount figure is sourced from blog coverage (WebSearch), not official page. MEDIUM confidence on the exact discount percentage.

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Breakfast availability at Platinum | Some blogs describe Platinum as including breakfast | T&C and official GHA page explicitly state Titanium-only. Blogs are wrong. |
| 2026-06-17 | "faster than any other" Titanium path | Editorial superlative | Softened to "notably fast" per llm-audit. The 3-brand path is a documented real advantage without needing a comparative absolute. |
| 2026-06-17 | "60-plus brands" brand count | T&C lists ~55 brand names but external sources cite "45 distinct brands"; official GHA marketing says "40+ brands" | Downgraded to "more than 40 brands" — conservative and defensible from all sources. |
| 2026-06-17 | "Anantara, Kempinski, Capella, Corinthia" breakfast brands | Could not verify specific brands from breakfast page scrape (brand IDs in URL params, not readable text) | Removed specific brand examples; sweet_spots now directs readers to official breakfast page. |
