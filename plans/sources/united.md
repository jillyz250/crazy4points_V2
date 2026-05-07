# United Airlines — Source List

Reference list of every URL used to author the public page at `/programs/united`. Per-program audit trail — not the intel sources DB table.

---

## Last reviewed
**May 2026** by jillyz250

## Official program sources

- **United home:** https://www.united.com/
- **MileagePlus overview:** https://www.united.com/en/us/fly/mileageplus.html
- **Premier status overview + benefits:** https://www.united.com/en/us/fly/mileageplus/premier.html
- **Premier qualification (PQF/PQP thresholds):** https://www.united.com/en/us/fly/mileageplus/premier/how-to-qualify.html
- **United Club access:** https://www.united.com/en/us/fly/travel/airport/united-club.html
- **Polaris Lounges:** https://www.united.com/en/us/fly/travel/inflight/polaris.html
- **Hub list / company info:** https://www.united.com/en/us/fly/company/hubs
- **News Hub (press room):** https://hub.united.com/
- **Credit card lineup:** https://www.united.com/en/us/credit-cards

(Note: most united.com URLs are bot-blocked and could not be auto-verified via curl during authoring. They're standard URL patterns; verify any 404 manually on next review.)

## 2026 facts captured

- 8 hubs: ORD (Chicago), IAH (Houston), EWR (Newark), IAD (Washington Dulles), SFO (San Francisco), DEN (Denver), LAX (Los Angeles), GUM (Guam — only US carrier with a Pacific hub)
- Founding member of Star Alliance, May 14, 1997
- MileagePlus miles never expire
- Premier qualification dual-track (PQF + PQP OR PQP-only path) plus 4 minimum United / United Express flights:
  - Silver: 15 PQF + 5,000 PQP OR 6,000 PQP
  - Gold: 30 PQF + 10,000 PQP OR 12,000 PQP
  - Platinum: 45 PQF + 15,000 PQP OR 18,000 PQP
  - 1K: 60 PQF + 22,000 PQP OR 28,000 PQP
- Premier earn rates effective April 2, 2026: Silver +2x, Gold +3x, Platinum +4x, 1K +6x miles per dollar (vs general MileagePlus members)
- PlusPoints allotments: 40 for Platinum, 280 for 1K each Premier Year
- PlusPoints + Complimentary Premier Upgrades (CPUs) eligible on award tickets effective February 1, 2026
- Premier 1K free drink + snack in Economy
- Star Alliance crossover: Premier Silver = Star Alliance Silver; Gold/Platinum/1K = Star Alliance Gold
- Million Miler ladder: 1M = lifetime Premier Gold; 2M = Platinum; 3M = 1K. Earned via revenue BIS miles only — credit-card spend does not count.
- Higher mile thresholds beyond 3M aren't formally published; Global Services-level perks are invite-only and not strictly tied to a lifetime mile count.
- Companion benefits for 1MM members tighten starting 2027 — companion gets Gold only, not match sponsor.
- Excursionist Perk DISCONTINUED August 21, 2025 (was a flagship MileagePlus feature for nearly a decade)
- Cardmember booking discount: eligible United Cardmembers earn miles AND save at least 10% (15% for Premier members) when booking with miles on united.com
- 6 Polaris Lounges: ORD, IAH, EWR, SFO, LAX, IAD
- Polaris Lounges paid-cabin-only; Premier 1K alone does NOT grant access
- April 2026 Polaris tightening: several Star Alliance partner J fares (incl. Singapore Airlines J) excluded; new "Base Polaris" fare class excluded (gets United Club instead)
- ~50 United Clubs worldwide; Membership $650-$1,000+/year tier-dependent; Single Visit Pass $50-$65
- Joint Ventures: Lufthansa Group + Air Canada (4-way Atlantic Joint Business), ANA (transpacific). Hawaiian is partnership (not full JV) post-Atmos integration.
- Blue Sky / JetBlue collaboration launched late 2025; reciprocity rolling out through 2026

## Transfer partners + tax/fee notes

- Chase Ultimate Rewards 1:1 (no transfer tax)
- Bilt Rewards 1:1 (no transfer tax)
- Marriott Bonvoy 3:1 (60K Marriott = 25K MileagePlus bonus tier; no transfer tax on Marriott side)
- NO Amex MR, NO Capital One Miles, NO Citi TY direct transfer to MileagePlus

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution + source |
|---|---|---|---|
| 2026-05-01 | Excursionist Perk active | Copilot caught: discontinued August 21, 2025 | Removed from intro / how_to_spend / sweet_spots. Quirk note added explaining the 2025 change. |
| 2026-05-01 | Bilt does not transfer to United | ChatGPT caught: Bilt does transfer 1:1 (added in 2024+) | Added Bilt as transfer_partners row. |
| 2026-05-01 | Singapore Suites bookable via MileagePlus | ChatGPT caught: Suites are KrisFlyer-only | Removed from sweet spots; added caveat that Singapore Suites can only be booked via KrisFlyer. |
| 2026-05-01 | Basic Economy = no United Club access | ChatGPT caught: not a United rule (Delta-style restriction confused with United) | Removed claim; United Club access via Membership / Star Alliance international itinerary works regardless of fare class. |
| 2026-05-01 | Hawaiian = JV | ChatGPT caught: Hawaiian is partnership, not full JV | Reworded JV list to exclude Hawaiian; quirk notes "evolving partnership." |
| 2026-05-01 | ANA F via MileagePlus reliable sweet spot | ChatGPT caught: availability rare and overstated | Softened framing — "rare and dynamic-priced" rather than reliable. |
| 2026-05-01 | 4M = Global Services | ChatGPT + WebSearch agent: GS is invite-only, not formally tied to mile threshold | Softened — "Higher mile thresholds beyond 3M aren't formally published; Global Services is invite-only." |
| 2026-05-01 | "Blue Sky" JetBlue partnership | ChatGPT: not real. Copilot + user's official paste: REAL (launched late 2025) | Held: official source (united.com paste) explicitly references it. |
| 2026-05-01 | Cardmember 10-15% booking discount | ChatGPT: wrong. Official source (user paste): real | Held: user's united.com paste verbatim. |
| 2026-05-01 | Polaris April 2026 tightening | ChatGPT: unverified. Copilot + WebSearch agent (OMAAT, MileLion): confirmed | Held with hedging in quirks. |
| 2026-05-01 | PQF/PQP thresholds | Both fact-checkers confirmed | Held. |
| 2026-05-01 | Earn-rate change April 2 2026 | Both fact-checkers confirmed | Held. |
| 2026-05-01 | 6 Polaris Lounges (was 5) | WebSearch agent caught I'd missed IAD | Updated to ORD, IAH, EWR, SFO, LAX, IAD. |
| 2026-05-01 | Million Miler tier ladder | WebSearch agent confirmed 1M = Gold, 2M = Plat, 3M = 1K | Locked in quirks. |

## Notes / followups

- **6-month re-review:** late October 2026. Stale pill auto-fires in admin (180-day red Review badge from PR #267).
- **United News Hub (`https://hub.united.com/`)** added to Scout sources, daily ingest, **Firecrawl on** (United bot-blocks direct curl). Verify a week out that content is pulling.
- **Excursionist Perk discontinuation** — verify on next review whether anything replaced it. United's 2025 program changes were significant; watch for new perks.
- **Blue Sky / JetBlue rollout** — partial as of mid-2026. Verify which routes / fare classes are reciprocal on next review.
- **Polaris Lounge partner exclusions** — verify the full list of excluded Star Alliance J fares (Singapore confirmed, others TBD) on next review.
- **Hawaiian partnership scope** — currently a partnership (not full JV). Watch for further integration as Alaska Air Group / Atmos consolidation matures.
- **Million Miler 2027 companion changes** — already announced; verify on next review whether implementation went smoothly.
- **Lounge_access table styling** — Fixed via PR #279 + #285 (May 1, 2026). All program pages now have proper border/striping/mobile-scroll on tables AND card-lite styling on bullet lists.
- **Cross-page integration (PR #273):** Writer + fact-checker now pull alliance content for member airlines. United is Star Alliance, so all United alert drafts will include Star Alliance context (Gold Track, alliance lounge ruleset, Excursionist Perk discontinuation context, etc.).
