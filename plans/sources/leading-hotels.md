# Leading Hotels of the World (Leaders Club) — Source List

Reference list of every URL used to author the public page at `/programs/leading-hotels`. Per-program audit trail. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored)

## Official program sources (primary — scraped via research-program.mjs)

- **Leaders Club — How It Works (earning + redemption + Sterling):** https://www.lhw.com/leaders-club/how-it-works
- **Leaders Club — Benefits Comparison (Club vs Sterling, SIXT tiers):** https://www.lhw.com/leaders-club/compare-benefits
- **Leaders Club — Benefits overview:** https://www.lhw.com/leaders-club/benefits
- **Leaders Club — FAQs / T&C (expiry, buy points, transfer-in, pre-arrival upgrade rules):** https://www.lhw.com/leaders-club/faqs
- **Leaders Club — About:** https://www.lhw.com/leaders-club/about
- **Leaders Club Terms & Conditions anchor:** https://www.lhw.com/terms-and-conditions#lc-tcs
- **Membership signup / enroll:** https://www.lhw.com/account/membership-signup
- **SIXT status match landing:** https://www.sixt.com/leadersclub_statusmatch
- **2024 free-membership press release:** https://www.lhw.com/press-center/0624_Leaders_Club_Complimentary
- **Press center (newsroom):** https://www.lhw.com/press-center

## Transfer-partner source (issuer-page rule)

- **Citi ThankYou — Points Transfer partners (confirms Leaders Club as a live Citi hotel partner):** https://www.thankyou.com/cms/thankyou/help.page?pageName=help — pasted 2026-06-17. Page lists Leaders Club under Hotel partners (alongside Accor, Choice, Preferred Hotels, Wyndham); numeric ratio is behind sign-on. Ratio already modeled on the `citi` currency row: premium Citi 1:0.2, no-AF Citi 1:0.14 (per-card tiers). Renders on this page via getInboundTransferSources().

## Research articles cited (by section)

### Redemption value / sweet spots
- [Best Uses of Leaders Club Points — AwardWallet](https://awardwallet.com/hotels/leading-hotels-of-the-world/) — ~8c/pt typical, up to ~9.4c at sweet spots; Setai Miami arbitrage example
- [Buy LHW Leaders Club Points with up to 100% Bonus (6c each) — AwardWallet](https://awardwallet.com/hotels/buy-leaders-club-points/)
- [LHW points sale up to 100% bonus — Frequent Miler](https://frequentmiler.com/leading-hotels-of-the-world-points-sale/) — list price ~12c/pt
- [Buy Leaders Club Points 100% Bonus (until June 12) — Upgraded Points](https://upgradedpoints.com/news/buy-leaders-club-points/)

### Transfer bonus
- [Citi ThankYou to LHW Leaders Club 25% bonus Apr 19 - May 16 2026 — LoyaltyLobby](https://loyaltylobby.com/2026/04/19/citi-thankyou-to-lhw-leaders-club-25-conversion-bonus-april-19-may-16-2026/)
- [Transfer Citi Points to LHW with 25% Bonus: Worth It? — OMAAT](https://onemileatatime.com/deals/citi-lhw-transfer-bonus/)

### Program overview / tiers
- [Leaders Club guide — NerdWallet](https://www.nerdwallet.com/travel/learn/leading-hotels-of-the-world-leaders-club-guide)
- [LHW Leaders Club loyalty program review — Upgraded Points](https://upgradedpoints.com/travel/hotels/leading-hotels-of-the-world-leaders-club-loyalty-program/)
- [LHW Leaders Club guide — OMAAT](https://onemileatatime.com/guides/leading-hotels-of-the-world-leaders-club/)
- [Leaders Club — The Luxury Travel Expert](https://theluxurytravelexpert.com/leaders-club/)

### 2024 program change (devaluation context)
- [Why the new LHW Leaders Club is a massive devaluation — World Travel Adventurers](https://worldtraveladventurers.com/why-the-new-leading-hotels-of-the-world-leaders-club-is-a-massive-devaluation/)

## Social channels (for ongoing signal monitoring)

- **Press center:** https://www.lhw.com/press-center (403 to plain HTTP; Firecrawl required)
- **Instagram:** @leadinghotels — https://www.instagram.com/leadinghotels/
- **X / Twitter:** @LeadingHotels — https://twitter.com/LeadingHotels
- **YouTube:** https://www.youtube.com/user/LeadingHotels

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution + source |
|---|---|---|---|
| 2026-06-17 | "Aurelian" invite-only tier | Blogs (NerdWallet/USNews) cite a third invite-only tier ~$10k spend; official compare page shows only Club + Sterling | DROPPED from the page — not published by LHW. Revisit if LHW documents it officially. |
| 2026-06-17 | Citi no-AF transfer ratio | Blogs cite 1:0.175 for no-AF Citi; our DB models 1:0.14 (0.2 x 0.7, consistent with all other Citi standard partners) | Kept DB value (1:0.14). Citi's public page does not publish the numeric ratio; no-AF Citi cards are pool_to_unlock so the ratio does not surface on card pages anyway. |
| 2026-06-17 | Year the USD 175 fee was dropped | First draft said "rebuilt in 2024"; actual fee elimination was July 2021 | CORRECTED (migration 466) to "dropped its old USD 175 annual fee back in 2021." Sources: Head for Points + Business Traveller, both 2021-07-09. Points earn/redeem model rolled out later (exact date not officially pinned). |

## Notes / followups

- Dynamic redemption: no chart to monitor for category devaluations; watch instead for changes to the ~8c/pt redemption value and the buy-points list price (~12c).
- No co-brand credit card exists; only inbound transfer partner is Citi ThankYou.
- Watch for Citi 25% transfer-bonus cadence (recurs periodically).
- `hotel_properties` not seeded — LHW property finder scraping deferred (see Step 7.6 / scrape-properties.mjs backlog). Decision Engine will not surface LHW properties until seeded.
