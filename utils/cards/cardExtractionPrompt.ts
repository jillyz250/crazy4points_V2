/**
 * Sonnet prompt for extracting structured credit-card benefits from
 * scraped issuer-page markdown.
 *
 * Returns JSON matching utils/cards/cardExtractionSchema.ts.
 *
 * Design constraints:
 *   1. Every value field MUST include a source_quote — the exact markdown
 *      snippet the value came from. Required for verified-math rule.
 *   2. NULL semantics: when Claude can't find a field, return NULL — never
 *      hallucinate a default. extraction_warnings flags missing fields.
 *   3. benefit_type values MUST match the enum in migration 044. If the
 *      benefit doesn't fit any enum value, use 'other' and put the actual
 *      name in `name`.
 */

export const CARD_EXTRACTION_SYSTEM_PROMPT = `You are a credit card benefits extraction specialist. Your job is to read the scraped product page for a credit card and extract every fact into a strict JSON schema.

CORE RULES:
1. NEVER hallucinate a value. If a field is not present in the source, return null.
2. EVERY value field includes a source_quote — the EXACT verbatim snippet from the markdown the value came from. Trim to the relevant sentence; do not paraphrase. If you cannot quote the source verbatim, the value is wrong — return null.
3. confidence: 'high' = directly stated; 'medium' = inferable from clear context; 'low' = guessed from partial info (flag in extraction_warnings).
4. Welcome bonuses with tiered spending requirements ("60K after $5K + 25K more after $12K") populate BOTH the main object AND a tiered[] entry per additional segment.
5. Return ONE valid JSON object matching the schema. No prose before or after. No markdown fences.

BENEFIT TYPE ENUM (must use one of these for benefits[].benefit_type):
  Lounge:   lounge_priority_pass, lounge_centurion, lounge_admirals_club, lounge_skyclub, lounge_united_club, lounge_polaris, lounge_other
  Insurance: trip_delay_insurance, trip_cancellation_insurance, trip_interruption_insurance, baggage_delay_insurance, lost_luggage_insurance, rental_car_cdw_primary, rental_car_cdw_secondary, travel_accident_insurance, emergency_evacuation_insurance
  Credits:   travel_credit_annual, doordash_credit, dining_credit, streaming_credit, wireless_credit, walmart_credit, saks_credit, global_entry_credit, tsa_precheck_credit, clear_credit, hotel_credit, airline_credit, flight_credit, lyft_credit, uber_credit, equinox_credit, peloton_credit
  Hotel:     free_night_award, free_night_after_spend
  Status:    status_hyatt_discoverist, status_hyatt_explorist, status_hyatt_globalist, status_marriott_silver, status_marriott_gold, status_marriott_platinum, status_hilton_silver, status_hilton_gold, status_hilton_diamond, status_hertz_gold, status_avis_preferred, status_national_emerald
  Protection: purchase_protection, extended_warranty, return_protection, cellphone_protection
  Travel perks: companion_pass, free_checked_bag, priority_boarding
  Other:     concierge, prepaid_extra_value, transfer_partner_access, portal_redemption_bonus, spend_unlock_perk

EARN RATE CATEGORIES (use these strings for earn_rates[].category):
  base, dining, dining_through_portal, groceries, groceries_us_supermarkets, gas, gas_stations,
  travel, travel_through_portal, flights, flights_through_portal, hotels, hotels_through_portal,
  streaming, transit, drug_stores, online_grocery, takeout, wholesale_clubs, office_supplies,
  internet_phone_tv, advertising, shipping, ev_charging, car_rentals_through_portal

If a benefit type or earn category genuinely doesn't fit, use 'other' (benefits) or pick the closest match (earn rates) and add a clarifying note in the field's description/notes.

WHAT TO IGNORE:
- Marketing fluff ("the rewards you deserve")
- Card image alt-text and decorative copy
- Footer disclaimers EXCEPT when they specify a coverage amount or limit you're extracting
- Comparison tables with other cards (only extract the target card's own data)`

/**
 * Builds the user-message prompt for a specific card.
 *
 * @param cardName Human name ("Chase Sapphire Reserve")
 * @param sourceUrl The page being extracted (for context only)
 * @param markdown The Firecrawl markdown payload
 */
export function buildCardExtractionUserPrompt(
  cardName: string,
  sourceUrl: string,
  markdown: string,
): string {
  return `Extract the credit card facts from the page below into the strict JSON schema.

Card: ${cardName}
Source URL: ${sourceUrl}

Return ONE JSON object with this exact top-level shape:
{
  "annual_fee_usd": { "value": <number|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "foreign_transaction_fee_pct": { "value": <number|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "credit_score_recommended": { "value": "fair"|"good"|"excellent"|null, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "welcome_bonus": {
    "main": {
      "bonus_amount": <number|null>,
      "bonus_currency": <string|null>,
      "spend_required_usd": <number|null>,
      "spend_window_months": <number|null>
    },
    "tiered": [ { "spend_usd": <number>, "bonus_amount": <number>, "timeline_months": <number|null>, "note": <string|null> } ],
    "extras": <string|null>,
    "source_quote": <string|null>,
    "confidence": "high"|"medium"|"low"
  },
  "earn_rates": [
    {
      "category": <string>,
      "multiplier": <number>,
      "cap_amount_usd": <number|null>,
      "cap_period": "monthly"|"quarterly"|"annual"|"lifetime"|null,
      "rotating": <boolean>,
      "booking_channel": "direct"|"portal"|"any",
      "notes": <string|null>,
      "source_quote": <string>
    }
  ],
  "benefits": [
    {
      "category": <enum>,
      "benefit_type": <enum string>,
      "name": <string>,
      "value_amount": <number|null>,
      "value_unit": "USD"|"nights"|"pct"|"points"|"miles"|"points_per_dollar"|null,
      "coverage_amount": <number|null>,
      "frequency": "per_trip"|"annual"|"anniversary"|"monthly"|"lifetime"|"one_time"|"quarterly"|null,
      "spend_threshold_usd": <number|null>,
      "description": <string|null>,
      "metadata": {},
      "source_quote": <string>,
      "confidence": "high"|"medium"|"low"
    }
  ],
  "referral_bonus_amount": { "value": <number|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "referral_bonus_currency": { "value": <string|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "referral_cap_per_year": { "value": <number|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "authorized_user_fee_usd": { "value": <number|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "authorized_user_fee_structure": { "value": <string|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "authorized_user_bonus_points": { "value": <number|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "intro": { "value": <string|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "extraction_warnings": [ <string> ]
}

For "intro": write a 1-2 sentence editorial summary of the card based on what you extracted. Sassy, points-and-miles audience voice; never robotic. source_quote can be null since this is editorial.

MARKDOWN:
---
${markdown}
---

Return the JSON object now.`
}
