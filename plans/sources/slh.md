# Small Luxury Hotels of the World (SLH Club) — Source List

Reference list of every URL used to author the public page at `/programs/slh`. Per-program audit trail. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored)

## Official program sources (primary — scraped 2026-06-17)

- **Hilton Help Center — SLH Partnership (earn rate + tier benefits + channel rules):** https://www.hilton.com/en/help-center/reservations/small-luxury-hotels-partnership/
- **SLH Club page (Club 01/02/03 tier benefits):** https://www.slh.com/about-slh/our-club
- **SLH homepage (hotel count + Hilton partnership scope):** https://www.slh.com/
- **Hilton 1-year anniversary press release (450+ hotels, 90+ countries, 226M members):** https://stories.hilton.com/releases/hilton-and-small-luxury-hotels-of-the-world-celebrate-one-year-anniversary-of-exclusive-partnership

## Key facts sourced + confidence level

| Claim | Source | Confidence |
|---|---|---|
| 700+ total SLH member hotels, 100+ countries | slh.com homepage | HIGH (scraped official) |
| 450+ hotels in Hilton Honors partnership, 90+ countries | Hilton press release | HIGH (scraped official) |
| 10 Hilton Base Points per USD 1 on qualifying room rates | Hilton Help Center | HIGH (scraped official) |
| Hilton channel requirement (hilton.com / app / 1-800) | Hilton Help Center | HIGH (scraped official) |
| Resort fees waived on Hilton award stays | Hilton Help Center | HIGH (scraped official) |
| Silver +20%, Gold +80%, Diamond +100%, Diamond Reserve +120% bonus | Hilton Help Center | HIGH (scraped official) |
| Gold: continental breakfast (2 guests) + space-available upgrade | Hilton Help Center | HIGH (scraped official) |
| Diamond: continental breakfast (2 guests) + upgrade + Premium WiFi | Hilton Help Center | HIGH (scraped official) |
| Hyatt World of Hyatt partnership ended May 15, 2024 | Multiple (Hilton PR + industry news) | HIGH |
| Hilton is now SLH's exclusive transferable-points partner | Hilton press release (explicit "exclusive") | HIGH (scraped official) |
| SLH Club 01: Club Rate, bottled water, flexible check-in/out, 2 trees/night | slh.com/about-slh/our-club | HIGH (scraped official) |
| SLH Club 02: adds breakfast, upgrades, Bonus Rate, partner offers | slh.com/about-slh/our-club | HIGH (scraped official) |
| SLH Club 03: adds reward night voucher, events, magazine, win chances | slh.com/about-slh/our-club | HIGH (scraped official) |
| Club 02 and Club 03 are invitation-only (no public stay/spend threshold) | slh.com/about-slh/our-club (no threshold published) | HIGH (stated by absence) |
| 5th standard reward night at no extra points on Hilton Gold/Diamond award stays | Hilton Help Center | HIGH (scraped official) |

## Architecture decisions

- **Two loyalty layers:** SLH Club (SLH's own tiers, no transferable currency) + Hilton Honors partnership (the points story).
- **Separate page from Hilton:** SLH has distinct tiers, its own earn/redemption mechanic via Hilton, and enough editorial depth to warrant its own page. Not folded into the Hilton page.
- **No `transfer_partners_outbound`:** SLH Club does not issue a transferable currency. Hilton Honors inbound (SLH earns Hilton points when booked via Hilton channels) is already expressed on the `hilton` currency row, not as an SLH outbound transfer.
- **`tier_benefits` covers SLH Club 01/02/03.** Hilton elite overlay (breakfast, upgrades by tier) is covered in `award_chart` and `sweet_spots` rather than `tier_benefits`, since Hilton tiers are the cardholder's own Hilton status, not SLH program tiers.

## Social channels (for ongoing signal monitoring)

- **SLH Instagram:** @slh — https://www.instagram.com/slh/
- **SLH Press Room:** https://www.slh.com/offers/press-room/
- **Hilton Newsroom:** https://stories.hilton.com/ — watch for SLH partnership updates

## Notes / followups

- **Club 02 and Club 03 qualification criteria not publicly published.** slh.com does not state a stay or spend count for progression. Framed on the page as "by invitation." If SLH publishes criteria officially, update tier_benefits.qualification.
- **Hilton award pricing at SLH is fully dynamic** — no static per-category chart. The 150,000+ points figure in the Hilton sweet_spots for properties like Hermitage Bay Antigua is a data point, not a floor.
- **Hotel_properties not seeded** — SLH's 700+ member hotels are not in `hotel_properties` yet. The Decision Engine will not surface SLH properties until the `scrape-properties.mjs` backlog is addressed.
- **Watch for Hilton tier benefit changes at SLH** — the Hilton Help Center page is the authoritative source. Re-scrape on refresh.
- **Hyatt context:** The Hyatt page has zero SLH mentions (verified clean after the May 2024 partnership end). The SLH page does not reference Hyatt beyond the historical note in quirks.

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Hyatt partnership end date | Training data vague on exact date | WebSearch confirmed May 15, 2024. Multiple industry sources (TPG, OMAAT) consistent. |
| 2026-06-17 | "sole" vs "exclusive" vs "primary" | audit-program.mjs, llm-audit-program.mjs, and editorial accuracy in conflict | "exclusive" wins: factually backed by Hilton's press release ("exclusive partnership"), passes regex audit, not flagged by Sonnet. |
