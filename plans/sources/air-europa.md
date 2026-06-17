# Air Europa SUMA -- Source List

`/programs/air-europa`. SkyTeam member, Madrid (MAD). Lean style. Authored June 2026.
⚠ CORRECTION (2026-06-17 batch audit): SUMA has NO US bank transfer partners. See below.

## Official (Firecrawl 2026-06-17)
- https://www.aireuropa.com/us/en/aea/suma/our-program.html (overview, two mile types)
- https://www.aireuropa.com/us/en/aea/suma/our-program/cards-and-benefits.html (AUTHORITATIVE tier matrix)
- https://www.aireuropa.com/ot/en/aea/suma/our-program/miles-suma-miles-level.html (expiry: SUMA 24mo, Tier 12mo)
- https://www.aireuropa.com/us/en/aea/suma/our-program/our-partners.html (SkyTeam partners, redemption floors)

## Verification sources (per-issuer transfer lists, WebFetch/WebSearch 2026-06-17)
- thriftytraveler master transfer-partner list -- Air Europa NOT mentioned for any program
- Bilt support partner list -- Air Europa NOT a Bilt partner
- Wells Fargo partner list -- Air Europa NOT a WF partner
- Citi ThankYou list -- Air Europa NOT a Citi partner
- Capital One list -- Air Europa explicitly NOT a Cap One partner
- Amex partner page + FlyerTalk -- SUMA is an Amex partner ONLY for Spanish-issued Amex (American Express Europe S.A.), NOT US Membership Rewards

## Key facts + confidence
| Claim | Source | Confidence |
|---|---|---|
| SkyTeam member; Madrid hub | official + skyteam.com | HIGH |
| Two mile types: SUMA Miles (spend, 24mo) + Tier Miles (status, 12mo) | aireuropa miles page | HIGH (official) |
| Tiers Suma/Silver/Gold/Platinum; SkyTeam Elite (Silver), Elite Plus (Gold/Plat) | cards-and-benefits | HIGH (official) |
| Tier Mile thresholds 18k/32k/60k OR 14/26/50 flights, min 4 AE flights | cards-and-benefits | HIGH (official) |
| Seat/lounge/upgrade benefits per tier | cards-and-benefits | HIGH (official) |
| Platinum: 2 intercontinental biz upgrades during 12-mo status validity | cards-and-benefits | HIGH (official) |
| Redemption floors: partner ~1,500, SkyTeam ~6,000 SUMA Miles | WebSearch + partners | MEDIUM-HIGH |
| **NO US bank currency transfers to SUMA** (Amex US/Chase/Citi/CapOne/Bilt/WF all NO) | per-issuer lists (verified) | HIGH |
| Air Europa is an Amex partner ONLY for Spanish-issued Amex cards | Amex partner page + FlyerTalk | HIGH |
| US route = book Air Europa via Flying Blue (SkyTeam partner award) | SkyTeam membership + FB transferability | HIGH |
| SUMA Miles purchasable directly with bonuses (up to ~50%) | WebSearch | MEDIUM (qualitative) |

## Notes / followups
- ⚠ **MAJOR CORRECTION (migrations 583-586):** The original page (migration 578) wrongly framed Air Europa as "the most US-accessible" program, claiming 1:1 transfers from Amex/CapOne/Bilt/Citi/WF. That came from ONE bad cheat sheet that conflated Air Europa with **Flying Blue** (the SkyTeam program all those currencies actually transfer to). Per-issuer verification during the batch confidence audit showed NONE of the major US currencies transfer to SUMA -- US Amex doesn't (Spanish-Amex only), and Citi/CapOne/Bilt/WF/Chase don't at all. transfer_partners reset to []. Page reframed like SAS/China Eastern (limited US access; book via Flying Blue; buy SUMA Miles as the one US-accessible on-ramp).
- **Lesson:** transfer-partner cheat sheets conflate SkyTeam programs. Verify per-issuer (issuer's own partner list) before asserting -- exactly the issuer-page rule. The official tier/miles/lounge data (from aireuropa.com) was all correct; only the cheat-sheet-sourced transfer thesis was wrong.
- Both audits CLEAN after fixes (2 cosmetic LLM HIGH findings accepted -- cycling on the date-anchored, verified no-transfer claim).

## Fact-check disagreements / resolutions
| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | SUMA US transfer partners | Cheat sheet said Amex/CapOne/Bilt/Citi/WF 1:1; per-issuer lists say NONE | Verified per-issuer (Bilt/WF/Citi/CapOne lists + Amex Spanish-only). Reset transfer_partners=[]; reframed page. |
