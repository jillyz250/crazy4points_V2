# Wyndham Rewards — Source List

Reference list of every URL used to author the public page at `/programs/wyndham`. Per-program audit trail — not the intel sources DB table.

Whenever this page is updated, append new sources to the relevant section. Don't delete old ones.

---

## Last reviewed
**June 2026** by Claude (with Jill)

## Pending change — award chart restructure (effective Sept 15, 2026)
Detected via change-signals monitor 2026-06-27. **Action taken:** forward-looking heads-up added to `quirks`. **TODO on/after Sept 15:** rewrite `award_chart` from the flat three-tier 7,500 / 15,000 / 30,000 to the new **four-tier 5,000 / 15,000 / 30,000 / 45,000**, and update the 7,500 floor references in `intro` + `award_chart` to 5,000.
- New 5,000-point floor + new 45,000 top tier; a small number of premium/all-inclusive/lifestyle properties move 30K → 45K (50% jump per Wyndham).
- Pre-Sept-15 bookings honored at old rates; auto-refund of point difference if a property gets cheaper.
- **Official:** https://www.wyndhamhotels.com/wyndham-rewards/redeem/reward-tier-updates
- View from the Wing: https://viewfromthewing.com/wyndham-rewards-devalues-september-15-top-hotels-jump-from-30000-to-45000-points/
- One Mile at a Time: https://onemileatatime.com/news/wyndham-rewards-award-chart-changes/
- The Points Guy: https://thepointsguy.com/news/wyndham-rewards-award-chart-changes/

## Official program sources

- **Wyndham Rewards landing:** https://www.wyndhamhotels.com/wyndham-rewards
- **Member levels / tiers:** https://www.wyndhamhotels.com/wyndham-rewards/member-levels
- **Earn points:** https://www.wyndhamhotels.com/wyndham-rewards/earn
- **Free nights:** https://www.wyndhamhotels.com/wyndham-rewards/free-nights
- **Full Terms & Conditions (quirks source of truth):** https://www.wyndhamhotels.com/wyndham-rewards/terms
- **Titanium Terms (30k bonus + Avis President's Club):** within the T&C / member-levels Titanium section
- **Avis President's Club (Titanium):** https://www.avis.com/en/bridge/partner/wyndham/titanium-presidents-club

## Co-brand card sources (Barclays — issuer pages, per card-data-source rule)

- **Earner Plus ($75):** https://cards.barclaycardus.com/banking/cards/wyndham-rewards-earner-plus-card/ — 7,500 anniv pts (no spend), auto Platinum, 10% fewer pts on Go Free
- **Earner Business ($95):** https://cards.barclaycardus.com/banking/cards/wyndham-rewards-earner-business-card/ — 15,000 anniv pts, auto Diamond
- **Earner ($0):** https://cards.barclaycardus.com/banking/cards/wyndham-rewards-earner-card/ — 7,500 anniv pts (requires $15k spend), auto Gold
- **Earner Plus reward rules PDF:** https://static.barclaycardus.com/servicing/1a630d39/img/wyf/rewardsTnC/WYF_GEN_BAR-8223-7_FINAL.pdf

## News & signal channels

- **Newsroom (HTML):** https://corporate.wyndhamhotels.com/news-releases/
- **Press RSS feed (seeded to Scout):** https://corporate.wyndhamhotels.com/feed/

## Section provenance (June 2026 authoring)

### Intro / award chart / how_to_spend
- 7,500 free-night floor, 750 + cash discounted floor — wyndhamhotels.com landing + T&C
- Flat three-tier 7,500 / 15,000 / 30,000 per bedroom — T&C ("7,500-30,000 per bedroom") + Upgraded Points / NerdWallet 2026
- April 2026 property tier reassignment — AwardWallet + Upgraded Points 2026
- Vacation Club resorts from 7,500/bedroom (2+ nights), Caesars redemptions, airline-miles conversion — T&C + redeem pages

### Tier benefits
- Thresholds Gold 5 / Platinum 15 / Diamond 40 nights; Titanium top tier (threshold not public, owner-linked) — member-levels page + Titanium Terms
- Accelerated earning +10% / +15% / +20% (Gold/Platinum/Diamond; Titanium excluded) — Upgraded Points + NerdWallet 2026; Titanium exclusion confirmed in Titanium Terms ("other than the Accelerated Earning Points")
- Caesars Rewards status match (30+ destinations), Avis President's Club, Suite Upgrades, Give Gold, Welcome Amenity — member-levels page
- Titanium 30,000-point annual bonus (awarded ~Feb 1 if Titanium as of Dec 1) — official Titanium Terms

### Free Night Certs
- All three Barclays Earner cards' anniversary points + status conferral — Barclays issuer pages (above)

### Tips & quirks (all verbatim from full T&C)
- 4-year expiry, 18-month inactivity cancellation ("never less than eighteen (18) consecutive months"), 60-month account termination, OTA exclusion, $25.00 Minimum Total Rate, Vacasa (Dec 1 2025), Echo Suites exclusion, Travelodge outside US/CA/MX, six-months program-termination notice

### Transfer partners (inbound — verified on issuer outbound data)
- **Capital One:** 1:1 — capitalone.com partner list
- **Citi ThankYou:** card-dependent (premium 1:1, standard 1:0.7), **+25% bonus active from 2026-05-18** — Citi authoritative transfer data

## Fact-check disagreements / resolutions

| Date | Claim | Issue | Resolution |
|---|---|---|---|
| 2026-06-02 | Titanium "All Diamond benefits" | Overstated | Corrected: Titanium gets Diamond benefits EXCEPT accelerated earning (per Titanium Terms) |
| 2026-06-02 | Titanium 30k bonus (extraction) | Behind lightbox | Confirmed verbatim via official Titanium Terms ("annual...bonus of 30,000 Wyndham Rewards points") |
| 2026-06-02 | Citi inbound flat 1:1 | Incomplete | Converted to tiered + active +25% promo, mirroring Citi authoritative outbound |
| 2026-06-02 | free_night_certs | Originally null | Authored 3 Barclays Earner cards from issuer pages |

## Cross-linking / followups

- **Co-brand cards:** Wyndham Rewards Earner / Earner Plus / Earner Business (Barclays) — author as full card pages later; they will auto-link to this program.
- **Per-property data (Decision Engine):** `hotel_properties` not yet seeded — blocked on `scripts/scrape-properties.mjs` (not built). Backlog.
- **Titanium qualification:** threshold not publicly published (appears partly owner/franchisee-linked per Titanium Terms "Entity Principal" language). Re-check if Wyndham publishes a consumer nights threshold.
