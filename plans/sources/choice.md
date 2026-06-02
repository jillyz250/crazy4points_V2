# Choice Privileges — Source List

Reference list of every URL used to author the public page at `/programs/choice`. This is **per-program audit trail** — not the intel sources DB table. Sources here are static citations, not feeds.

Whenever this page is updated, append new sources to the relevant section. Don't delete old ones — they're our trail.

---

## Last reviewed
**June 2026** by Claude (with Jill)

## Official program sources

- **Choice Privileges landing:** https://www.choicehotels.com/choice-privileges
- **Benefits / membership levels table:** https://www.choicehotels.com/choice-privileges/benefits
- **Redeem points (redemption menu, cruises, airline miles, gift cards):** https://www.choicehotels.com/choice-privileges/redeem-points
- **Travel partners (inbound transfer ratios):** https://www.choicehotels.com/choice-privileges/partners
- **Rewards Exchange (airline-miles conversions, powered by Points.com):** https://www.choicehotels.com/choice-privileges/rewards-exchange
- **Rules & regulations / program terms (expiry, reinstatement, exclusions, soft landing):** https://www.choicehotels.com/choice-privileges/rules-regulations
- **Choice Privileges Cruises:** https://www.ChoicePrivilegesCruises.com

## Section-by-section provenance (June 2026 authoring)

### Intro
- "over 7,100 hotels", "Reward nights start at 8,000 points", 5 membership levels incl. new Titanium — choicehotels.com/choice-privileges + /benefits
- PENN Play status match, points-plus-cash ($17 + 6,000 pts) — /benefits
- U.S. News #1 hotel rewards program 2025-2026 (first time at #1) — https://travel.usnews.com/features/us-news-top-hotel-and-airline-rewards-programs

### Award chart / how_to_spend / sweet_spots
- 8,000-point floor, no blackout dates, no published category chart/ceiling — /benefits + /redeem-points
- Points Plus Cash mechanic + 20,000-pt example, US-only, 6,000-pt minimum — rules-regulations
- Cruises (Carnival, Royal Caribbean), Bluegreen, Preferred Hotels & Resorts, PENN casinos, airline miles via Rewards Exchange, gift cards, charity donations — /redeem-points + /partners

### Tier benefits
- Qualification thresholds (Gold 5nts/10k, Platinum 15/30k, Diamond 35/70k, Titanium 55/110k), bonus points 10/25/50/50%, Return-and-earn, Points sharing (coming soon), complimentary breakfast, PENN Play Advantage match, Titanium Travel Award — /benefits

### Free Night Certs
- Titanium Travel Award (50% off Reward Night, 1 room up to 7 nights; brands: Ascend, Cambria, Radisson Blu/Red/Individuals, Westgate Resorts, Bluegreen) — /benefits footnote

### Tips & quirks
- 18-month expiry, points reinstatement (180 days, 1M cap), WoodSpring exclusion, extended-stay earn cap, $40 rate floor, third-party booking exclusion, Status Soft Landing, Radisson-outside-Americas exclusion — rules-regulations

### Transfer partners (inbound — verified on Choice's own /partners page)
- **Amex Membership Rewards:** 1,000 = 1,000 → 1:1 — choicehotels.com/choice-privileges/partners
- **Capital One:** 1,000 = 1,000 → 1:1 — /partners + https://www.capitalone.com/learn-grow/money-management/venture-miles-transfer-partnerships/
- **Citi ThankYou:** 1,000 = up to 1,500 → 1:1.5 (premium cards); devalued from 1:2 on 2026-04-19 — /partners
- **Wells Fargo Rewards:** 1 pt = 2 → 1:2 (best inbound ratio) — /partners

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution + source |
|---|---|---|---|
| 2026-06-02 | "five elite tiers" in intro | Member is the base level, not elite | Reworded to "five membership levels topped by the new Titanium tier" — /benefits membership table |
| 2026-06-02 | Citi → Choice 1:2 (stored) | Stale; Citi devalued 2026-04-19 | Corrected to 1:1.5 — Choice /partners page ("up to 1,500") |
| 2026-06-02 | Wells Fargo → Choice 1:1 (stored) | Wrong ratio | Corrected to 1:2 — Choice /partners page ("1 WF point = 2 Choice points") |
| 2026-06-02 | Amex MR partner missing | Choice lists Amex MR at 1:1 | Added — Choice /partners page |
| 2026-06-02 | Citi inbound ratio flat 1:1.5 | Card-dependent | Converted to tiers (premium 1:1.5 Strata Elite/Premier/Prestige; standard 1:1.05 Custom/Double/Rewards+) to mirror Citi's authoritative outbound entry |
| 2026-06-02 | free_night_certs saved as string | Page render expects array → 500 crash | Converted to FreeNightCertRow[] (one row: Titanium Travel Award) |
| 2026-06-02 | Copilot/ChatGPT: "Radisson outside Americas is stale" | External models conflated Radisson Americas (Choice-owned, participates) with Radisson Hotel Group Belgium (unaffiliated, does not) | PUSHED BACK — Choice T&C confirms non-Americas Radisson does not participate. Kept fact; sharpened wording to name both halves |
| 2026-06-02 | Copilot: "Soft Landing starts 2027" | Not in official T&C | PUSHED BACK — no "2027" in Choice rules-regulations; clause is in-effect now. Kept as-is |
| 2026-06-02 | Copilot/ChatGPT: property count 7,400-7,500 | Third-party estimates | Kept Choice's own official "7,100+" per official-sources-only rule |

## Notes / followups

- **Citi ratio is card-dependent:** premium Citi cards (Strata Elite/Premier/Prestige, AT&T Access More) get the full 1,500; other ThankYou cards get less (~1,050). Stored value reflects the premium/headline ratio. Re-check if Citi adjusts again.
- **Award chart has no published ceiling** — Choice does not publish a category chart or max points/night. If observed point ranges become available, consider adding an observational bands table (Hilton-style).
- **`{choice_property_count}` token candidate:** intro hardcodes "7,100+" — Choice's own marketing figure, drifts over time. Consider tokenizing per the global intro-token-audit backlog.
- **Lounge access:** Choice has no club-lounge program (confirmed absent from all official pages); page states this explicitly.
