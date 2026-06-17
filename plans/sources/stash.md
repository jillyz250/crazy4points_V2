# Stash Hotel Rewards -- Source List

Reference list of every URL used to author the public page at `/programs/stash`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored). Lean style: avoid derived math + over-specificity; keep only official figures, lightly.

## Official program sources (primary -- Firecrawl-scraped 2026-06-17)

- **How Stash works:** https://www.stashrewards.com/how-stash-works
- **FAQ:** https://www.stashrewards.com/questions (authoritative -- earn rate, redemption mechanic, expiry, caps, exclusions, transfer/combine rules)
- **Terms:** https://www.stashrewards.com/terms (eligible-rate + qualifying-rate detail)
- **Hotels roster:** https://www.stashrewards.com/hotels (partner-hotel list + network size)

## Secondary sources (WebSearch, 2026)

- en.wikipedia.org/wiki/Stash_Hotel_Rewards -- background, "largest independent-hotel points program in North America"
- travel.usnews.com/.../stash-hotel-rewards/ -- overview

## Key facts sourced + confidence level

| Claim | Source | Confidence |
|---|---|---|
| Earn 5 Stash Points per $1 on eligible room rates (pre-tax/fees) | stashrewards.com FAQ + how-it-works | HIGH (official) |
| No status tiers -- flat program, all members identical terms | stashrewards.com (no tier structure anywhere) | HIGH (official) |
| Points do not expire | stashrewards.com FAQ ("Stash Points do not expire") | HIGH (official) |
| No blackout dates on redemptions | stashrewards.com FAQ + how-it-works | HIGH (official) |
| Redemption dynamic by hotel/room/season/demand; no fixed chart | stashrewards.com FAQ | HIGH (official) |
| Full points only; no cash top-up (exploring for future) | stashrewards.com FAQ | HIGH (official) |
| Redeem in someone else's name; points not transferable between accounts | stashrewards.com FAQ | HIGH (official) |
| Earn on room rates only; not dining/spa | stashrewards.com FAQ | HIGH (official) |
| Up to 2 rooms same dates; up to 29 nights extended stay | stashrewards.com FAQ | HIGH (official) |
| Third-party / OTA bookings don't earn | stashrewards.com FAQ | HIGH (official) |
| No co-brand card; no transfer partners; can't combine with other programs | stashrewards.com FAQ ("cannot be combined with other rewards programs") | HIGH (official) |
| Deleting account forfeits points | stashrewards.com FAQ | HIGH (official) |
| Network = hundreds of independent upscale/boutique hotels, US/Mexico/Canada/Caribbean | stashrewards.com FAQ + how-it-works | HIGH (official) |
| Partner hotels average 150-200 rooms, TripAdvisor 80%+ recommend | stashrewards.com FAQ | HIGH (official) |

## Notes / followups

- **Clean authoring run.** All official pages scraped via Firecrawl; both audits clean (regex needed only "never expire" -> "do not expire", matching Stash's own FAQ wording).
- **Simplest program in the set:** no tiers, no math to avoid -- one flat earn rate (5/$1) and dynamic redemption. tier_benefits has a single "Member" entry by design.
- **Network size:** sources vary (WebSearch said ~200-300; official says "hundreds"). Used "hundreds" per official wording -- no specific count asserted.
- **hotel_properties not seeded.** Hundreds of Stash Partner Hotels listed at stashrewards.com/hotels -- good candidate for scrape-properties.mjs (clean single roster page).
- **Lean style applied:** kept the one defining figure (5 pts/$1) and official caps (2 rooms, 29 nights); avoided reproducing the FAQ's worked example ("$150 room = 750 points") and the dynamic redemption point examples (14,097 etc.) since those are illustrative/derived.

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Network size | WebSearch gave conflicting counts (200 vs 300); official says "hundreds" | Used official "hundreds," no specific number |
| 2026-06-17 | Geography | One WebSearch added Panama; official FAQ lists US/Mexico/Canada/Caribbean | Used official geography |
