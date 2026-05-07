# JetBlue Airways + TrueBlue (carrier + program) — Source List

Reference list of every URL used to author the public page at `/programs/jetblue`. Per-program audit trail — not the intel sources DB table.

JetBlue is a single-row carrier+program (TrueBlue is exclusive to JetBlue metal + the new Blue Sky / United partnership + four other partner-redemption carriers). No alliance affiliation, but `alliance: 'other'` is set in the database to signal the Blue Sky bilateral partnership in the hero pill.

---

## Last reviewed
**May 2026** by Jill + Claude

## Official JetBlue / TrueBlue sources

- **JetBlue newsroom (no RSS, bot-blocked):** https://news.jetblue.com/latest-news
- **Investor relations:** https://ir.jetblue.com/
- **Airline partners listing:** https://www.jetblue.com/airline-partners
- **TrueBlue program page:** https://www.jetblue.com/trueblue
- **Points pooling rules:** https://www.jetblue.com/help/points-pooling
- **A-List / Mosaic tier pages:** https://www.jetblue.com/rapidrewards/a-list/ (legacy URL pattern; new Mosaic 1/2/3/4 docs at jetblue.com/rapid-rewards/tiers)
- **Mint product page:** https://www.jetblue.com/en/find-flights-in-mint
- **TrueBlue T&C:** https://www.jetblue.com/help/terms-of-the-rapid-rewards-program

## News & signal channels (Phase 6+ ingestion)

- **Newsroom HTML scrape (no RSS):** https://news.jetblue.com/latest-news — added to Scout 2026-05-04 with Firecrawl: on. Verify ingestion in 7 days. Same Q4-platform CDN block as AA newsroom.
- **JetBlue press release archive:** https://news.jetblue.com/latest-news/press-releases
- **Investor news (10-K, 10-Q, 8-K filings):** https://ir.jetblue.com/news/news-details/

## Research articles cited (by section)

