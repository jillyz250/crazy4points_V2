# The World of Hyatt Credit Card — Source List

Reference list of every URL/document used to author the public page at `/cards/chase-world-of-hyatt`. Per-card audit trail. Append new sources whenever the page or migration is updated. Don't delete old ones.

---

## Last reviewed
**April 28, 2026** by JZ (with Claude Code assist)

## Card identity
- Issuer: JPMorgan Chase Bank, N.A.
- Network: Visa Signature
- Co-brand partner: World of Hyatt
- Currency earned: Hyatt points directly (not transferable Chase UR)
- Migration: [supabase/migrations/045_card_chase_world_of_hyatt.sql](../../../supabase/migrations/045_card_chase_world_of_hyatt.sql)

## Authoritative sources (used for migration 045)

### Chase official offer page
- **URL:** https://creditcards.chase.com/travel-credit-cards/world-of-hyatt-credit-card
- **Used for:** annual fee, welcome bonus, earn rates, free nights, status, TQN accelerators, FX fee, APR ranges, eligibility
- **Captured:** Verbatim text pasted into chat 2026-04-28

### Chase Visa Signature Guide to Benefits (PDF)
- **File:** BGC11359_v2.pdf (863 KB, 30 pages)
- **Effective date:** 10/01/24
- **Title:** "Guide to Benefits — Visa Signature® and Visa Platinum"
- **Used for:** all insurance and protection benefits (auto rental coverage, baggage delay, lost luggage, purchase protection, extended warranty, travel accident, roadside assistance, travel and emergency assistance services)
- **Claim portal:** https://chasecardbenefits.com
- **Claim phone:** 1-800-349-2634 (US) / 001-214-503-2951 (intl collect)
- **Carrier:** Virginia Surety Company, Inc. (Assurant company)

## Aggregator/blog references (cross-checked, not authoritative)

- [The Points Guy — World of Hyatt Credit Card review](https://thepointsguy.com/credit-cards/reviews/world-of-hyatt-credit-card-review/) — confirmed earn rates and basic benefit shape; **Note:** TPG's review claimed Trip Cancellation/Interruption $5K/$10K coverage. **The PDF does NOT include this benefit.** TPG was either describing a different card or was outdated. Authoritative source: PDF.
- [Frequent Miler best card offers tracker](https://frequentmiler.com/best-credit-card-offers/) — listed 45K SUB; **superseded by Chase's own page showing 60K**. FM tracker likely stale at the time of fetch.
- [Doctor of Credit](https://www.doctorofcredit.com) — historical highest bonus is 75-85K (occasional limited-time offers in 2022 and 2024)

## Hyatt program references (used for context)

- [Hyatt source archive](../hyatt.md) — overall program guide
- [World of Hyatt program FAQ](https://www.hyatt.com/help/faqs/general-world-of-hyatt-program)
- [Discoverist tier benefits](https://world.hyatt.com/content/gp/en/tiers-and-benefits.html)

## Important deltas from earlier drafts

| Field | Wrong (initial draft) | Right (PDF-verified) |
|---|---|---|
| Trip cancellation insurance | Listed at $5K/$10K | **Not included** on this card |
| Trip interruption insurance | Listed | **Not included** |
| Baggage delay max days | 5 days × $100 = $500 | 3 days × $100 = $300 |
| Anniversary $15K free night | Anniversary year | **Calendar year** |
| 5 TQN credits frequency | Annual (cardmember year) | **Calendar year** (issued within 8 weeks of Jan 1) |
| Travel Accident Insurance | Not included | **$100K 24-hour / $500K Common Carrier** |
| Roadside Assistance | Not listed | Pay-per-use, included |

## Fact-check audit (Step 3 of skill, 2026-04-28)

Two LLMs reviewed the draft against current 2026 public sources. Disagreements logged below with resolutions.

### Copilot pass — verdict: ~95% accurate

**Disagreements:**
| Point | Copilot's note | Resolution |
|---|---|---|
| TQN "issued within 8 weeks of Jan 1" | "More specific than public marketing terms" | **Kept.** Came from Chase's own offer-details language (user paste 2026-04-28). Authoritative. |
| 12-month free night validity | Suggested "typically valid 12 months" hedge | **Accepted** — added "typically" hedge per skill's banned-absolute-words rule |
| Estimated SUB value | Suggested $1,020 (60K × 1.7¢) over $1,000 | **Accepted** — bumped to $1,020 |
| Insurance caps | "Only fully verifiable from PDF" | **Already verified** — we have BGC11359_v2 PDF locally |

### ChatGPT pass — verdict: ~90-95% accurate

**Disagreements:**
| Point | ChatGPT's note | Resolution |
|---|---|---|
| 60K is "current" | Sometimes elevated to 65-85K via targeted offers | **Schema handles via `is_current=true`.** Current public offer is 60K (verified). Historical offers can be added as separate rows when documented. Note added in welcome bonus `notes` field. |
| Free night "primary cardholder only" | Misleading — primary holds cert but can book guest stays | **Accepted** — updated descriptions: "issued to primary; redemption can include guest stays" |
| Brand exclusions phrasing | Suggested "Standard rooms at Cat 1-4; not valid at all-inclusive or Miraval" | **Accepted** — clearer + more semantically robust if Hyatt adds new all-inclusive brands |
| "Trip cancellation absolute" | "Don't state as absolute — Chase could change it" | **Kept absolute.** PDF effective 10/01/24 explicitly omits. Source archive `verification cadence` requires annual Guide to Benefits re-check; will update if Chase adds it. |
| Add May 2026 award chart context | Belongs on card page intro | **Out of scope here.** Captured via alert ba870b37 + migration 043 (136 hotel changes). Card page UI in Phase 4 will link to the Hyatt program page where the chart context lives. |
| Add "no resort fees on award stays" | Brand ecosystem value | **Out of scope here.** Lives on /programs/hyatt in `quirks` field, not card page. |
| "Keeper card" positioning | Add positioning | **Already done** — `tags = ['hotel-cobrand-flagship','best-hotel-cobrand-low-fee','keeper-card']` |

### Net migration changes from this fact-check
1. Anniversary night description: clarified primary-issuance-but-guest-redemption + added all-inclusive exclusion framing + "typically 12 months" hedge
2. $15K bonus night description: same three updates
3. Welcome bonus: estimated_value_usd 1000 → 1020; notes mention historical 75-85K offers as future verification anchor

No structural changes; no benefit added or removed from the original PDF-verified set.

## Verification cadence
- Welcome bonus: re-check at next public-offer change (Chase typically updates the offer page within hours of any change)
- Earn rates: stable; check annually or if Chase emails about changes
- Insurance/protections: PDF effective date is 10/01/24; check for new Guide to Benefits each fall
- Annual fee: stable since launch ($95)
