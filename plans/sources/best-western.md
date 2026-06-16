# Best Western Rewards - source archive

**Program:** Best Western Rewards (slug `best-western`, type hotel). Covers Best Western,
BW Plus/Premier, BW Signature & Premier Collections, SureStay brands, Aiden/Sadie/GLo/Vib,
and the upscale WorldHotels collection. **Authored:** 2026-06-15 | **Migrations:** 449
(seed) + 450 (T&C reconciliation).

## Primary sources (official, pasted/verified 2026-06-15)
- **BWR Terms & Conditions** (effective 26 Sept 2024) - https://www.bestwestern.com/en_US/legal/bwr-terms-conditions.html
  - Earning: 10 pts/USD on room rate (before tax/fees) for Qualifying Nights; 5 pts/USD
    at SureStay Studio, Executive Residency, and @HOME by Best Western. Non-qualifying:
    OTA / tour operator / employee / crew / wholesale / 30+ night rates.
  - Elite (calendar-year Qualifying Nights): Gold 5 / Platinum 7 / Diamond 15 / Diamond
    Select 25. Bonuses: +10 / +15 / +30 / +50%. Status earned in 2026 holds through
    31 Dec 2027. Earning Miles (preference) forfeits the elite bonus.
  - Points NEVER expire. No blackout. Free nights: standard room only, dynamic by ADR,
    up to 7 consecutive nights, call center / online only (no travel agents).
  - Pay with Points: min 5,000 + cash, 1,000-pt increments, first night only, counts
    toward elite.
  - Member-to-member transfers: 1,000-pt increments, 30-day account age, max 150,000/
    rolling calendar year (over 70,000 reviewed). Purchase: $0.01/pt, max 100,000/12mo.
  - BWR member rate: 7%+ off the Flexible Rate. Best Western Gift Card never expires.
- **Benefits-at-a-Glance table** (official rewards landing) - https://www.bestwestern.com/en_US/best-western-rewards.html
  - Authoritative per-tier perk grid. Confirms NO room upgrade at any tier; Diamond vs
    Diamond Select differ only by bonus %. Water + 500 pts = Gold+. Early/late = Platinum+.

## Secondary sources (cross-check)
- TPG ultimate guide - https://thepointsguy.com/loyalty-programs/ultimate-guide-best-western-rewards/
- AwardWallet elite status - https://awardwallet.com/hotels/best-western-elite-status/
- Milesopedia 2026 - https://milesopedia.com/en/reward-program/best-western-rewards/
- FinanceBuzz - https://financebuzz.com/best-western-rewards-program

## Fact-check corrections (draft mig 449 -> verified mig 450)
| Field | Draft | Corrected (official) |
|---|---|---|
| Room upgrade | Gold + Diamond "room upgrade subject to availability" | REMOVED - not an official benefit at any tier (blog-sourced error) |
| 5-pt brands | "SureStay Studio" only | SureStay Studio + Executive Residency + @HOME |
| Free-night range | hard "5,000-70,000" | dynamic by ADR; "starting around 5,000"; no asserted max |
| Free nights | generic | standard room only, max 7 consecutive nights |
| Pay with Points | not detailed | min 5,000 + cash, first night only, counts toward elite |
| Transfers | "to another member" | 1,000-pt increments, 30-day age, max 150,000/yr |
| Member rate | not noted | 7%+ off Flexible Rate (added) |
| Diamond Select | implied extra perks | bonus % is the ONLY differentiator vs Diamond |

## Airline partner roster (RESOLVED, migration 451)
Official Travel Partners page pasted by Jill 2026-06-15. 10 airline partners seeded
(PAYBACK Germany excluded - retail loyalty, not an airline). The page figures are
EARN-INSTEAD-PER-NIGHT rates (miles/points earned per qualifying night if that airline
is your earning preference), NOT conversion ratios:
- Aeromexico Rewards - 800 pts/night
- Air Canada Aeroplan - 250 miles/night
- Air France-KLM Flying Blue - 250 miles/night
- Atmos (Alaska) - 250 pts/night
- Avianca LifeMiles - 250 miles/night
- Cathay Asia Miles - 250 miles/night
- SAS EuroBonus - 600 pts/night
- Southwest Rapid Rewards - 600 pts/night
- United MileagePlus - 250 miles/night
- Virgin Atlantic Flying Club - 500 pts/night

Direct point-to-mile CONVERSION ratio is set by BWI and NOT published (third-party
reports near 5,000 BW = 1,000 miles / 5:1, flagged). ratio recorded as "varies."
Note: the earlier-cited British Airways partner (blogs) is NOT on the current official
page - correctly excluded. Airline-miles conversion remains a poor-value redemption.

## Co-brand credit cards (authored 2026-06-15, migrations 453 + 454)
Two current Visa cards, issued by **First Bank & Trust, Brookings SD** (serviced by
Mercury Financial). Old FNBO Mastercards are closed/never in our DB. Both linked to the
`best-western` program (co_brand + currency), so they auto-appear in "Cards that earn
into Best Western Rewards."

Source: official BW Visa page (https://www.bestwestern.com/en_US/offers/hotel-discounts/best-western-rewards-visa.html)
+ Mercury Guide to Benefits (https://www.mercurycards.com/cards/#/benefits) + Rewards T&C
(free-night-award terms). All pasted/verified by Jill 2026-06-15.

| | Visa Signature (`best-western-rewards-visa`) | Premium Visa Signature (`best-western-rewards-premium-visa`) |
|---|---|---|
| Annual fee | $0 | $89 |
| FX fee | None | None |
| Earn | 4X BW, 2X all | 10X BW, 4X gas+grocery, 2X all |
| Status | auto Gold | auto Platinum |
| Anniversary | 10,000 points | up to 2 free night awards |
| Welcome | up to 40,000 (10k-40k variable) | up to 80,000 (20k-80k variable) |
| Shared | Cell Phone Protection; Trip Delay up to $300 (>12h); Trip Cancel/Interrupt up to $2,000 | same |

Corrections vs draft: dropped a blog-sourced "10% rate discount" (not on official page);
dropped an unconfirmed $5k-spend trigger on the Signature anniversary bonus; removed
early/late check-out from the Signature (Gold) description (it is a Platinum+ perk).
Free-night-award terms: standard room, any Licensed Hotel, no published cap, room+tax
only, expires per the date on the award. Welcome spend amount not published (variable
by pre-approval).
