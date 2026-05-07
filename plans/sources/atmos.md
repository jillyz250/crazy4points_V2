# Atmos Rewards (loyalty program) — Source List

Reference list of every URL used to author the public page at `/programs/atmos`. Per-program audit trail — not the intel sources DB table.

Atmos Rewards is the **loyalty program** row (joint Alaska + Hawaiian, formed when Alaska acquired Hawaiian in 2024 and consolidated HawaiianMiles + Mileage Plan into one program in late 2025). The carriers have their own rows + source docs at `plans/sources/alaska.md` (TBD) and `plans/sources/hawaiian.md`. This page holds program-level content (transfer partners, tier benefits, mile expiry, sweet spots, award charts).

---

## Last reviewed
**May 2026** by Jill + Claude

## Official Atmos / Alaska Air Group sources

- **Alaska Air Group consolidated newsroom (covers AS + HA + Atmos):** https://news.alaskaair.com/press-center/latest-news/
- **Atmos Rewards launch press release (Aug 20, 2025):** https://news.alaskaair.com/loyalty/introducing-atmos-rewards/
- **HawaiianMiles → Atmos migration press release (Oct 2025):** https://news.alaskaair.com/loyalty/hawaiianmiles-is-now-atmos-rewards-with-more-ways-to-earn-more-destinations-to-explore-and-more-perks-to-enjoy/
- **Atmos Rewards 2026 program updates (status earning, partnerships, perks):** https://news.alaskaair.com/loyalty/atmos-rewards-2026-expanded-status-earning-bew-partnerships-and-exclusive-perks-announced/
- **Bank of America Atmos Summit Visa Infinite launch press release:** https://newsroom.bankofamerica.com/content/newsroom/press-releases/2025/08/alaska-airlines-and-bank-of-america-present-a-new-premium-credit.html

## News & signal channels (Phase 6+ ingestion)

- **Press room / newsroom RSS:** https://news.alaskaair.com/feed/ — already in Scout under the Alaska source row; **update notes field on that source to add `atmos` to programs list** (no separate feed needed; one feed covers AS + HA + Atmos)
- **Bank of America newsroom (for Atmos co-brand card news):** https://newsroom.bankofamerica.com/content/newsroom/press-releases.html

## Research articles cited (by section)

