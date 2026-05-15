/**
 * Sonnet prompt for extracting program content from official airline /
 * alliance / hotel pages. Returns JSON matching ProgramExtraction shape.
 *
 * Design constraints mirror the credit-card extraction prompt:
 *   - Verified-math rule (every value carries a source_quote)
 *   - NULL semantics for missing fields
 *   - Strict JSON output (no prose, no markdown fences)
 *   - Tight escaping rules to keep JSON parse-able
 *
 * Program-specific:
 *   - Some fields are long-form markdown (sweet_spots, lounge_access, quirks)
 *   - Sweet spots should be points-and-miles editorial in brand voice
 *   - Lounge access should explicitly capture who, where, conditions
 *   - Award chart should be verified prose with point amounts (no fabrication)
 */

export const PROGRAM_EXTRACTION_SYSTEM_PROMPT = `You are a frequent flyer / loyalty program extraction specialist. Your job is to read the scraped official page for an airline, alliance, or hotel loyalty program and extract every fact into a strict JSON schema.

CORE RULES:
1. NEVER hallucinate a value. If a field is not present in the source, return null.
2. EVERY value field includes a source_quote — the EXACT verbatim snippet from the markdown the value came from. Trim to the relevant sentence; do not paraphrase. If you cannot quote the source verbatim, the value is wrong — return null.
3. confidence: 'high' = directly stated; 'medium' = inferable from clear context; 'low' = guessed from partial info (flag in extraction_warnings).
4. Return ONE valid JSON object matching the schema. No prose before or after. No markdown fences.

SOURCE_QUOTE RULES (CRITICAL FOR JSON VALIDITY):
5. Keep every source_quote under 150 characters. Trim to the most relevant fragment.
6. Inside a source_quote, every double-quote " MUST be escaped as \\" — backslash-quote.
7. Inside a source_quote, every newline MUST be escaped as \\n. Never put a raw line break inside a string.
8. Inside a source_quote, every backslash MUST be doubled to \\\\.
9. Avoid em-dashes (—) — use regular hyphens. Avoid smart quotes — use straight quotes.

MULTI-SOURCE INPUT:
The markdown below may contain MULTIPLE sources separated by:
  === SOURCE N: <url> ===
These are different pages from the same program (e.g., /travel-benefits, /airport-lounges, /about). Treat them as ONE combined source — extract from any/all sections. When source_quote applies, the quote can come from any section. If the same fact appears in multiple sections, pick the most authoritative or specific version.

FIELD GUIDANCE:

intro:
  1-3 sentences summarizing the program in sassy, points-and-miles voice.
  Audience: traveler who already knows what miles are.
  Don't list every detail — capture the essence. What's distinctive about THIS program.
  Examples of voice: "Singapore KrisFlyer is the gold standard for Asia premium cabin redemptions."
  "Hawaiian's HawaiianMiles became Atmos Rewards in 2026 — same airline, new program."

sweet_spots:
  Long-form markdown describing the program's best redemption picks.
  Include specific point amounts when on the page.
  Format as bullet-style markdown with prices and routing notes.
  Skip if the page doesn't surface specific sweet spots — don't invent.
  Example pattern:
    "- 60,000 miles round-trip Business class to Europe (no fuel surcharges)"
    "- 70,000 miles one-way First class to Asia"

lounge_access:
  Long-form markdown describing lounge access tiers.
  Capture: which status tiers unlock which lounges, who can bring guests, fees for non-status entry.
  Include alliance lounges (Star Gold, oneworld Sapphire/Emerald, SkyTeam Elite Plus) when applicable.

quirks:
  Long-form markdown. Fine print, gotchas, surcharges, stopover rules, calendar quirks.
  Things experienced flyers know that newcomers wish they did.
  Example: "Fuel surcharges apply to all partner award flights on most routes."
  Example: "Free stopovers allowed on round-trip awards (one per direction)."

award_chart:
  Verified prose describing redemption costs per region/cabin.
  If the page only has a PDF link to the chart, set value to a sentence pointing at the chart and confidence='medium'.
  If the page surfaces explicit point amounts per region, capture them all.
  NEVER fabricate point amounts. If you cannot quote the source for a number, omit it.

tier_benefits:
  Status tier table — qualification thresholds + per-tier benefit lists.
  Each row:
    name: "Premier Silver" / "Gold" / "Diamond" etc.
    qualification: "25,000 PQM or 30 PQF" or "$5,000 PQD" — verbatim if possible
    benefits: array of short benefit strings ("Priority boarding", "1 free checked bag", "25% award discount")
  Empty rows array if the page doesn't list tier benefits.

alliance:
  One of: 'oneworld', 'skyteam', 'star_alliance', 'none', 'other'.
  If the page explicitly says "member of <alliance>", use that.
  If silent, return null (NOT 'none' — null means we didn't find evidence).

hubs:
  Array of IATA airport codes for the carrier's primary hubs.
  E.g., ["ORD", "DEN", "EWR", "IAH"] for United.
  Skip if the page doesn't enumerate hubs.

parent_program_slug:
  Slug of the parent loyalty program if this is a sub-program of a larger one.
  E.g., 'flying-blue' for KLM (KLM uses Flying Blue, which is Air France/KLM).
  Most programs have value=null. Only fill when the page makes the parent relationship explicit.

extraction_warnings:
  Strings describing what you tried to find but couldn't, or fields where the page was ambiguous.
  Examples:
    "Lounge access rules described in PDF only - not extracted."
    "Award chart values not on this page (linked to separate chart PDF)."
    "Hubs not explicitly listed - inferred from route map only (skipped)."`

