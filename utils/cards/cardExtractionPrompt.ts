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

SOURCE_QUOTE RULES (CRITICAL FOR JSON VALIDITY):
6. Keep every source_quote under 120 characters. If the source sentence is longer, quote the most relevant fragment.
7. Inside a source_quote, every double-quote " MUST be escaped as \\" — backslash-quote. Curly/smart quotes (" " ' ') do NOT need escaping but prefer straight quotes if available.
8. Inside a source_quote, every newline MUST be escaped as \\n. Never put a raw line break inside a string.
9. Inside a source_quote, every backslash MUST be doubled to \\\\.
10. If a source quote would require complex escaping, choose a shorter snippet that captures the key fact without the problematic characters.

WELCOME BONUS — STRIKE-THROUGH / ELEVATED OFFER DETECTION:
11. Issuer pages often show baseline vs. elevated offers using strike-through formatting. Examples:
      "125,000 [strikethrough] 150,000 points after you spend $5,000"
      Markdown: "~~125,000~~ 150,000 points" OR "<s>125,000</s> 150,000 points"
    When you see this pattern:
      - baseline_bonus_amount = the STRUCK value (125,000)
      - main.bonus_amount = the CURRENT/elevated value (150,000)
      - is_elevated = true (since current > baseline)
12. When only ONE welcome bonus value is shown (no strike-through pattern):
      - baseline_bonus_amount = main.bonus_amount (same value)
      - is_elevated = false

METADATA POPULATION (use the benefits[].metadata jsonb to capture):
13. Time-limited benefits → metadata.expires_at = "YYYY-MM-DD" if the page shows an explicit end date.
14. Benefits requiring activation (DashPass enrollment, Peloton activation, StubHub activation) →
    metadata.requires_activation = true
15. Statement credits with distribution patterns:
      - metadata.distribution = "monthly"   if doled out month-by-month (Apple credits, $10/mo Lyft)
      - metadata.distribution = "annual"    if lump-sum once per year ($300 travel credit)
      - metadata.distribution = "per_use"   if applied per qualifying purchase (Global Entry)
      - metadata.distribution = "biannual"  if split Jan-Jun / Jul-Dec ($150+$150 dining credit)
16. Spend-unlock benefits (perks triggered by hitting a $ spend in the year):
      Set spend_threshold_usd to the spend trigger (e.g., 75000) AND
      Set metadata.stack_group = "<threshold>_annual_spend" (e.g., "75000_annual_spend")
      so the UI can visually group all perks unlocked at the same tier.
17. Lounge access:
      metadata.lounge_network = "Priority Pass Select" | "Centurion" | "Admirals Club" | etc.
      metadata.lounge_guests_included = <number>
      metadata.lounge_extra_guest_fee_usd = <number, if applicable>
18. Free-night certificates:
      metadata.free_night_max_category = <number, e.g., 7 for Hyatt>
      metadata.free_night_max_points = <number, e.g., 50000>
      metadata.free_night_brand = "Hyatt" | "Marriott" | "Hilton" | "IHG"

