# Melia Rewards — Source List

Reference list of every URL used to author the public page at `/programs/melia`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored)

## Official program sources (primary)

- **Program overview:** https://www.melia.com/en/meliarewards
- **Terms & Conditions (Dec 2025 update):** https://www.melia.com/en/meliarewards/terms-conditions (scraped 2026-06-17 — authoritative for tier thresholds, earn rates, expiry, benefit conditions, transfer limits, excluded hotels)
- **Air Europa SUMA — Melia partner page:** https://www.aireuropa.com/us/en/aea/suma/our-program/our-partners/hotels/melia.html (confirms 3 Melia = 1 SUMA; bidirectional)
- **Vueling Club — Melia partner page:** https://www.vueling.com/en/vueling-club/partners/melia-hotels-international (confirms Vueling transfers Melia points at 100:30)
- **Iberia Club — Melia Hotels page:** https://iberiaclubmagazine.iberia.com/en/collect-more-avios/hotels/melia-hotels-international

## Secondary sources (blogs, 2025-2026)

- Milesopedia: https://milesopedia.com/en/reward-program/meliarewards/
- Upgraded Points: https://upgradedpoints.com/travel/hotels/meliarewards-loyalty-program/
- Turning Left For Less: https://www.turningleftforless.com/melia-rewards-guide/
- Points N Places: https://www.pointsnplaces.com/hotels-and-loyalty/melia/melia-rewards-complete-guide/
- Head for Points forum: https://www.headforpoints.com/forums/topic/melia-points-expiry/

## Key facts sourced + confidence level

| Claim | Source | Confidence |
|---|---|---|
| 4 tiers: White, Silver, Gold, Platinum | T&C section 10 | HIGH (official) |
| White: automatic on join | T&C section 10.1 | HIGH (official) |
| Silver: 2 stays OR 5 nights OR 10,000 hotel pts | T&C section 10.1 | HIGH (official) |
| Gold: 15 stays OR 30 nights OR 60,000 hotel pts | T&C section 10.1 | HIGH (official) |
| Platinum: 30 stays OR 50 nights OR 150,000 hotel pts | T&C section 10.1 | HIGH (official) |
| 13-month re-qualification window | T&C section 10.2 | HIGH (official) |
| Earn rates: White 10 / Silver 11 / Gold 13 / Platinum 14 pts per euro or dollar | T&C section 11.1 | HIGH (official) |
| Silver+: free breakfast for accompanying guest (room-only, Melia-managed restaurant) | T&C section 11.1 + 11.2(d) | HIGH (official) |
| Gold+: late checkout (resort 2pm, urban 4pm), priority arrival, 3x20% vouchers | T&C section 11.1 | HIGH (official) |
| Platinum: one-category room upgrade at check-in (subject to availability) | T&C section 11.1 + 11.2(e) | HIGH (official) |
| Platinum: VIP area access (Melia H&R, Gran Melia, Paradisus) — no breakfast included by default | T&C section 11.2(h) | HIGH (official) |
| Platinum: 2 airport lounge visits/year at 1,200+ airports | T&C section 11.2(g) | HIGH (official) |
| Points expire after 12 months of inactivity | T&C section 15 | HIGH (official) |
| Transfer max 250,000 pts/year to other programmes | T&C section 14 | HIGH (official) |
| Minimum 2,000 pts per transfer | T&C section 14 | HIGH (official) |
| Promotional points cannot be transferred | T&C section 14 | HIGH (official) |
| Iberia/BA/Vueling/Aer Lingus: 100 Melia = 30 Avios | Multiple third-party sources + Vueling/Iberia partner pages | MEDIUM-HIGH (confirmed at partner pages) |
| Air Europa SUMA: 3 Melia = 1 SUMA mile (bidirectional) | Air Europa official partner page | HIGH (official) |
| Copa ConnectMiles: 6 Melia = 1 ConnectMile | Multiple third-party sources | MEDIUM (not confirmed from Copa official page) |
| Award pricing ranges (5K-150K pts/night by brand) | Milesopedia + Upgraded Points | MEDIUM (third-party estimates, not official) |
| No US credit card currencies transfer to Melia Rewards | Transfer partner matrix research 2026 | HIGH (by absence from all major issuer partner lists) |
| Platinum for Life window closed (ended 2023) | T&C section 10.4 + date math | HIGH (official qualification dates) |

## Notes / followups

- **Award chart is dynamic** — Melia does not publish a static points-per-night chart. The ranges cited on the page are third-party estimates; refresh if a reader reports stale numbers.
- **Vietnam Airlines partnership** — a July 2025 article (enews.vietnamairlines.com) mentioned a new Melia/Vietnam Airlines partnership. No transfer ratio confirmed from official sources. Not included in transfer_partners_outbound. Verify at melia.com/meliarewards partners section on next refresh.
- **Singapore Airlines KrisFlyer** — a Singapore Air promotions URL appeared in WebSearch suggesting a Melia/KrisFlyer earn relationship (earn KF miles on Melia stays), but no direct point-transfer confirmed. Treat as "earn KF miles on stay" not a Melia → KF transfer.
- **Copa ConnectMiles ratio** — 6:1 sourced from third-party blogs only. Confirm from Copa or Melia official page on next refresh.
- **Circle by Melia** — paid subscription club (circle.melia.com), separate from MeliáRewards tiers, grants auto-Silver status. Mentioned in quirks. Not a loyalty program page topic.
- **hotel_properties not seeded** — Melia has 350+ properties across 7 brands. Decision Engine will not surface Melia properties until scrape-properties.mjs backlog is addressed.

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Dynamic award pricing ranges | No official chart published; ranges from third-party blogs only | Hedged as third-party estimates throughout; award_chart explicitly notes they are not official Melia figures |
| 2026-06-17 | Platinum for Life closure | T&C section 10.4 defines the qualification (10 consecutive periods from Jan 2013 + 500 nights); the 10th period would have closed by Jan 2023 | Framed as "window ended in 2023" with "as of mid-2026" hedge per llm-audit |