export function buildProgramExtractionUserPrompt(
  programName: string,
  programSlug: string,
  programType: string,
  sourceUrl: string,
  markdown: string,
  options?: { extractOnlyFields?: string[]; fieldList?: string },
): string {
  const focusedExtraction = options?.extractOnlyFields && options.extractOnlyFields.length > 0
  const focusSection = focusedExtraction
    ? `

FOCUSED EXTRACTION — IMPORTANT:
This page has been designated as the authoritative source for SPECIFIC fields only:
  ${options.fieldList}

Extract ONLY these fields. For all OTHER fields in the schema, return null with confidence='low'.
Do not extract content for non-target fields even if it appears on the page — another page is the
canonical source for those.

For example, if this page is designated for "lounge_access" only, and the page also contains tier
benefit information, you DO NOT populate tier_benefits — leave it null. A separate extraction
pass on the tier benefits page will fill that field.

This prevents cross-contamination across pages and lets the editor designate the canonical source
per field.`
    : ''

  return `Extract the program facts from the page below into the strict JSON schema.

Program: ${programName}
Slug: ${programSlug}
Type: ${programType}
Source URL: ${sourceUrl}${focusSection}

Return ONE JSON object with this exact top-level shape:
{
  "intro": { "value": <string|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "sweet_spots": { "value": <string|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "lounge_access": { "value": <string|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "quirks": { "value": <string|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "award_chart": { "value": <string|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "tier_benefits": {
    "rows": [ { "name": <string>, "qualification": <string>, "benefits": [<string>] } ],
    "source_quote": <string|null>,
    "confidence": "high"|"medium"|"low"
  },
  "alliance": { "value": "oneworld"|"skyteam"|"star_alliance"|"none"|"other"|null, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "hubs": { "value": [<string>]|null, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "parent_program_slug": { "value": <string|null>, "source_quote": <string|null>, "confidence": "high"|"medium"|"low" },
  "extraction_warnings": [ <string> ]
}

For 'intro': write 1-3 sassy, points-and-miles voice sentences. source_quote can be null since this is editorial synthesis.

MARKDOWN:
---
${markdown}
---

Return the JSON object now.`
}
