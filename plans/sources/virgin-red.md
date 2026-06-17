# Virgin Red -- Source List

Reference list of every URL used to author the public page at `/programs/virgin-red`. Append on every refresh; don't delete old sources.

---

## Last reviewed
**June 2026** by Claude (authored). Lean style: avoid derived math + over-specificity. Type = loyalty_program (Virgin Points currency hub).

## Relationship note
Virgin Red shares the **Virgin Points** currency with **Virgin Atlantic Flying Club** (authored, slug `virgin-atlantic`). Link accounts to pool into one balance. Flight award sweet spots live on the Flying Club page; this page points there rather than restating award costs. Velocity (`virgin-australia`) is a separate Virgin program.

## Official program sources (primary -- Firecrawl-scraped 2026-06-17)

- **Main:** https://www.virgin.com/virgin-red (overview, earn/spend, Flying Club linking, free to join UK/US 18+, points don't expire)
- **Expiry (AUTHORITATIVE):** https://membersupport.red.virgin.com/hc/en-gb/articles/360013901058-How-long-before-my-Virgin-Points-expire -- "your Virgin Points will never expire"
- **Virgin Points FAQ hub:** https://membersupport.red.virgin.com/hc/en-gb/sections/360004037917-Virgin-Points
- **Earn / Spend pages:** https://www.virgin.com/virgin-red/earn , /spend (JS-rendered, thin via static scrape)

## Secondary sources (WebSearch, 2026)

- thepointsguy.com/loyalty-programs/great-value-virgin-atlantic-flying-club/ -- transfer partners, sweet spots
- frequentmiler.com/best-uses-for-virgin-atlantic-points/ -- partner sweet spots
- awardwallet / upgradedpoints -- transfer partner list (1:1), buy-points + transfer bonus promos

## Key facts sourced + confidence level

| Claim | Source | Confidence |
|---|---|---|
| Virgin Red = Virgin rewards club; currency = Virgin Points, shared with Flying Club | virgin.com/virgin-red | HIGH (official) |
| Virgin Points do not expire | Virgin Red member support (authoritative) + main page | HIGH (official) |
| Free to join; UK and US residents, 18+; app or website, no card | virgin.com/virgin-red | HIGH (official) |
| Link Flying Club / Virgin Hotels The Know / Virgin Wines Discovery to pool points | virgin.com/virgin-red | HIGH (official) |
| 150+ ways to earn, 200+ lifestyle rewards to spend | virgin.com/virgin-red | HIGH (official) |
| Transfer in 1:1 from Amex, Chase, Citi, Capital One, Bilt, Wells Fargo | our authored currency set + 2026 WebSearch | HIGH (matches our own data) |
| US Bank also transfers in 1:1 | WebSearch | MEDIUM (no US Bank row; mentioned in prose only) |
| Amex applies a small US federal excise tax recovery fee on transfer | memory feedback_capture_transfer_fees (Virgin Atlantic listed) | HIGH (rule) |
| Frequent transfer bonuses (recently up to ~40%) | WebSearch (multiple) | MEDIUM (stated qualitatively) |
| Buy-points promos with large bonuses (recently up to ~70%) | WebSearch (multiple) | MEDIUM (stated qualitatively + "only with a redemption in mind") |
| Virgin Points do NOT transfer out to other programmes | member support FAQ (article exists) + general knowledge | MEDIUM-HIGH (article title confirms; body not scraped) |
| No tiers in Virgin Red; elite tiers + lounge are Flying Club | virgin.com/virgin-red (no tier structure) | HIGH (official) |
| Flight redemptions priced via Flying Club chart, not Virgin Red | virgin.com + Flying Club | HIGH |

## Notes / followups

- **Clean authoring run.** Main + authoritative expiry page scraped via Firecrawl; both audits clean first pass.
- **BofA excluded from transfer_partners:** the "8 programs at 1:1" secondary lists include Bank of America and US Bank, but BofA Travel Rewards transferability to Virgin is doubtful (likely cash-back), so excluded per per-card-transferability caution. Only the 6 currencies we've authored (Amex/Chase/Citi/CapOne/Bilt/WF) are in the structured field; US Bank noted in prose.
- **Flight sweet spots deliberately NOT restated here** -- they belong on `virgin-atlantic` (shared currency). This page is framed as the transfer/earn hub that feeds Flying Club.
- **Transfer bonus + buy-points percentages kept qualitative** (~40%, ~70%) per lean style; exact promos rotate.
- **transfer_partners_outbound = []** -- Virgin Points don't transfer out.
- **No hotel_properties / not applicable** (currency program, not a hotel).

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution |
|---|---|---|---|
| 2026-06-17 | Points expiry | Secondary sources conflicted (never expire vs 36-month rolling) | Official Virgin Red member support says "never expire" -- used that |
| 2026-06-17 | Transfer partners | Secondary listed 8 incl. BofA + US Bank | Structured field limited to our 6 authored currencies; US Bank noted in prose; BofA excluded (transferability doubtful) |