### Intro & program identity
- [Atmos Rewards Complete Guide — Frequent Miler](https://frequentmiler.com/alaska-atmos-rewards-complete-guide/) (2026-01-04)
- [Alaska Hawaiian Atmos Rewards Program — One Mile at a Time](https://onemileatatime.com/news/alaska-hawaiian-atmos-rewards-program/)
- [Atmos Rewards guide — The Points Guy](https://thepointsguy.com/airline/alaska-airlines-atmos-rewards/) (2026-04-10)
- [Atmos Rewards guide — AwardFares](https://awardfares.com/blog/atmos-rewards-guide/)
- [HawaiianMiles makes official transition to Atmos Rewards — Maui Now](https://mauinow.com/2025/10/02/hawaiianmiles-makes-official-transition-to-atmos-rewards/) (2025-10-02)
- [Atmos Rewards launches — Upgraded Points](https://upgradedpoints.com/news/atmos-rewards-launches/)
- [Atmos Rewards guide — NerdWallet](https://www.nerdwallet.com/travel/learn/guide-to-atmos-rewards)
- [Daily Drop Atmos guide](https://www.dailydrop.com/pages/alaska-atmos-rewards-guide)

### Transfer partners
- [Guide to Atmos Rewards transfer partners (in/out) — PointsCrowd](https://www.pointscrowd.com/blog/guide-to-atmos-rewards-transfer-partners-to-from/)
- [Atmos Rewards: Alaska and Hawaiian unveil joint loyalty program — NerdWallet](https://www.nerdwallet.com/travel/learn/atmos-rewards-alaska-and-hawaiian-unveil-joint-loyalty-program)

### Tier structure & elite qualification
- [Atmos elite status — AwardWallet](https://awardwallet.com/airlines/alaska-atmos-rewards/elite-status/)
- [Atmos Rewards 2026 status earning announcement — Alaska newsroom](https://news.alaskaair.com/loyalty/atmos-rewards-2026-expanded-status-earning-bew-partnerships-and-exclusive-perks-announced/)

### Sweet spots & award pricing
- [How to redeem Atmos Rewards points — One Mile at a Time](https://onemileatatime.com/guides/redeem-alaska-atmos-rewards-points/)
- [Atmos Rewards guide (sweet spots) — TPG](https://thepointsguy.com/airline/alaska-airlines-atmos-rewards/) (2026-04-10)

### Co-brand cards
- [Atmos Rewards Summit Visa Infinite review — One Mile at a Time](https://onemileatatime.com/reviews/credit-cards/bank-of-america/atmos-rewards-summit-card/)
- [Atmos Rewards Summit Visa Infinite guide — One Mile at a Time](https://onemileatatime.com/guides/atmos-rewards-summit-visa-card/)
- [Atmos Summit eligibility — TPG](https://thepointsguy.com/credit-cards/atmos-rewards-summit-eligibility/)
- [Atmos Summit 100K bonus offer — Doctor of Credit](https://www.doctorofcredit.com/bank-of-america-atmos-rewards-summit-visa-infinite-card-100000-point-bonus/)
- [Atmos Summit 100K signup bonus — Upgraded Points](https://upgradedpoints.com/news/atmos-summit-card-100k-sign-up-bonus/)
- [Bank of America Alaska Airlines Infinite credit card page](https://www.bankofamerica.com/credit-cards/products/alaska-airlines-infinite-credit-card/)
- [Hawaiian Airlines Barclays cards still available — Frequent Miler](https://frequentmiler.com/hawaiian-airlines-cards-issued-by-barclays-still-available-for-now/)
- [Barclays Hawaiian credit card continuing — AwardWallet](https://awardwallet.com/news/barclays-bank/hawaiian-airlines-credit-card-continuing/)
- [Barclays American/Hawaiian credit cards update — Upgraded Points](https://upgradedpoints.com/news/barclays-american-hawaiian-credit-cards-update/)

### Lounge access
- See `plans/sources/alaska.md` for Alaska Lounge details (TBD)
- See `plans/sources/hawaiian.md` for Plumeria Lounge details

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution + source |
|---|---|---|---|
| 2026-05-02 | First Copilot/ChatGPT fact-check denied Atmos exists, denied Hawaiian joining oneworld, denied Aug/Oct 2025 rebrand timing | Fact-checker had stale training data; relied on memory not web search; produced confident fabricated denials of post-2024 events | **Discarded entirely.** Re-ran with the SKILL.md-mandated "REQUIRED METHOD: web search" prompt. Second Copilot run browsed properly and confirmed all structural facts (combined program, non-expiring points, distance-based charts, free stopovers, oneworld-aligned tiers, Summit Visa Infinite). |
| 2026-05-02 | "Mileage Plan used to claw points back after 24 months of inactivity, HawaiianMiles after 18" | Copilot couldn't surface a 2026-dated source confirming exact prior expiry rules | Softened to "Mileage Plan and HawaiianMiles both had activity-based expiration before the merger" — drops the exact months. Non-expiring points themselves confirmed via Alaska's own page. |
| 2026-05-02 | "thinnest transferable-currency pipeline of any major US airline program" | Absolute comparative claim without explicit 2026-dated source | Softened to "one of the thinnest transferable-currency pipelines among major US airline programs" |
| 2026-05-02 | "elite-tier devaluation (Platinum 75K to 80K, Titanium 100K to 135K)" | Copilot couldn't surface a dated source for the prior-threshold delta | Kept current 80K/135K thresholds (multi-source confirmed); softened delta framing to "2026 raised the qualification thresholds at the top of the chart" without naming exact prior numbers in the intro. Quirks bullet softened similarly. |
| 2026-05-02 | "Family pooling restricted to Summit cardholders, up to 10 family/friends" | Copilot couldn't confirm the "up to 10" specific limit | Dropped the "up to 10" from the public copy — kept "restricted to Summit cardholders" |
| 2026-05-02 | "Hawaiian Airlines Barclays cards being wound down for new applicants" | Mixed signals across 2026 sources (Frequent Miler + AwardWallet say "still available for now") | Hedged to "Hawaiian Airlines Barclays cards face an uncertain post-merger future; new applicants are being routed toward the Atmos Bank of America cards" |
| 2026-05-02 | "Outbound transfers... only available to Summit Visa Infinite cardholders" | PointsCrowd is the only source surfacing the full outbound table; Summit-only gating from same single source | Kept the partner list (Marriott Bonvoy, IHG, Wyndham, Preferred, Shangri-La) but softened "only available" to "primarily available" pending second-source confirmation |
| 2026-05-02 | Hawaiian's oneworld joining date | Copilot in this session couldn't confirm; previous Hawaiian carrier-page fact-check (logged in `plans/sources/hawaiian.md:48`) confirmed via [oneworld's PR Newswire announcement](https://www.prnewswire.com/news-releases/aloha-oneworld-welcomes-hawaiian-airlines-to-alliance-302751822.html) and AwardWallet | Hedged to "late April 2026" (sources split April 22 vs April 23) |

## Cross-link notes (per Step 8)

- **Operating carriers:** Alaska Airlines (`/programs/alaska`), Hawaiian Airlines (`/programs/hawaiian`). Both feed into Atmos. Carrier-level content (hubs, fleet, brand, lounge specifics) lives on those rows.
- **Co-brand credit cards** (when authored): Atmos Rewards Summit Visa Infinite (Bank of America), Atmos Rewards Ascent Visa Signature (BofA), Atmos Rewards Visa Business (BofA). Legacy: Hawaiian Airlines World Elite Mastercard (Barclays — winding down). Each card row will get `co_brand_program_id = atmos` so the "Cards that earn into me" block on this page auto-renders once seeded.

## Notes / followups

- **Verify on next review:** specific Cathay Pacific & JAL First-class award availability commentary — currently sourced from OMAAT user reports; if Atmos publishes its own availability calendar, replace anecdotal language with sourced data.
- **Verify on next review:** Bilt → Atmos federal excise tax status. Historically Bilt absorbs the partnership cost (no FET); confirm post-rebrand on Bilt support page or Bilt T&Cs.
- **Verify on next review:** Marriott → Atmos exact transfer ratio + 5K bonus structure. PointsCrowd and historical sources both cite 60K Bonvoy → 25K + 5K bonus = effectively 2.4:1, but worth re-confirming on Marriott's own transfer partner page once Atmos is fully integrated.
- **Verify on next review:** Outbound transfer table to IHG/Wyndham/Shangri-La. Single-source (PointsCrowd) for now; verify on the Bank of America Summit cardholder portal once accessible.
- **Watch for:** Atmos's promised "choice-based earning" launch (distance vs. revenue vs. segment) — announced for late 2026. Refresh sweet-spots and earning sections when it goes live.
- **Watch for:** Atmos Communities launch (announced for 2026). Add to perks/quirks when details emerge.
- **Watch for:** Hawaiian Plumeria Lounge integration with Atmos elite tier names — currently flagged as TBD; the lounge page may still reference legacy Pualani Platinum.
- **2026 elite threshold delta** — once a dated source clearly documents the 75K → 80K Platinum and 100K → 135K Titanium changes (currently in OMAAT and AwardFares but Copilot's snippet view didn't surface it), tighten the intro language to name the exact prior numbers.
