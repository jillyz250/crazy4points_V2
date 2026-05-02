# Hawaiian Airlines (carrier) — Source List

Reference list of every URL used to author the public page at `/programs/hawaiian`. Per-program audit trail — not the intel sources DB table.

Hawaiian is a **carrier** row (the airline). The loyalty program **Atmos Rewards** has its own row + source doc at `plans/sources/atmos.md` and holds program-level content (transfer partners, tier benefits, mile expiry, etc.). Atmos is the joint Alaska-Hawaiian program, formed when Alaska acquired Hawaiian in 2024 and consolidated HawaiianMiles + Mileage Plan into one program in late 2025.

---

## Last reviewed
**May 2026** by Jill + Claude

## Official Hawaiian + Alaska Air Group sources

- **Hawaiian Airlines newsroom:** https://newsroom.hawaiianairlines.com/releases
- **Hawaiian Airlines press releases (alt):** https://www.hawaiianairlines.com/press-releases
- **Alaska Air Group consolidated newsroom (covers AS + HA + Horizon):** https://news.alaskaair.com/press-center/latest-news/
- **Plumeria Lounge official page:** https://www.hawaiianairlines.com/content/our-services/products-and-programs/lounges/the-plumeria-lounge
- **Lounge program overview (HA help center, redirects to Alaska post-merger):** https://hawaiianair.custhelp.com/app/answers/detail/a_id/3319/~/lounge-program

## Social channels (for ongoing signal monitoring)

- **Hawaiian newsroom (web only):** https://newsroom.hawaiianairlines.com/
- **HA Connect (employee/partner news):** https://haconnect.hawaiianairlines.com/s/news-and-update

## Research articles cited (by section)

### Intro
- Hawaiian joins oneworld April 22-23, 2026: [oneworld official press release on PRNewswire](https://www.prnewswire.com/news-releases/aloha-oneworld-welcomes-hawaiian-airlines-to-alliance-302751822.html)
- AwardWallet coverage of oneworld join: https://awardwallet.com/news/airlines/hawaiian-airlines-joining-oneworld/
- Single operating certificate Oct 29, 2025: confirmed via Copilot fact-check (sources: Alaska Airlines News + ALPA)
- Atmos Rewards as joint program: confirmed via multiple search results and oneworld press release
- Founded 1929 as Inter-Island Airways: stable historical fact

### Lounge access
- Plumeria Lounge official page (eligibility, hours, location, day pass pricing): https://www.hawaiianairlines.com/content/our-services/products-and-programs/lounges/the-plumeria-lounge (paste-in 2026-05-02)
- Plumeria left Priority Pass April 1, 2025 (not in our text but confirmed it should not be cited): [Beat of Hawaii](https://beatofhawaii.com/inside-hawaiian-airlines-plumeria-lounge-what-we-found-at-hnl/)
- Day pass pricing $40 / $25 upgrade discount: direct from official paste

### Tips & quirks
- $600M Kahu'ewai Hawai'i Investment Plan (Jan 5, 2026): [PRNewswire press release from Hawaiian Airlines](https://www.prnewswire.com/news-releases/hawaiian-airlines-a-part-of-alaska-airlines-announces-kahuewai-hawaii-investment-plan-of-more-than-600m-over-five-years-to-modernize-infrastructure-and-guest-experience-and-deepen-its-commitment-to-the-community-and-sustaina-302652899.html)
- A330 cabin refresh starting 2028 (suites + premium economy): same press release + One Mile at a Time + Aviation Week + Simple Flying (per Copilot fact-check)
- HA airline code retired April 21-22, 2026 during PSS cutover: confirmed via Copilot fact-check (JAL press release + One Mile at a Time)

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution + source |
|---|---|---|---|
| 2026-05-02 | "Joined oneworld April 22, 2026" | Copilot: oneworld's official press release dates April 23, 2026; Simple Flying says April 22 | Hedged to "joined oneworld in late April 2026 (effective April 22-23 depending on source)" |
| 2026-05-02 | "Single operating certificate since October 2025" | Copilot: SOC issued specifically October 29, 2025 | Tightened to "since October 29, 2025" |
| 2026-05-02 | "HA airline code transition" | Copilot: HA code retired April 21-22, 2026 during PSS cutover (not earlier) | Tightened quirks bullet to capture full timeline (SOC Oct 29, 2025 → AS call sign operational → HA code retired April 21-22, 2026 during PSS cutover) |
| 2026-05-02 | ChatGPT (first run) confidently denied: oneworld join, Atmos Rewards exists, $600M Kahu'ewai plan, AS code transition, single operating certificate | ChatGPT had stale training data and fabricated denials of real post-2024 events | **Discarded entirely.** Copilot (with web search) verified all the same facts; my own WebSearch independently confirmed via 2026-dated press releases. **Lesson: required web-search instruction added to SKILL.md Step 3 fact-check prompt.** ChatGPT's second run (after prompt upgrade) honestly returned "❓ UNVERIFIED — can't web search" instead of fabricating, which is the desired fallback. |

## Cross-link notes (per Step 8)

- **Loyalty program:** Atmos Rewards (`/programs/atmos`). Mile earning, transfer partners, tier benefits, expiry, sweet spots all live there.
- **Sister carrier:** Alaska Airlines (`/programs/alaska`) — both feed into Atmos.
- **Co-brand credit cards:** Hawaiian historically had the **Barclays-issued Hawaiian Airlines World Elite Mastercard**. Post-merger and post-Atmos transition, the co-brand landscape may have shifted. Verify on next review whether the Barclays card has been migrated, replaced, or co-exists with an Atmos-branded co-brand card.

## Notes / followups

- Verify on next review that Atmos Rewards integration with Plumeria Lounge access has updated tier names beyond "oneworld eligible" (the May 2025 page mentioned old Pualani Platinum; current page only references oneworld eligibility — clean handoff, but verify Atmos elite tier names are recognized at the lounge once they fully roll out).
- A330 cabin refresh slated to begin 2028 — set a 2027 reminder to check progress and update quirks if the timeline shifts.
- Watch for further Hawaiian-specific news now that AS code has subsumed HA — over time "Hawaiian Airlines" content may merge fully into Alaska's branding. Monitor for whether the carrier identity remains distinct.
- News feed: Alaska Air Group consolidated newsroom (`https://news.alaskaair.com/feed/`) covers Alaska + Hawaiian + Horizon Air. Already in Scout via Alaska row; **update notes field on that source to add `hawaiian` to programs list** (no separate feed needed).