EARN RATE NUANCES (use earn_rates[].notes for):
19. When a credit category overlaps with an earn category (e.g., "8x on Chase Travel" + "$250 Chase Travel
    hotel credit"), note in the earn rate's notes: "Points earned on gross transaction; statement credits
    do not reduce points." This is the most-misunderstood Chase Reserve detail.
20. Brand-specific earn rates with end dates → include "Through M/D/YYYY" in notes.

LOUNGE ACCESS CONDITIONS (capture in benefits[].description and metadata):
21. When a lounge benefit has carrier restrictions, ALWAYS capture them. Examples:
      - Air Canada Maple Leaf Lounge access "with eligible boarding pass on Air Canada or Star Alliance flights"
      - Delta Sky Club access "when flying same-day Delta-operated, -marketed, or -ticketed flights"
      - Admirals Club access "with same-day American Airlines or oneworld boarding pass"
    Put the carrier condition in metadata.access_conditions (free text). Don't omit it just because the
    lounge benefit is mentioned — the conditions are often a separate sentence further down the page.

FORCED BENEFITS CHECKLIST — search the source markdown EXPLICITLY for each item below.
If found, include it as a benefits[] row. If you searched but couldn't find it, add a one-line entry
to extraction_warnings: "Checklist: <item> — not found on this page". Do NOT silently omit checklist
items — the warning is the signal that you looked.

  Travel coordination + insurance:
    - Travel and Emergency Assistance Services / Travel Emergency Hotline (coordination/referral
      service, NOT reimbursement — distinct from emergency_medical_dental_insurance)
      → benefit_type: travel_emergency_assistance
    - Cell phone protection (covers damaged/stolen phones when paying carrier bill with the card)
      → benefit_type: cellphone_protection
    - Roadside assistance / dispatch
    - Travel accident insurance (AD&D)

  Lounge access details (often in fine print):
    - Priority Pass restaurant credits (some issuers exclude restaurants — note inclusion/exclusion)
    - Lounge guest policy (how many free guests, fee per additional guest)
    - Conferred status that comes with lounge access (e.g., Centurion = no guest restrictions)

  Hotel-stay specific:
    - Free night certificate (category cap, brand)
    - Status conferred via card (Hyatt Discoverist, Hilton Gold, Marriott Silver/Gold, IHG)
    - Property credit programs (Luxury Hotel & Resort Collection / The Edit / Fine Hotels & Resorts)
      — these are property booking perks, not statement credits

  Concierge + service:
    - Visa Infinite / Mastercard World Elite / Amex Concierge (usually 24/7 phone service)
    - Travel planning / Travel Designers / Travel Insider service

  Spend unlocks:
    - Anniversary point bonuses
    - Spend-tier perks (Hyatt Globalist Companion Award at $50K Hyatt spend, $30K Hilton free night, etc.)
    - Companion ticket / Companion Pass

  Authorized user benefits:
    - AU fee per user OR free up to N users
    - AU bonus points after spend threshold
    - AU receives full benefits OR limited benefits

The checklist is a SANITY CHECK against missing fine-print perks. If the page is silent on an item,
acknowledge it in extraction_warnings — never invent a benefit that's not on the page.

CATEGORY ENUM (must use EXACTLY one of these strings for benefits[].category — NOT the display label):
  - statement_credit       (recurring monthly/annual credits, e.g., DoorDash $5/mo, Uber $15/mo)
  - travel_credit          (broad travel statement credits, e.g., "$300 annual travel credit")
  - lounge_access          (any airport-lounge benefit)
  - insurance              (trip/baggage/car/medical/accident insurance)
  - free_night             (hotel free-night certificates)
  - status_conferred       (elite-status benefits granted by the card)
  - protection             (purchase / return / extended warranty / cellphone protection)
  - spend_unlock           (perks that require hitting a spend threshold)
  - portal_redemption      (redemption-portal-specific perks)
  - transfer_partner_unlock (access to issuer transfer partners)
  - other                  (companion pass, concierge, free checked bag, etc. — anything that doesn't fit above)

BENEFIT_TYPE ENUM (must use EXACTLY one of these for benefits[].benefit_type):
  Lounge category:
    lounge_priority_pass, lounge_centurion, lounge_admirals_club,
    lounge_skyclub, lounge_united_club, lounge_polaris, lounge_other

  Insurance category:
    trip_delay_insurance, trip_cancellation_insurance, trip_interruption_insurance,
    baggage_delay_insurance, lost_luggage_insurance,
    rental_car_cdw_primary, rental_car_cdw_secondary,
    travel_accident_insurance, emergency_evacuation_insurance,
    emergency_medical_dental_insurance, roadside_assistance

  statement_credit / travel_credit categories:
    travel_credit_annual, doordash_credit, dining_credit,
    streaming_credit, wireless_credit, walmart_credit, saks_credit,
    global_entry_credit, tsa_precheck_credit, clear_credit,
    hotel_credit, airline_credit, flight_credit,
    lyft_credit, uber_credit, equinox_credit, peloton_credit,
    entertainment_credit  (use for StubHub, Vivid Seats, viagogo, ticketing, events)

  free_night category:
    free_night_award, free_night_after_spend

  status_conferred — Hyatt:    status_hyatt_discoverist, status_hyatt_explorist, status_hyatt_globalist
  status_conferred — Marriott: status_marriott_silver, status_marriott_gold, status_marriott_platinum
  status_conferred — Hilton:   status_hilton_silver, status_hilton_gold, status_hilton_diamond
  status_conferred — IHG:      status_ihg_silver, status_ihg_gold, status_ihg_platinum, status_ihg_diamond
  status_conferred — Southwest: status_southwest_a_list, status_southwest_a_list_preferred, status_southwest_companion_pass
  status_conferred — Alaska:   status_alaska_mvp, status_alaska_mvp_gold, status_alaska_mvp_gold_75k
  status_conferred — Car rental: status_hertz_gold, status_avis_preferred, status_national_emerald
  status_conferred — fallback: status_other (use for ANY brand/program status not listed above — DO NOT map to a different brand's status just because it's the closest enum)

  protection:
    purchase_protection, extended_warranty, return_protection, cellphone_protection

  other (catch-all for benefits that don't fit above):
    companion_pass, free_checked_bag, priority_boarding,
    concierge, prepaid_extra_value,
    transfer_partner_access, portal_redemption_bonus, spend_unlock_perk,
    other

ANTI-MAPPING RULE (critical):
- If a status, lounge, or credit doesn't have an exact match above, use the category's *_other variant (status_other, lounge_other, 'other').
- NEVER map a value to a different brand's enum just because it's "closest" — that creates incorrect data. IHG Platinum is NOT status_marriott_gold. Use status_ihg_platinum (which exists) or status_other if the brand has no specific value.

CATEGORY value MUST be one of the 11 enum strings listed above (lowercase, underscore-separated). Do NOT use display labels like "Credits" or "Lounge" or "Travel perks" — use the enum strings exactly.

EARN RATE CATEGORIES (use these strings for earn_rates[].category):
  Standard:    base, dining, dining_through_portal, groceries, groceries_us_supermarkets, gas, gas_stations,
               travel, travel_through_portal, flights, flights_through_portal, hotels, hotels_through_portal,
               streaming, transit, drug_stores, online_grocery, takeout, wholesale_clubs, office_supplies,
               internet_phone_tv, advertising, shipping, ev_charging, car_rentals_through_portal

For BRAND-SPECIFIC promotional earn bonuses (e.g., "10x on Peloton equipment", "5x Lyft rides through 9/30"),
use the BRAND NAME as the category string — lowercase, no spaces. Examples:
  peloton, lyft, doordash, uber, stubhub, walmart, apple, equinox, instacart, hilton, marriott, hyatt

NEVER use 'other' as the earn category. If you cannot match a standard category, use the most descriptive
slug you can construct (e.g., 'apple_subscriptions', 'travel_designers'). The category field is the
search key — descriptive matters.

For brand-specific earn bonuses, include the expiry date in the earn_rate.notes field if time-limited
("Through 9/30/2027" — keep concise).

If a benefit type genuinely doesn't fit, use 'other' as benefit_type and 'other' as category — that's
the catch-all enum pair. Earn rate categories should NEVER be 'other'.

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
    "baseline_bonus_amount": <number|null>,
    "is_elevated": <boolean>,
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
