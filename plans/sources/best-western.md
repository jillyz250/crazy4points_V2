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

## Residual flags
- **Airline transfer roster NOT seeded (documented gap).** The official Convert-to-Miles
  link 404s and the official Travel Partners page (https://www.bestwestern.com/en_US/best-western-rewards/travel-partners.html)
  is Firecrawl/WebFetch-blocked (403). The T&C does not enumerate partners. Blogs
  (NerdWallet/Milesopedia/thepointcalculator) cite ~13 partners at a typical 5,000 BW =
  1,000 miles (5:1), naming Alaska/Atmos, Flying Blue, British Airways, Southwest - but
  per card-data-source policy these are NOT seeded from blogs. transfer_partners_outbound
  left empty; page notes "select airline partners, roster on official site."
  TRIGGER: seed when the official roster (logged-in Travel Partners list) is captured.
- Airline-miles conversion is a known poor-value redemption ("you almost always lose
  value") - low priority to complete.
