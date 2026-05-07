# Delta Air Lines — Source List

Reference list of every URL used to author the public page at `/programs/delta`. Per-program audit trail — not the intel sources DB table.

---

## Last reviewed
**May 2026** by jillyz250

## Official program sources

- **Delta home:** https://www.delta.com/
- **SkyMiles overview:** https://www.delta.com/us/en/skymiles/skymiles-program/get-to-know-skymiles
- **Medallion benefits at each tier:** https://www.delta.com/us/en/skymiles/medallion-program/benefits-at-each-tier
- **Reach Medallion Status (MQD thresholds):** https://www.delta.com/us/en/skymiles/medallion-program/reach-medallion-status
- **Sky Club access policies:** https://www.delta.com/us/en/airport-information/sky-club (access policies tab)
- **Delta One Lounges:** https://www.delta.com/us/en/airport-information/delta-one-lounges
- **Delta credit cards:** https://www.delta.com/us/en/credit-cards
- **News Hub (press room):** https://news.delta.com/
- **News Hub RSS:** https://news.delta.com/rss.xml
- **Joint Ventures overview:** https://www.delta.com/us/en/joint-venture-partners

## 2026 facts captured

- 8 hubs: ATL (fortress), DTW, MSP, SLC (other fortresses), JFK, LAX, SEA (coastal), BOS (hybrid hub/focus city)
- LGA remains a focus city, NOT a hub
- MQD-only Medallion qualification since 2024
- 2027 MQD thresholds (earned via 2026 spend, unchanged from 2026): Silver $5,000 / Gold $10,000 / Platinum $15,000 / Diamond $28,000
- MQD Boost: Plat/Plat Business cards $1 MQD per $20 spend; Reserve/Reserve Business cards $1 MQD per $10 spend
- MQD Headstart: $2,500 for Plat / Reserve cards each Medallion Qualification Year
- Earn rates: Silver 7x, Gold 8x, Platinum 9x, Diamond 11x miles per dollar on Delta-marketed flights
- 1 Million Miler = lifetime Silver Medallion (2M Gold, 3M Platinum, 4M Diamond)
- SkyMiles never expire
- Sky Club Jan 1 2024 restriction: Basic Economy banned entirely; Diamond/Platinum/Gold Medallions in Main Cabin/Comfort+ international lose access (must be in Premium Select or Delta One)
- 3-hour Sky Club entry window effective February 2025
- Single Visit Pass sale discontinued (existing passes valid until expiration)
- Delta SkyMiles Reserve Amex: 15 Sky Club visits/Medallion Year; unlimited at $75K calendar-year spend
- Delta SkyMiles Platinum Amex: 10 Sky Club visits/Medallion Year; unlimited at $75K calendar-year spend (effective Feb 1, 2025)
- Centurion access on Delta-operated, Delta Connection, or Delta-marketed WestJet (006 ticket #) flights
- Joint Ventures: AF-KLM (transatlantic), Virgin Atlantic (transatlantic), Korean Air (transpacific), LATAM (Latin America)
- Virgin Australia is a strategic partnership — NOT a full revenue-sharing JV

## Transfer partners + tax/fee notes captured

- Amex MR -> SkyMiles 1:1, federal excise tax pass-through ~$0.0006/point (capped $99 personal / $200 business per year)
- Marriott Bonvoy -> SkyMiles 3:1 base; 60K Marriott = 25K SkyMiles bonus tier (5K bonus); no transfer tax on Marriott side
- Chase UR / Capital One / Citi TY / Bilt — NO direct transfer to SkyMiles

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution + source |
|---|---|---|---|
| 2026-05-01 | Marriott ratio = 3:1.1 | User caught: other pages use 3:1; the .1 sweetener is a tier-level bonus, not the base ratio | Updated to 3:1 with bonus-tier explanation in notes (60K Marriott = 25K SkyMiles bonus tier). |
| 2026-05-01 | Virgin Australia = JV | ChatGPT caught: Delta-Virgin Australia is a strategic partnership, not a true revenue-sharing JV | Updated intro + quirks to remove Virgin Australia from JV list. Real JVs: AF-KLM, Virgin Atlantic, Korean Air, LATAM. |
| 2026-05-01 | Korean Air F via SkyMiles | ChatGPT caught: Korean F awards via SkyMiles are inconsistent | Softened sweet spots to "Business Class" with "First Class availability is inconsistent" caveat. |
| 2026-05-01 | Flying Blue Promo Rewards via SkyMiles | ChatGPT caught: Promo Rewards is a Flying Blue program feature, not directly bookable via SkyMiles | Reworded to clarify: the play is to transfer Amex MR to Flying Blue directly if you want Promo Rewards. |
| 2026-05-01 | Million Miler = lifetime Medallion | ChatGPT caught: it's lifetime Silver specifically | Clarified to "1M = lifetime Silver; 2M = Gold; 3M = Platinum; 4M = Diamond." |
| 2026-05-01 | Sky Club day passes | ChatGPT caught: Single Visit Pass sale was discontinued | Removed from how_to_spend; quirk note added re: discontinuation. |
| 2026-05-01 | "Delta One on partner" Sky Club row | ChatGPT caught: there's no "Delta One on partner" — Delta One is Delta-only branding; partner equivalent cabin only applies to Medallion guest rule | Dropped that row from the lounge_access table. |
| 2026-05-01 | MQD threshold dollar amounts ($5K/$10K/$15K/$28K) | Both fact-checkers confirmed | Held. Removed the "(verify...)" hedges since both confirmed. |
| 2026-05-01 | Amex MR transfer tax not previously captured | User caught: federal excise tax is real and reader-relevant | Added to transfer_partners notes. New project rule saved (`feedback_capture_transfer_fees.md`) — every transfer_partners row should note tax/fee status going forward. |

## Notes / followups

- **6-month re-review:** late October 2026. Stale pill will fire automatically in admin (180-day red Review badge from PR #267).
- **Delta News Hub RSS** (`https://news.delta.com/rss.xml`) added to Scout sources, daily ingest, no Firecrawl needed (200 OK direct).
- **MQD thresholds:** Delta has shifted these multiple times since the 2023 revolt. Verify on next review whether 2027 (-> 2026 earning) numbers held or shifted again.
- **Virgin Atlantic Upper Class redemption pricing:** Flying Club is fully dynamic — sub-50K saver rates noted as rare, not reliable. Watch for further dynamic-pricing changes.
- **Delta + Korean Air JV** has had some recent press around route expansions; verify current scope on next review.
- **Hawaiian on Delta-marketed flights** Sky Club access carve-out — confirm this still holds after deeper Hawaiian-Delta SkyTeam crossover (still evolving as of May 2026).
- **Lounge_access table styling:** Fixed via PR #279 (May 1, 2026). All program pages now have proper border/striping/mobile-scroll on markdown tables.
- **Cross-page integration (PR #273):** Writer + fact-checker now pull alliance content for member airlines. Delta is a SkyTeam member, so all Delta alert drafts will include SkyTeam alliance context (Sky Club ruleset, Elite Plus crossover, etc.).
- **Backlog:** When 5+ US airlines are authored (Alaska + Delta = 2 so far), trigger the Resources nav dropdown per `project_resources_nav_trigger.md`.
- **Backlog:** When all 12 US carriers are done (Alaska, Delta, AA, United, Hawaiian, Southwest, JetBlue, Spirit, Frontier, Allegiant, Avelo, Breeze, Sun Country), run the Section Milestones checklist in `plans/airline-page-runbook.md`.
