# Radisson Rewards (global) - source archive

**Program:** Radisson Rewards (slug `radisson`) - the GLOBAL program for Europe, Middle
East, Africa, and Asia Pacific. **Not** the Americas: Radisson-brand US/Canada/LatAm
properties run on Choice Privileges (slug `choice`) since the 2022-2023 split.
**Authored:** 2026-06-15 | **Migrations:** 446 (seed) + 447 (T&C reconciliation)

## Disposition of related rows
- `radisson` - GLOBAL program. Authored + active.
- `radisson-americas` - RETIRED. Merged into Choice Privileges July 2023 (points moved
  at 2:1, status matched). Row left inactive with a "RETIRED" intro note; do not author.
- `choice` - Choice Privileges. Already live; the home for Americas Radisson stays.

## Primary sources (official, pasted/verified 2026-06-15)
- **Radisson Rewards T&C** (effective 18 July 2023) - https://www.radissonhotels.com/en-us/terms-and-conditions
  - Tiers: Club (auto on enrollment), Premium (5 Eligible Nights OR 3 Eligible Stays /
    rolling 12 mo), VIP (30 Eligible Nights OR 20 Eligible Stays / rolling 12 mo).
  - Earning per USD: Club 8, Premium 27, VIP 36; Discount Booster active -> Premium 9,
    VIP 12. Prize by Radisson brand: Club 4, Premium 13.5, VIP 18 (booster 4.5 / 6).
    Meetings & Events: 5 pts/USD, max 250,000 per event.
  - Redemption: dynamic (no chart). Pay-with-Points min 10 pts. Online Award Night
    redemption capped at USD 600/night value; above that, front desk only.
  - Points expire after any 24-month period with no activity.
  - Member-to-member transfer: max 5 members/month, receive max 100,000/month, 30-day
    membership minimum. Refer-a-friend: 1,000 pts each, max 50,000/yr.
  - Russia properties excluded. Early/late check-in = 2 hours either side. Free
    breakfast-for-two = VIP only. F&B discount: no stated percentage in T&C.
- **Airline Miles redemption page** - https://www.radissonhotels.com/en-us/rewards/redeem/miles
  - Base 10 Radisson points = 1 airline mile, auto-redeemed in 10,000-pt increments.
  - SAS EuroBonus exception: 7 Radisson : 1 EuroBonus point, 7-pt increments.
  - Max 1,000,000 points per calendar year redeemed to miles.
  - Lufthansa Miles & More: barred for the account lifetime if points were ever
    purchased or gifted.
  - NOTE: the logged-OUT page does not enumerate the full partner dropdown.
- **Rewards landing** - https://www.radissonhotels.com/en-us/rewards

## Secondary sources (cross-check)
- Head for Points 2026 guide - https://www.headforpoints.com/2026/03/28/complete-guide-radisson-rewards-hotel-loyalty-scheme/
- Head for Points (Sept 2025) - Radisson dropping Avios - https://www.headforpoints.com/2025/09/01/radisson-rewards-dropping-avios/
- Head for Points (May 2025) - convert to Avios/SAS/Flying Blue - confirms SAS + Flying Blue partners
- OMAAT transfer guide - https://onemileatatime.com/guides/transfer-radisson-rewards-points/
- Choice x Radisson Americas merger - https://onemileatatime.com/news/choice-radisson-americas-programs-merge/

## Fact-check corrections (draft -> verified)
| Field | Draft (mig 446) | Corrected (mig 447, official) |
|---|---|---|
| Earning rates | flagged (8/27/36 vs flat 20) | CONFIRMED 8 / 27 / 36 per USD (booster 9 / 12); Prize half-rates |
| Tier thresholds | flagged | Premium 5 nights/3 stays; VIP 30 nights/20 stays (rolling 12 mo) |
| F&B discount | "10%" | no stated % in T&C - removed the number |
| Early/late check | generic | 2 hours either side |
| Free breakfast | unspecified tier | VIP-only, for two |
| Redemption cap | not noted | online up to USD 600/night; above at front desk |
| Miles & More | not noted | lifetime bar if points purchased/gifted |
| SAS ratio | 7:1 (guessed) | CONFIRMED 7:1, 7-pt increments |

## Residual flags
- **Airline partner roster is partial.** Only SAS, Flying Blue, Miles & More are seeded
  (confirmed). The full ~20-carrier list is in the logged-in member dropdown, not in any
  public page. Expand `transfer_partners_outbound` when the dropdown is captured.
- Avios removed Sept 2025 - do not re-add British Airways without re-verification.
