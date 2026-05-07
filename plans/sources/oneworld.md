# oneworld — Source List

Reference list of every URL used to author the public page at `/programs/oneworld`. Per-program audit trail — not the intel sources DB table. Sources here are static citations.

---

## Last reviewed
**April 2026** by jillyz250

## Official program sources

- **Alliance home:** https://www.oneworld.com/
- **Members directory:** https://www.oneworld.com/members
- **Member detail pages (per-airline tier crossover):**
  - Alaska Air Group: https://www.oneworld.com/members/alaska-airlines
  - American Airlines: https://www.oneworld.com/members/american-airlines
  - British Airways: https://www.oneworld.com/members/british-airways
  - Cathay Pacific: https://www.oneworld.com/members/cathay-pacific
  - Fiji Airways: https://www.oneworld.com/members/fiji-airways
  - Finnair: https://www.oneworld.com/members/finnair
  - Iberia: https://www.oneworld.com/members/iberia
  - Japan Airlines: https://www.oneworld.com/members/japan-airlines
  - Malaysia Airlines: https://www.oneworld.com/members/malaysia-airlines
  - Oman Air: https://www.oneworld.com/members/oman-air
  - Qantas: https://www.oneworld.com/members/qantas
  - Qatar Airways: https://www.oneworld.com/members/qatar-airways
  - Royal Air Maroc: https://www.oneworld.com/members/royal-air-maroc
  - Royal Jordanian: https://www.oneworld.com/members/royal-jordanian
  - SriLankan Airlines: https://www.oneworld.com/members/srilankan-airlines
- **Benefits / tier perks:** https://www.oneworld.com/benefits
- **Airport lounges policy:** https://www.oneworld.com/airport-lounges and https://www.oneworld.com/en/lounges
- **Round-the-world products:** https://www.oneworld.com/round-the-world-flights
- **Press room / news:** https://www.oneworld.com/news

## Press releases cited (2024-2026)

