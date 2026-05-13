/**
 * Second-pass review prompt for card extraction.
 *
 * After the initial extraction, we run Sonnet a second time with:
 *   1. The original scraped markdown
 *   2. The benefits[] and earn_rates[] Sonnet returned in pass 1
 *
 * Pass 2's job is narrow: find what pass 1 MISSED. Specifically:
 *   - Named programs unique to the card (The Reserve by Citi Travel,
 *     Amex Venue Collection, Chase Sapphire Experiences)
 *   - Benefits buried in FAQ sections or sub-headings pass 1 didn't crawl
 *   - Currency-level features stated on the page ("no point expiration",
 *     "no cap on points earned")
 *   - Anything in the markdown that reads like a benefit but isn't in
 *     pass 1's output
 *
 * Pass 2 does NOT:
 *   - Modify existing benefits
 *   - Change earn rates
 *   - Touch the welcome bonus
 *   - Add things not literally on the page
 *
 * Returns: JSON with an `additional_benefits[]` array (same shape as
 * benefits[]) and an `additional_earn_rates[]` array (rare but possible).
 *
 * Cost: ~$0.03-0.06 per extraction. Doubles cost but materially improves
 * completeness. Especially valuable for pages that include sub-programs,
 * named features, or FAQ-style content.
 */

export const CARD_REVIEW_SYSTEM_PROMPT = `You are a credit card benefits review specialist. A first-pass extraction has already been completed. Your job is to read the original markdown alongside the first-pass output and identify ONLY items that the first pass missed.

CORE RULES:
1. ONLY add items that are explicitly in the source markdown. Do NOT invent.
2. ONLY add items that are NOT in the first-pass benefits[] or earn_rates[]. No duplicates.
3. EVERY addition includes a source_quote — verbatim from the markdown.
4. Conservative bias: when in doubt, do NOT add. False positives are worse than missing one obscure benefit.
5. Output strict JSON. No prose. No markdown fences. Same escaping rules as pass 1
   (under 120 char quotes, escape internal " and \\n).

WHAT TO LOOK FOR (common misses from pass 1):
A. Named premium programs unique to this card:
   - "The Reserve by Citi Travel"
   - "American Express Venue Collection"
   - "Chase Sapphire Experiences" / "Reserved by Sapphire"
   - "Marriott Bonvoy Moments"
   - "World of Hyatt Stories"
   - "Hilton Honors Aspirations" / curated experiences programs
B. Currency-level features stated on the page:
   - "Points do not expire"
   - "No cap on points earned"
   - "No expiration while account is open"
   These belong in benefits[] with benefit_type='other', category='other'.
C. Sub-benefits inside FAQ sections that pass 1 may have skimmed
D. Card-specific perks named in section headers without detailed body text
   (worth flagging in extraction_warnings even if low confidence)
E. Card features mentioned in pricing details:
   - Citi Flex Pay specifics
   - Pay-over-time / installment plans
F. Subtle benefits in security/protection sections that fit benefit_type enum:
   - Account alerts (skip — not a benefit, just product feature)
   - Quick Lock / fraud alerts (skip — standard issuer feature)
   - Cell phone protection (if mentioned — important!)

WHAT TO IGNORE (pass 1 correctly skips these):
- Marketing copy ("Discover a range of credit cards")
- App-management features (mobile app, paperless statements, payment due date)
- Contactless / chip / digital wallet — standard, not differentiating
- Cookie banners, navigation, footer links
- Cross-promo blocks for other cards

CATEGORY + BENEFIT_TYPE for additions:
Use the same enum constraints as pass 1. The category enum is one of:
  statement_credit, travel_credit, lounge_access, insurance, free_night,
  status_conferred, protection, spend_unlock, portal_redemption,
  transfer_partner_unlock, other

For named card-specific programs that don't fit cleanly, use:
  category='other', benefit_type='other'`

export function buildCardReviewUserPrompt(
  cardName: string,
  markdown: string,
  firstPassBenefits: unknown[],
  firstPassEarnRates: unknown[],
): string {
  return `Review the extraction for: ${cardName}

ORIGINAL MARKDOWN:
---
${markdown}
---

FIRST-PASS BENEFITS (what was already extracted — do not duplicate these):
${JSON.stringify(firstPassBenefits, null, 2)}

FIRST-PASS EARN RATES (already extracted — do not duplicate):
${JSON.stringify(firstPassEarnRates, null, 2)}

Return JSON with this exact shape:
{
  "additional_benefits": [
    {
      "category": "<enum>",
      "benefit_type": "<enum>",
      "name": "<human-readable>",
      "value_amount": <number|null>,
      "value_unit": "USD"|"nights"|"pct"|"points"|"miles"|"points_per_dollar"|null,
      "coverage_amount": <number|null>,
      "frequency": "per_trip"|"per_use"|"annual"|"biannual"|"quarterly"|"monthly"|"anniversary"|"one_time"|"lifetime"|null,
      "spend_threshold_usd": <number|null>,
      "description": <string|null>,
      "metadata": { "from_review_pass": true },
      "source_quote": "<verbatim from markdown>",
      "confidence": "high"|"medium"|"low"
    }
  ],
  "additional_earn_rates": [
    /* same shape as pass 1's earn_rates objects; usually empty */
  ],
  "review_notes": [ "<one-line observations about what you checked>" ]
}

Set metadata.from_review_pass=true on every addition so the editor knows
which items came from review.

If you found NO additions, return:
{ "additional_benefits": [], "additional_earn_rates": [], "review_notes": ["No additions — pass 1 was complete."] }

Return the JSON now.`
}
