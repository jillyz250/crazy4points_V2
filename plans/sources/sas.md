# SAS EuroBonus -- Source List

Reference list of every URL used to author `/programs/sas`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored). Lean style. ⚠ ALLIANCE: SAS left Star Alliance and joined **SkyTeam** on 2024-09-01.

## Official sources (Firecrawl-scraped 2026-06-17)
- **Main:** https://www.flysas.com/en/eurobonus (two point types, earn/use, news)
- **Use points:** https://www.flysas.com/en/eurobonus/use-points
- **Partners:** https://www.flysas.com/en/eurobonus/partners (SkyTeam airline partners + hotel/car)
- **Membership levels:** https://www.flysas.com/en/eurobonus/membership-levels (scrape TIMED OUT 2026-06-17 -- tier thresholds came from WebSearch; retry on refresh)
- **Award flights:** https://www.flysas.com/en/eurobonus/award-flights (fixed chart -- authoritative for point levels)

## Secondary (WebSearch, 2026)
- upgradedpoints / awardfares / point.me EuroBonus guides -- tier thresholds, SkyTeam mapping, sweet spots
- viewfromthewing / awardwallet -- Rove Miles as the sole US transfer partner (1:1, launched Mar 2026)

## Key facts + confidence
| Claim | Source | Confidence |
|---|---|---|
| Alliance = SkyTeam (joined 2024-09-01, left Star Alliance) | WebSearch (multiple) + partner list | HIGH |
| Two point types: Bonus (spend, ~4-5yr) + Level (status, 12-mo period) | flysas.com main | HIGH (official) |
| Tiers: Member / Silver (Elite) / Gold + Diamond (Elite Plus) / Pandion (invite) | flysas main + WebSearch | HIGH (levels page timed out; thresholds from WebSearch) |
| Thresholds: Silver 20k Level pts/10 flights, Gold 45k/45, Diamond 90k/90 | WebSearch (multiple) | MEDIUM (official levels page not scraped -- verify) |
| Earn bonuses: Silver 25% / Gold 50% / Diamond 75% / Pandion +25% all | WebSearch | MEDIUM |
| Fixed award chart; no fuel surcharges on SAS metal | flysas + WebSearch | HIGH (official) |
| Hotels by EuroBonus: 250k+ properties, from 18,000 pts/night | flysas main | HIGH (official) |
| Premium Economy now bookable on Delta + Virgin Atlantic w/ points | flysas main (news) | HIGH (official) |
| Partner award booking fees changed 5 May 2026 | flysas main (news) | HIGH (official) |
| No US bank transfers (Amex US/Chase/Citi/CapOne/Bilt); Rove Miles only (1:1) | WebSearch (multiple) | HIGH (by absence + Rove reports) |
| Status match in from Finnair / airBaltic / BA | WebSearch | MEDIUM |
| Qualification 12 mo + 3 mo grace (~15-mo level expiry) | flysas main FAQ | HIGH (official) |

## Notes / followups
- **Membership-levels page timed out** on scrape -- tier thresholds + earn-bonus percentages came from WebSearch (consistent across sources). Re-scrape to confirm exact numbers on next refresh.
- **LLM audit: 2 cosmetic MEDIUM findings accepted** -- it cycled on hedge wording for the "no US bank transfers as of June 2026" claim, which is already date-anchored AND carries a "transfer partnerships can shift" hedge. Regex CLEAN.
- **US access is the key caveat:** no major US bank currency feeds EuroBonus; Rove Miles (1:1, Mar 2026) is the sole US transfer route. For US flyers the angle is crediting SkyTeam flights / status match / booking SAS via other SkyTeam currencies.
- Award point levels (biz US-Europe ~60k each way, Nordic domestic ~5k) referenced qualitatively; verify exact numbers on the award-flights page on refresh.

## Fact-check disagreements / resolutions
| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Alliance | Old guides say Star Alliance | SAS joined SkyTeam 2024-09-01 -- used SkyTeam, flagged prominently |