- [Aloha! oneworld welcomes Hawaiian Airlines to alliance — April 23, 2026](https://www.oneworld.com/news) — Hawaiian as third US-based carrier alongside Alaska + AA
- [oneworld Names Ole Orver Chief Executive Officer — February 23, 2026](https://www.oneworld.com/news) — CEO transition from Nathaniel Pieper
- [oneworld reveals top 10 destinations for Round the World travel in 2026 — November 13, 2025](https://www.oneworld.com/news)
- [Oman Air joins oneworld alliance — June 30, 2025](https://www.oneworld.com/news)
- [Paradise Found: oneworld welcomes Fiji Airways to global alliance — March 31, 2025](https://www.oneworld.com/news) — Fiji Airways effective full membership
- [Sky-high success: oneworld named Global Traveler's Best Airline Alliance for 15th consecutive year — December 12, 2024](https://www.oneworld.com/news)
- [oneworld Says Bula To Fiji Airways As Its 15th Full Member Airline — June 3, 2024](https://www.oneworld.com/news) — original Fiji Airways announcement
- [oneworld Alliance Celebrates 25 Years Of Excellence — June 3, 2024](https://www.oneworld.com/news) — anniversary milestone
- [oneworld Reaches A 25-Year Milestone, Having Flown Nearly Nine Billion Customers Since 1999 — February 1, 2024](https://www.oneworld.com/news)
- [oneworld Names Nathaniel Pieper As CEO — February 6, 2024](https://www.oneworld.com/news) — predecessor

## Cross-reference: third-party 2024-2026 articles

- [oneworld at 25: Fiji Airways Becomes Full Member as Alliance Focuses on Innovation — FlyerTalk](https://www.flyertalk.com/) — June 2024
- [Oneworld Welcomes Fiji Airways and Oman Air as Full Members — Prince of Travel](https://princeoftravel.com/)
- [Fiji Airways Will Become Full Oneworld Alliance Airline (Upgrade From Connect) — LoyaltyLobby](https://loyaltylobby.com/)

## S7 Airlines suspension reference

- Suspension effective April 19, 2022. Quote from oneworld members page (April 2026): "oneworld and S7 Airlines have agreed to a suspension of S7 Airlines' membership in the alliance effective 19 April 2022, until further notice."

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution + source |
|---|---|---|---|
| 2026-04-30 | Fiji Airways joined June 3, 2024 | Copilot flagged: June 3, 2024 was announcement; effective full membership April 1, 2025 | Updated draft: announcement June 3, 2024; effective April 1, 2025. Source: oneworld.com/news. |
| 2026-04-30 | Hawaiian Airlines as oneworld member | ChatGPT claimed "current active roster = 14, Hawaiian not separately listed as full member" | Held: official April 23, 2026 oneworld press release explicitly welcomes Hawaiian as alliance member. ChatGPT's training data hadn't seen the April 2026 announcement. Source: news.oneworld.com 23 April 2026. |
| 2026-04-30 | CEO Ole Orver appointed Feb 23, 2026 | ChatGPT/Copilot flagged unverifiable | Held: official oneworld press release dated February 23, 2026 confirms appointment. Source: news.oneworld.com. |
| 2026-04-30 | RTW awards cannot be paid with miles | Copilot/ChatGPT flagged unverifiable / partially incorrect | Held: official oneworld RTW page (oneworld.com/round-the-world-flights) FAQ explicitly states "Currently, it is not possible to use frequent flyer points to pay for a oneworld Round The World trip." |
| 2026-04-30 | Atmos members no oneworld lounge access intra-NA | ChatGPT/Copilot flagged unverifiable as Atmos-specific | Held: official oneworld lounges page specifies "Alaska Airlines/Hawaiian Airlines Atmos Rewards members, regardless of their tier status or class of travel, are not eligible for access to oneworld member airline lounges when traveling solely within and between the U.S., Canada, and Mexico." |
| 2026-04-30 | Tier crossovers (every member program) | ChatGPT/Copilot flagged "likely correct but unverifiable in 2024-2025 sources" | Held: each crossover came directly from the per-airline detail page on oneworld.com (e.g. /members/atmos, /members/aadvantage). User pasted source text directly. Official wins over fact-checker indexing gaps. |
| 2026-04-30 | ~9 billion passengers since 1999; 15-year Best Alliance streak | ChatGPT/Copilot flagged unverifiable | Held: both come from official oneworld press releases (Feb 2024 25-year milestone; Dec 2024 Global Traveler award). |

## Notes / followups

- **6-month re-review:** late October 2026. Likely changes by then: SkyTeam / Star Alliance shifts that affect oneworld positioning; any RTW product changes; possibly oneworld connect carrier additions.
- **Hawaiian member detail page:** as of April 2026, oneworld.com presents Hawaiian under the unified Alaska Air Group page, not as a standalone member with its own /members/hawaiian-airlines URL. Watch for this to split into its own member page over the next 6-12 months as the integration matures — if it does, the member_programs JSON should split atmos into two rows OR add carrier_slugs reference back to a hawaiian carrier-specific entry.
- **Avios shared currency:** the list of programs that earn/burn Avios shifts over time; verify current set on next review (BA, Iberia, Aer Lingus, Vueling, Finnair, Qatar Privilege Club confirmed; Qantas hint mentioned in pasted material was unsupported — removed from final draft).
- **Oman Air Sindbad Emerald-equivalent tier:** as of April 2026 Oman Air Sindbad has no Emerald-mapped tier. Watch for them to introduce one as the alliance integration matures.
- **AAdvantage international transcon exception:** the exact list of routes where AAdvantage members get oneworld lounge access on US transcon (currently JFK-LAX/SFO) shifts; verify on review.
- **CEO transition note:** Ole Orver took over Feb 23, 2026 from Nathaniel Pieper. Strategic priorities under new CEO will likely shift; watch news for new initiatives that might warrant page refresh sooner.
