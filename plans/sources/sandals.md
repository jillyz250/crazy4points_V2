# Island Insiders Club (Sandals / Beaches Resorts) -- Source List

Reference list of every URL used to author the public page at `/programs/sandals`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored)

## Official program sources (primary)

- **Program overview + full tier benefit table:** https://www.sandals.com/about/rewards-program/ (scraped 2026-06-17 -- authoritative for tier thresholds, earn rates, bonus points, discount %s, benefit descriptions)
- **Island Insiders Club blog announcement (June 15, 2026):** https://www.sandals.com/blog/island-insiders-club-loyalty-program/
- **News article:** https://news.sandals.com/article/1870/
- **Program T&C:** https://www.sandals.com/my-account/terms
- **Sandals credit card landing page:** https://www.sandals.com/sandalscard/
- **Beaches version of same program:** https://www.beaches.com/about/rewards-program/

## Secondary sources (blogs, 2025-2026)

- Caribbean Journal (June 2026): https://www.caribjournal.com/2026/06/15/sandals-loyalty-beaches-program/
- PR Newswire press release: https://www.prnewswire.com/news-releases/sandals-and-beaches-resorts-launch-rebranded-loyalty-program-island-insiders-club-302800547.html
- U.S. News (BofA card review): https://money.usnews.com/credit-cards/bank-of-america/bank-of-america-sandals-visa-signature-credit-card

## Key facts sourced + confidence level

| Claim | Source | Confidence |
|---|---|---|
| Program rebrands from Sandals Select Rewards to Island Insiders Club July 1, 2026 | Official blog + PR Newswire | HIGH (official) |
| Select tier renamed to Shell; all status, points, nights carry over | Official FAQ (tiers page) | HIGH (official) |
| 7 tiers: Shell, Coral, Sapphire, Emerald, Diamond, Pearl, Ambassador | Official benefit table | HIGH (official) |
| Shell: 1st stay; Coral: 2nd stay | Official benefit table | HIGH (official) |
| Sapphire: 25 nights OR $25,000; Emerald: 45 nights OR $40,000 | Official benefit table | HIGH (official) |
| Diamond: 100 nights OR $90,000; Pearl: 250 nights OR $220,000 | Official benefit table | HIGH (official) |
| Ambassador: 400 nights OR $345,000 | Official benefit table | HIGH (official) |
| Earn rates: Shell/Coral 1pt/$1; Sapphire/Emerald 2pt/$1; Diamond 3pt/$1; Pearl/Ambassador 4pt/$1 | Official benefit table | HIGH (official) |
| Bonus points per stay: Shell 5,000; Coral 250; Sapphire 375; Emerald 500; Diamond 750; Pearl 1,000; Ambassador 2,000 | Official benefit table | HIGH (official) |
| On-resort discount: Shell 0%; Coral/Sapphire 10%; Emerald/Diamond 15%; Pearl/Ambassador 20% | Official benefit table | HIGH (official) |
| 20% off Manager's Wine List: Coral and above | Official page text ("for Coral members and above") | HIGH (official) |
| $200 Laundry Credit + Annual Thank You Gift: Ambassador only | Official page text ("exclusively for Ambassadors") | HIGH (official) |
| VIP Concierge Line: Diamond, Pearl, Ambassador | Official page + PR Newswire ("top-tier Insiders", "most loyal members") | HIGH (confirmed) |
| Complimentary Week Award after 70 paid nights; room category = average of prior 70 nights | Official page text | HIGH (official) |
| Room Upgrade Hotline: 30 days before, up to 50% off, all tiers | Official page text ("As an Insider") | HIGH (official) |
| Choice of Spa/Excursion credit per stay (claim via app 30 days before) | Official page text + footnote 1 | HIGH (official) |
| Future Memories Discount: up to 12% off next booking at on-resort lounge | Official page text | HIGH (official) |
| Complimentary 5x7 photo or digital image per stay | Official page text | HIGH (official) |
| Point value: 10,000 pts = $250 USD (2.5 cents/pt) | Official Refer a Friend section | HIGH (official) |
| BofA Sandals Visa: 4x Sandals/Beaches, 2x restaurants/grocery, 1x elsewhere; no annual fee; no FX fee | Multiple blog sources (2026) | MEDIUM-HIGH (not scraped from BofA official page) |
| No major credit card currencies (Amex/Chase/Citi/Bilt/CapOne/WF) transfer in | Transfer partner research + absence from all issuer partner lists | HIGH (by absence) |
| Beaches resorts (family) included in same program | Official page + Beaches.com | HIGH (official) |
| Direct bookings only count toward tier | FAQ + general program terms | HIGH (confirmed in FAQ) |

## Notes / followups

- **BofA card SUB and exact earn rates** sourced from blogs, not BofA official page. Verify at sandals.com/sandalscard/ on next refresh.
- **Benefit checkmarks not captured in scrape.** The official benefit table has checkmarks showing which tiers get which benefits (Cabana, Private Transfers, Fees Waived for Reservation Changes, Weekly VIP Event, Preferred Room Number). These are NOT included in tier_benefits because the markdown scrape shows empty cells where icons would render. Only text-confirmed per-tier assignments are stated. Visit sandals.com/about/rewards-program/ for the full visual table.
- **Points redemption cap unclear.** Two third-party sources contradicted each other (one said "up to 100% of room cost" another said "up to 25%"). Not included in how_to_spend to avoid stating wrong cap; readers directed to program FAQ.
- **hotel_properties not seeded.** Sandals + Beaches = 16 properties across 7 islands. Decision Engine will not surface properties until scrape-properties.mjs backlog is addressed.

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Points redemption ceiling (25% vs 100%) | Two blog sources contradicted each other | Not stated; readers directed to sandals.com/about/rewards-program/faqs/ |
| 2026-06-17 | "Free Week Award" official name triggers audit | Regex rule flags "free" even in proper nouns | Renamed to "Complimentary Week Award" throughout page |
