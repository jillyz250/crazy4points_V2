# American Airlines AAdvantage (carrier + program) — Source List

Reference list of every URL used to author the public page at `/programs/aa`. Per-program audit trail — not the intel sources DB table.

AA is one of the cases where the carrier and the loyalty program are inseparable in reader minds (unlike Alaska + Hawaiian + Atmos), so this single row carries both carrier and program content.

---

## Last reviewed
**May 2026** by Jill + Claude

## Official AA / AAdvantage sources

- **AA newsroom:** https://news.aa.com/
- **AAdvantage Loyalty Points + status:** https://www.aa.com/i18n/aadvantage-program/aadvantage-status/loyalty-point-rewards.jsp
- **AAdvantage T&Cs:** https://www.aa.com/i18n/aadvantage-program/aadvantage-terms-and-conditions.jsp
- **AAdvantage partner airlines:** https://www.aa.com/i18n/aadvantage-program/miles/partners/partner-airlines.jsp
- **Admirals Club access:** https://www.aa.com/i18n/travel-info/clubs/admirals-club-access.jsp
- **Admirals Club membership:** https://www.aa.com/i18n/travel-info/clubs/admirals-club-membership.jsp
- **Basic Economy fare rules:** https://www.aa.com/i18n/travel-info/experience/seats/basic-economy.jsp

## News & signal channels (Phase 6+ ingestion)

- **Press room RSS:** https://news.aa.com/feed/ — added to Scout 2026-05-02 with Firecrawl: on (bot-blocked from plain HTTP). Verify ingestion in 7 days; if no content, try `https://news.aa.com/news-releases-feed/` as fallback.
- **Investor relations:** https://americanairlines.gcs-web.com/

## Research articles cited (by section)