### Intro & program identity
- [JetBlue 2026 hubs / focus cities snapshot — TPG](https://thepointsguy.com/news/snapshot-a-look-at-jetblue-hubs-fleet-focus-city-by-the-numbers/)
- [JetBlue destinations — Wikipedia](https://en.wikipedia.org/wiki/JetBlue) (covers 2024-2026 corporate timeline)
- [JetBlue announces termination of merger with Spirit (March 2024)](https://news.jetblue.com/latest-news/press-release-details/2024/JetBlue-Announces-Termination-of-Merger-Agreement-with-Spirit/default.aspx)
- [Mint Europe expansion (Barcelona launch April 2026) — JetBlue IR press release](https://ir.jetblue.com/news/news-details/2026/JetBlue-Expands-Transatlantic-Service-from-Boston-with-New-Flights-to-Barcelona-Starting-Today/default.aspx)
- [JetBlue European routes 2026 — Simple Flying](https://simpleflying.com/jetblue-european-routes-2026/)
- [JetBlue + Barcelona/Milan — TPG](https://thepointsguy.com/news/jetblue-new-european-routes-barcelona-milan/)

### Mosaic tier overhaul (Feb 1, 2026)
- [JetBlue Mosaic Elite Status Changes 2026 — Upgraded Points](https://upgradedpoints.com/news/jetblue-mosaic-elite-status-changes-2026/)
- [JetBlue elite status worth — TPG](https://thepointsguy.com/guide/what-is-jetblue-elite-status-worth/)
- [Mosaic Elite Status Changes — AwardWallet](https://awardwallet.com/news/jetblue-trueblue/mosaic-elite-status-changes/)
- [JetBlue family elite status qualification — OMAAT](https://onemileatatime.com/news/jetblue-trueblue-family-elite-status-qualification/)
- [JetBlue Mosaic 2026 — AwardFares](https://blog.awardfares.com/jetblue-mosaic-2026/)
- [JetBlue elite 2026 updates — NerdWallet](https://www.nerdwallet.com/travel/learn/jetblue-elite-2026-updates) (cited by Copilot for Mosaic 1 bag-cut confirmation)

### Blue Sky partnership with United
- **Phase 1 launch (Oct 23, 2025):** [JetBlue press release — Blue Sky Takes Flight](https://news.jetblue.com/latest-news/press-release-details/2025/Blue-Sky-Takes-Flight-JetBlue-and-United-Loyalty-Members-Can-Now-Earn-and-Redeem-Across-Both-Airlines/default.aspx)
- [JetBlue + United Blue Sky launch — TPG](https://thepointsguy.com/news/united-airlines-jetblue-blue-sky-partnership-launch/)
- [Blue Sky from United's side](https://www.united.com/en/us/fly/mileageplus/jetblue.html)
- [Blue Sky partnership — OMAAT](https://onemileatatime.com/news/jetblue-united-blue-sky-partnership/)
- [Blue Sky reaches new altitude (Phase 2 cross-airline sales) — JetBlue press release](https://news.jetblue.com/latest-news/press-release-details/2026/Blue-Sky-Reaches-New-Altitude-JetBlue-and-United-Begin-Offering-Sales-Across-Both-Airlines/default.aspx)
- [JetBlue-United benefits live — LoyaltyLobby (Oct 23, 2025)](https://loyaltylobby.com/2025/10/23/jetblue-united-airlines-select-frequent-flier-benefits-now-live/)

### Transfer partners
- [TrueBlue official transfer-points page](https://trueblue.jetblue.com/transfer-points)
- [JetBlue transfer partners — NerdWallet](https://www.nerdwallet.com/travel/learn/guide-to-jetblue-travel-partners-earning-and-redeeming-points)
- [JetBlue TrueBlue transfer partners — Award Travel Finder](https://awardtravelfinder.com/transfer-partners/jetblue-trueblue)
- [Bilt adds Southwest as partner — TPG](https://thepointsguy.com/news/bilt-adds-southwest-transfer-partner/) (Bilt does NOT transfer to JetBlue; included for completeness)
- [Bilt transfer partners support article](https://support.biltrewards.com/hc/en-us/articles/19086448638989-Bilt-s-Transfer-Partners)
- [JetBlue Capital One transfer partner — Upgraded Points](https://upgradedpoints.com/news/jetblue-capital-one-transfer-partner/)
- [JetBlue + Wells Fargo Rewards transfer partner (Oct 27, 2025) — AwardWallet](https://awardwallet.com/news/wells-fargo-rewards/jetblue-trueblue-transfer-partner/)

### Award pricing & valuation
- [TrueBlue points value — TPG monthly valuations](https://thepointsguy.com/loyalty-programs/monthly-valuations/) (May 2026: 1.35 cpp)
- [TrueBlue 2026 valuation guide — Miles Market](https://www.themilesmarket.com/post/what-are-jetblue-trueblue-points-worth-2026-valuation-guide)
- [TrueBlue points worth — Frequent Miler](https://frequentmiler.com/what-are-jetblue-trueblue-points-worth/)
- [TrueBlue points worth — NerdWallet](https://www.nerdwallet.com/travel/learn/how-much-are-my-jetblue-trueblue-points-worth)

### Mint (premium cabin)
- [JetBlue Mint product page](https://www.jetblue.com/en/find-flights-in-mint)
- [Mint Studio coverage — TPG](https://thepointsguy.com/loyalty-programs/jetblue-trueblue-program/)

### Mile expiry, pooling
- [Do JetBlue points expire? — AwardWallet](https://awardwallet.com/airlines/jetblue-trueblue/do-jetblue-points-expire/)
- [Points pooling official — JetBlue help](https://www.jetblue.com/help/points-pooling)
- [TrueBlue points pooling guide — TPG](https://thepointsguy.com/loyalty-programs/jetblue-points-pooling-program/)

### Co-brand cards (Barclays)
- [JetBlue Premier card — Barclays](https://cards.barclaycardus.com/banking/cards/jetblue-premier-card/)
- [JetBlue Plus card — Barclays](https://cards.barclaycardus.com/banking/cards/jetblue-plus-card/)
- [JetBlue and Barclays enhance Premier card (April 2026 refresh)](https://news.jetblue.com/latest-news/press-release-details/2026/JetBlue-and-Barclays-Enhance-Airlines-Popular-Premier-Card-with-New-Benefits-and-Expanded-Rewards/default.aspx)
- [JetBlue Premier card adds perks 2026 — Upgraded Points](https://upgradedpoints.com/news/jetblue-premier-card-adds-perks-2026/)

### TrueBlue Subscriptions ("Points On Repeat") — March 31, 2026
- [Points On Repeat subscriptions launch — JetBlue press release](https://news.jetblue.com/latest-news/press-release-details/2026/JetBlue-Expands-TrueBlue-with-Points-On-Repeat-Subscriptions-and-the-Ability-to-Redeem-Points-for-Travel-Extras/default.aspx)
- [Subscriptions extra redemptions — Adept Travel](https://adept.travel/news/2026-04-02-jetblue-trueblue-subscriptions-extra-redemptions)

### BlueHouse lounges
- [BlueHouse JFK lounge opens December 2025 — JetBlue press release](https://news.jetblue.com/latest-news/press-release-details/2025/JetBlue-Opens-BlueHouse-Its-New-Premium-Lounge-at-JFK-Airport/default.aspx)
- [JetBlue airport lounges — OMAAT](https://onemileatatime.com/news/jetblue-airport-lounges/)

### Recent partner changes (2025-2026)
- [JetBlue-Hawaiian partnership ending — OMAAT](https://onemileatatime.com/news/hawaiian-jetblue-end-partnership/)
- [JetBlue-Hawaiian 13-year partnership ending — TravelPulse](https://www.travelpulse.com/news/airlines-airports/jetblue-and-hawaiian-airlines-to-end-13-year-partnership-this-fall)
- [Japan Airlines partnership ending March 31, 2026 — LoyaltyLobby](https://loyaltylobby.com/2025/12/26/japan-airlines-jetblue-partnership-ends-on-march-31-2026/)
- [JAL official partnership end notice](https://www.jal.co.jp/jp/en/info/2025/jmb/b6/)
- [JSX partnership ends Feb 28, 2026 — LoyaltyLobby](https://loyaltylobby.com/2026/01/17/jetblues-partnership-with-jsx-ends-on-february-28-2026/)
- [JSX partnership end — TPG](https://thepointsguy.com/news/jetblue-airways-jsx-end-loyalty-pact/)
- [JSX partnership ending — AwardWallet](https://awardwallet.com/news/jetblue-trueblue/jsx-partnership-ending/)
- [Japan Airlines partnership ending — TPG](https://thepointsguy.com/news/jetblue-japan-airlines-partnership-ending/)
- [China Airlines redemption added April 29, 2026 — JetBlue press release](https://news.jetblue.com/latest-news/press-release-details/2026/JetBlue-Adds-Redemption-Benefits-to-China-Airlines-Partnership/default.aspx) ([BusinessWire mirror](https://www.businesswire.com/news/home/20260429082674/en/JetBlue-Adds-Redemption-Benefits-to-China-Airlines-Partnership))

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution + source |
|---|---|---|---|
| 2026-05-04 | "Awards start as low as 500 points one-way" — initial draft | User pushback: technically true per JetBlue marketing ("Award flights start as low as 500 points") but practically misleading; revenue-based pricing means a sub-$10 cash fare is needed to actually redeem at 500 | **Removed claim entirely.** No reader will encounter 500-point awards in practice. Quirks now reads "Most domestic awards land in the 5,000-15,000 point range." |
| 2026-05-04 | "Active partner award redemptions: Aer Lingus, Etihad, Qatar, Singapore, Icelandair, Cape Air, China Airlines" — initial how_to_spend draft | User pushback on Aer Lingus specifically; spawned a per-partner verification round | **5 confirmed redemption partners only**: United (Blue Sky), China Airlines, Etihad, Qatar Airways, Cape Air. **Earn-only**: Singapore Airlines, Icelandair. **Codeshare-only (no points)**: Aer Lingus. Sources: [JetBlue press releases per partner](https://news.jetblue.com/latest-news), [NerdWallet 2026 partner guide](https://www.nerdwallet.com/travel/learn/guide-to-jetblue-travel-partners-earning-and-redeeming-points), [Frequent Miler TrueBlue Guide](https://frequentmiler.com/jetblue-trueblue-guide/). Updated all six sections of the page (intro, how_to_spend, sweet_spots, lounge_access, quirks, award_chart) to use the verified 5-partner list. |
| 2026-05-04 | "Spirit liquidated 2025" — initial draft framing | ChatGPT couldn't verify "liquidation" specifically; only the Jan 2024 court block + March 2024 termination | **User confirmed Spirit announced May 2026 it will cease to exist.** Updated to "A federal judge blocked the merger and the carriers terminated the agreement; in May 2026 Spirit announced it will cease to exist." More accurate than "liquidated." |
| 2026-05-04 | "Chase is the best transfer ratio to TrueBlue" — initial transfer_partners notes | User pushback: Chase, Citi ThankYou, and Wells Fargo are all 1:1 (three-way tie) | **Stripped "best" comparative.** Notes now describe each as "Tied at 1:1 with [the other two]" rather than singling out Chase. Memory rule: avoid "best/only/first" comparative claims (per `feedback_confidence_tag_drafts.md`). |
| 2026-05-04 | "The most aggressive sustainable redemption-side multiplier in any US program" — Trailblazer + cardholder 20% rebate stack | User questioned the comparative claim; verified the 20% mechanic is real (per JetBlue press release) but the comparison is unbacked | **Kept the verified 20% mechanic** (it's directly from JetBlue's Points On Repeat press release: "JetBlue Plus, Premier and Business cardmembers can combine their existing 10 percent redemption bonus with subscription benefits, earning up to 20 percent of points back on every redemption after taking the award flight"). **Stripped the editorial comparative** — softened to "A genuinely strong redemption-side return for engaged subscribers + cardholders." |
| 2026-05-04 | Hero "premium-ish" framing | User pushback: overstates JetBlue's positioning | Reworked intro lead to "hybrid carrier — low-fare-first with surprisingly nice touches the legacies still don't bother with" — better captures actual brand identity. |
| 2026-05-04 | Three external fact-checkers (ChatGPT, Copilot, Google AI) flagged most claims as ❓ UNVERIFIED — same snippet-blindness pattern as Southwest | ChatGPT/Copilot/Google AI couldn't surface 2026-dated sources for many evergreen claims (points-don't-expire, transfer ratios, Mosaic structure, Mint Europe routes) even though they're documented at JetBlue's own press releases | **Pattern recognized: same as Southwest 2.0.** External LLMs hit stale/cached pages or generic search snippets; JetBlue press releases (cited above) are authoritative. Load-bearing facts confirmed by ChatGPT (Mosaic structure, Family Tiles, Mosaic 1 bag cut, Blue Sky Phase 1, NEA dead). The unverified-but-real items were resolved via my own WebFetch verifier + JetBlue press release URLs. |
| 2026-05-04 | Card AF mentions in lounge_access + quirks ($499 Premier, $99 Plus, etc.) | User explicitly asked NOT to include card prices on program pages (saved as `feedback_no_card_af_on_program_pages.md`) | **Stripped all AF dollar amounts.** Cards still referenced by name + issuer; AF specifics deferred to dedicated card pages. |
| 2026-05-04 | "Blue Sky Phase 2 (Feb 2026) cross-airline sales / Phase 3 (spring 2026) reciprocal benefits" — confidently dated | ChatGPT flagged as ❓ UNVERIFIED for specific phase dates beyond Phase 1 | **Hedged the timeline.** Phase 1 (Oct 23, 2025) kept dated specifically. Subsequent phases now described as "rolling out through 2026 in subsequent phases" without specific dates — until each phase has confirmed launch press releases. |

## Cross-link notes (per Step 8)

- **Single-row carrier+program** model. TrueBlue is exclusive to JetBlue metal + bilateral partner redemptions (no traditional alliance).
- **Partner programs (when authored)**: United (`/programs/united`), China Airlines (TBD), Etihad (TBD), Qatar Airways (TBD), Cape Air (TBD).
- **Co-brand cards (Barclays — when card section authored)**: JetBlue Card, JetBlue Plus, JetBlue Business, JetBlue Premier. Each card row will get `co_brand_program_id = jetblue` so the "Cards that earn into me" block on this page auto-renders.
- **Transfer-in partners (skeleton rows seeded migration 083 on 2026-05-04)**: amex-membership-rewards, capital-one, wells-fargo-rewards. Plus existing chase + citi-thankyou.
- **Currency term**: `points` (not `miles`) — set via migration 084 alongside southwest. Drives the dynamic "How to spend points" heading.
- **Alliance field**: `other` — intentional, signals the Blue Sky bilateral partnership in the hero pill (renders as "Partnership" rather than "Independent" or a specific alliance name). New convention: programs with major bilateral partnerships but no alliance get `alliance: 'other'`.

## Notes / followups

- **Verify on next review**: Blue Sky Phase 2 + 3 confirmed launch dates as JetBlue/United post follow-up press releases. Currently hedged as "rolling out through 2026."
- **Verify on next review**: BlueHouse Boston lounge opening date. Currently "mid-2026" — tighten to a specific month when announced.
- **Verify on next review**: full Mosaic 4 lounge guest policy (kids? guests? +1?) — JetBlue hasn't published a complete answer.
- **Verify on next review**: Mosaic 1 specific perks lost in Feb 2026 overhaul. We have "free bags dropped from 2 to 1" + "drinks/snacks reportedly cut" — confirm full list against jetblue.com/rapid-rewards/tiers.
- **Verify on next review**: Subscription tier mechanics — Points On Repeat is brand-new (March 31, 2026); some details may evolve through 2026.
- **Watch for**: any new Mint Europe routes beyond Barcelona (Apr 2026) and Milan (May 2026). Possible Madrid expansion was rumored.
- **Watch for**: Spirit cease-of-existence final timeline. May 2026 announcement; the actual wind-down date matters for any follow-up references.
- **Watch for**: any new transfer partners or partner-roster changes (the partner roster has been notably volatile in 2025-2026 — JSX out, JAL out, China Airlines redemption added, Wells Fargo added).
- **Section render order**: As of 2026-05-04, the public page renders Intro → Award chart → Transfer partners → How to spend → Sweet spots → Tiers → Lounges → Tips. (Per `feedback_program_section_order.md`.)
- **Programs index card improvement** (raised by user 2026-05-04): JetBlue currently shows up on `/programs?type=airline` filter as just "JetBlue TrueBlue / Non-alliance" with no description teaser. Same is likely true for other programs. Backlog: enhance the program-card render to surface a short description, transfer partner count, or other key metadata so the index doesn't look empty. Cross-program improvement, not JetBlue-specific.