### Intro & program identity
- [Atmos Rewards Complete Guide — Frequent Miler](https://frequentmiler.com/alaska-atmos-rewards-complete-guide/) (cross-reference for oneworld 2026 state)
- [American Airlines guide — TPG](https://thepointsguy.com/loyalty-programs/american-airlines-aadvantage/)
- [American Airlines hubs — MilePro](https://milepro.com/american-airlines-hubs/)
- [9 hubs, 9 stories — AA Centennial newsroom](https://news.aa.com/centennial/our-stories/9-hubs-9-stories/)
- [American Airlines connect smaller cities 2026 — Simple Flying](https://simpleflying.com/american-airlines-connect-smaller-cities-world-15-new-routes-2026/)

### Loyalty Points & status
- [Loyalty Points official page — aa.com](https://www.aa.com/i18n/aadvantage-program/aadvantage-status/loyalty-point-rewards.jsp) (May 2026 verified)
- [AAdvantage status tiers comparison 2026 — Milesmate](https://milesmate.io/blog/aadvantage-status-tiers-comparison-2026)
- [AAdvantage 2026 status freeze — AwardFares blog](https://blog.awardfares.com/aadvantage-2026-status-freeze/)
- [AAdvantage Platinum guide — OMAAT](https://onemileatatime.com/guides/american-aadvantage-platinum-status/)

### Transfer partners
- [Citi ThankYou transfer partners 2026 — Upgraded Points](https://upgradedpoints.com/credit-cards/citi-thankyou-points-transfer-partners/) (confirmed Citi-AA July 27 2025 launch + 1:1 premium / 1:0.7 no-AF ratios)
- [Citi points transfer partners complete guide — Pointscrowd](https://www.pointscrowd.com/blog/citi-points-transfer-partners-the-complete-guide/)
- [Transfer Citi points to American on more cards — TPG](https://thepointsguy.com/news/transfer-citi-points-on-more-cards-to-american-airlines/)
- [Bilt transfer partners — Upgraded Points](https://upgradedpoints.com/credit-cards/bilt-rewards-transfer-partners/)
- [Bilt's transfer partners — Bilt support](https://support.biltrewards.com/hc/en-us/articles/19086448638989-Bilt-s-Transfer-Partners)
- [Marriott to AA transfer — WalletHub](https://wallethub.com/answers/rp/transfer-marriott-points-to-american-airlines-1000698-2140706352/)

### Award pricing & sweet spots
- [AA award charts (TPG dropping) — TPG](https://thepointsguy.com/news/american-airlines-drops-award-charts/) (dynamic-pricing 2023 history)
- [AA dynamic award pricing — OMAAT](https://onemileatatime.com/news/american-aadvantage-dynamic-award-pricing/)
- [AA AAdvantage award charts (current) — Award Travel Finder](https://awardtravelfinder.com/award-charts/american-airlines)
- [AA AAdvantage guide — AwardFares blog](https://blog.awardfares.com/aadvantage-guide/)
- [AA Web Special awards guide — TPG](https://thepointsguy.com/guide/american-web-special-awards/)
- [AA Web Specials launch — AwardWallet](https://awardwallet.com/blog/aa-launches-discounted-economy-web-specials/)
- [AA off-peak awards guide — TPG](https://thepointsguy.com/guide/american-airlines-off-peak-awards/)
- [AA Hawaii sweet spot guide — TPG](https://thepointsguy.com/guide/american-airlines-sweet-spot-hawaii/)
- [AA AAdvantage sweet spots — TPG](https://thepointsguy.com/airline/sweet-spots-american-airlines-aadvantage/)
- [Best ways to book Etihad first class — Upgraded Points](https://upgradedpoints.com/travel/airlines/best-ways-to-book-etihad-first-class/)
- [Best ways to book Cathay Pacific first class — Upgraded Points](https://upgradedpoints.com/travel/airlines/best-ways-to-book-cathay-pacific-first-class/)
- [AAdvantage Asia premium availability — View From The Wing](https://viewfromthewing.com/why-aadvantage-members-struggle-to-book-asia-premium-cabin-awards-and-why-its-not-all-americans-fault/)

### Mile expiry / pooling
- [Do AAdvantage miles expire? 2026 policy — Miles Market](https://www.themilesmarket.com/post/do-american-airlines-aadvantage-miles-expire-the-2026-policy)
- [AAdvantage mile expiration — TPG](https://thepointsguy.com/news/american-airlines-aadvantage-miles-expiration-policy/)
- [AAdvantage mile expiration — AwardWallet](https://awardwallet.com/airlines/american-aadvantage/do-american-airlines-miles-expire/)
- [Airlines that allow family pooling — TPG](https://thepointsguy.com/loyalty-programs/airlines-that-allow-family-pooling/)
- [Airlines that pool points — Upgraded Points](https://upgradedpoints.com/travel/airlines-hotels-pool-points-miles/)

### Lounge access
- [Admirals Club access — aa.com](https://www.aa.com/i18n/travel-info/clubs/admirals-club-access.jsp)
- [Admirals Club ultimate guide — TPG](https://thepointsguy.com/airline/ultimate-guide-american-airlines-admirals-club-access/)
- [Flagship Lounge access — NerdWallet](https://www.nerdwallet.com/travel/learn/how-to-access-american-airlines-flagship-lounges)
- [Citi/AAdvantage Executive Mastercard — Citi](https://www.citi.com/credit-cards/citi-aadvantage-executive-world-elite-mastercard)

### Co-brand cards (Barclays -> Citi consolidation)
- [Barclays AAdvantage Aviator cards moving to Citi — US News](https://money.usnews.com/credit-cards/articles/barclays-aadvantage-aviator-cards-flying-over-to-citi-what-cardholders-should-know)
- [Barclays Aviator to Citi April 24 — View From The Wing](https://viewfromthewing.com/barclays-aadvantage-cards-convert-to-citi-april-24-for-now-you-keep-legacy-perks-and-add-citi-benefits/)
- [Barclays Aviator to Citi transition — Frequent Miler](https://frequentmiler.com/barlcays-aviator-to-citi-transition-april-2026-what-we-know-and-what-we-dont/)
- [American AAdvantage Barclays cards transitioning to Citi — OMAAT](https://onemileatatime.com/news/american-aadvantage-barclays-cards-transitioning-citi-discontinued/)
- [Best ways to earn Loyalty Points — Upgraded Points](https://upgradedpoints.com/travel/airlines/best-ways-to-earn-aadvantage-loyalty-points/)

### Hawaiian to oneworld + alliance context
- [Aloha! oneworld welcomes Hawaiian Airlines — oneworld official](https://www.oneworld.com/news/oneworld-welcomes-hawaiian-airlines)
- [Hawaiian Airlines joining oneworld — OMAAT](https://onemileatatime.com/news/hawaiian-airlines-oneworld/)
- [Hawaiian Airlines joins oneworld — AwardWallet](https://awardwallet.com/news/airlines/hawaiian-airlines-joining-oneworld/)
- [Hawaiian oneworld debut — TPG](https://thepointsguy.com/news/hawaiian-airlines-oneworld-debut-airport-cabin-upgrades/)

### JetBlue Northeast Alliance
- [Northeast Alliance ending — TPG](https://thepointsguy.com/news/northeast-alliance-ending-what-to-know/)
- [Supreme Court Northeast Alliance — Live and Let's Fly](https://liveandletsfly.com/supreme-court-norheast-alliance/)
- [Northeast Alliance talks break down — TPG](https://thepointsguy.com/news/northeast-alliance-talks-break-down-american-airlines-jetblue/)

### Basic Economy LP elimination
- [American Airlines Basic Economy miles — CNBC (2025-12-18)](https://www.cnbc.com/2025/12/18/american-airlines-basic-economy-miles.html) — confirmed BE earns NEITHER miles NOR LPs after Dec 17 2025
- [AA Basic Economy no miles — AwardFares blog (2025-12-22)](https://awardfares.com/blog/aa-basic-economy-no-miles/)

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution + source |
|---|---|---|---|
| 2026-05-02 | "Citi ThankYou Points do NOT transfer to AAdvantage" (initial Step 1 research output) | User questioned: "I thought citi points transferred to American?" | **WRONG.** Citi TYP added AAdvantage as transfer partner July 27, 2025. Premium Citi cards (Strata Premier/Elite, Prestige) at 1:1; no-AF Citi cards at 1:0.7. Verified via Upgraded Points 2026 guide + PointsCrowd 2026 guide + TPG. **Major framing change**: AA went from "thinnest transferable pipeline" to "Citi-exclusive flexible currency partnership" — actually a strategic on-ramp. Updated intro + transfer_partners + quirks. Lesson: per-currency checklist required during Step 1 research (saved as `feedback_transfer_partner_checklist.md`). |
| 2026-05-02 | "Basic Economy still earns AAdvantage miles" (initial Step 2 draft, only LP earning eliminated) | ChatGPT fact-check cited Forbes saying BE earns neither miles nor LPs | **Draft was wrong.** Verified via CNBC 2025-12-18 + AwardFares 2025-12-22 + aa.com Basic Economy fare page text: "Basic Economy fare tickets bought on or after 12:00 a.m. CT on December 17, 2025, will not earn AAdvantage® miles or Loyalty Points." Status members and primary co-brand cardholders retain limited exemptions on AA-marketed/operated US/Canada flights. Updated intro + quirks. |
| 2026-05-02 | "World of Hyatt transfers points to AAdvantage at 2.5:1 with 5K bonus per 50K" (initial research) | User pasted Hyatt's official airline-partners page; the page only shows (a) earn-per-stay airline-mile preference, (b) redeem 5,000 points for AAdvantage status-for-a-day. **No points-to-miles transfer exists.** | **Removed Hyatt from transfer_partners JSON entirely.** Final list is 3 partners: Citi ThankYou, Bilt, Marriott Bonvoy. Saved feedback memory `feedback_hyatt_aa_transfer_myth.md`. Lesson: hotel-to-airline transfer claims must be verified on the hotel program's own canonical page, not blog aggregators. |
| 2026-05-02 | First Copilot fact-check refused to web-search ("I can't perform real web search... I have to stop here") | Required-method-stop-if-can't-search prompt instruction triggered refusal | Pivoted to Claude's own WebSearch tool for verification. Saved feedback `feedback_factcheck_copilot_only.md` (later corrected: both ChatGPT and Copilot can be flaky; Claude self-fact-check via WebSearch is the most reliable path). ChatGPT subsequently DID web-search and provided usable verdicts on the same prompt. |

## Cross-link notes (per Step 8)

- **Loyalty program:** AAdvantage IS the loyalty program (single-row carrier+program model). Transfer partners + tier benefits + sweet spots + lounge access all on this row.
- **Sister carriers (oneworld + transferable in):** Alaska (`/programs/alaska`), Hawaiian (`/programs/hawaiian`), Atmos (`/programs/atmos`) — all oneworld now. JAL, Cathay, Qatar, Etihad, Qantas, BA, Iberia, Finnair, Aer Lingus, Royal Jordanian, Royal Air Maroc, Fiji, Malaysia.
- **Co-brand credit cards:** Citi/AAdvantage Executive World Elite, Citi/AAdvantage Platinum Select, Citi/AAdvantage Globe (replacing Aviator Silver path), CitiBusiness/AAdvantage Platinum Select. Barclays Aviator portfolio migrated to Citi April 24, 2026. When credit card section starts, those cards link back here automatically.
- **Transfer-in partners:** Citi ThankYou (`/programs/citi-thankyou`), Bilt (`/programs/bilt`), Marriott Bonvoy (`/programs/marriott-bonvoy`). Citi + Marriott seeded as skeleton rows on 2026-05-02 (migration 068).

## Notes / followups

- **Verify on next review:** close-in booking fee ($75 within 21 days for non-elites historically) — confirm current 2026 number from aa.com fees page
- **Verify on next review:** specific Etihad A380 First Apartment availability stretches in 2026 — historically wide-open but anecdotal
- **Watch for:** Hawaiian PSS cutover impact on AA-Hawaiian codeshare booking (April 2026 was when HA airline code retired during AS PSS cutover)
- **Watch for:** Citi TYP -> AA promotional bonuses (transfer bonuses are a known Citi tactic — would be worth flagging in transfer_partners notes when active)
- **Watch for:** further Aviator-to-Citi transition mechanics + retention of legacy Barclays perks beyond the announced "transition period"
- **AA-specific quirk to monitor:** Web Special cancellation fees stayed removed in 2026; if AA reintroduces them, update intro + how_to_spend
- **Co-brand authoring backlog:** when Citi + Barclays cards get authored as their own /cards rows, link back from this page (the "Cards that earn into AAdvantage" block on the public page auto-renders from credit_cards.co_brand_program_id)
