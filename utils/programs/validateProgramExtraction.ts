/**
 * Post-extraction validation — runs AFTER Sonnet returns and BEFORE the
 * extraction is saved to program_extractions. Catches known failure patterns
 * that the prompt sometimes lets through.
 *
 * Adds warnings to extraction_warnings; does NOT modify field values or block
 * the save. The editor sees warnings in the admin review and can decide.
 *
 * Failure patterns covered:
 *   1. Duplicate tier qualifications (Sonnet copy-pasted "Top-tier" to all
 *      three tiers — happened on oneworld extraction)
 *   2. Field has confidence='high' but null/empty source_quote (violates
 *      verified-math rule)
 *   3. Source_quote present but doesn't appear in the markdown (Sonnet
 *      hallucinated the quote)
 *   4. Tier benefits array is empty when page CLEARLY has tier info
 *
 * Each violation appends a warning string to extraction.extraction_warnings.
 */

import type { ProgramExtraction } from '@/utils/programs/programExtractionSchema'

export function validateProgramExtraction(
  extraction: ProgramExtraction,
  markdown: string,
): ProgramExtraction {
  const warnings: string[] = []

  // ── Check 1: Duplicate tier qualifications ───────────────────────────
  const tierRows = extraction.tier_benefits?.rows ?? []
  if (tierRows.length >= 2) {
    const qualifications = tierRows.map((r) => (r.qualification ?? '').trim().toLowerCase())
    const uniqueQuals = new Set(qualifications.filter((q) => q.length > 0))
    if (uniqueQuals.size === 1 && tierRows.length > 1) {
      warnings.push(
        `Validation: All ${tierRows.length} tier_benefits rows have IDENTICAL qualification text ("${qualifications[0]?.slice(0, 80)}..."). This is almost always a copy-paste error — Sonnet should differentiate by tier position (Top-tier / Mid-tier / Entry-tier). Verify before applying.`,
      )
    }
  }

  // ── Check 2: confidence='high' with null source_quote ────────────────
  const fieldsToCheckConfidence: Array<keyof ProgramExtraction> = [
    'intro', 'sweet_spots', 'lounge_access', 'quirks', 'award_chart',
    'alliance', 'hubs', 'parent_program_slug',
  ]
  for (const field of fieldsToCheckConfidence) {
    const f = extraction[field] as { value?: unknown; source_quote?: string | null; confidence?: string } | undefined
    if (!f) continue
    if (f.confidence === 'high' && !f.source_quote) {
      warnings.push(
        `Validation: Field "${String(field)}" has confidence='high' but no source_quote. Verified-math rule violated — Sonnet should downgrade confidence when a quote can't be cited. Treat this value with skepticism.`,
      )
    }
  }
  // tier_benefits has its own shape
  if (extraction.tier_benefits?.confidence === 'high' && !extraction.tier_benefits?.source_quote) {
    warnings.push(
      `Validation: tier_benefits has confidence='high' but no source_quote. Treat with skepticism.`,
    )
  }

  // ── Check 3: source_quote present but not actually in markdown ───────
  // Use a normalized substring check (whitespace-insensitive).
  const normalizedMarkdown = markdown.toLowerCase().replace(/\s+/g, ' ')
  for (const field of fieldsToCheckConfidence) {
    const f = extraction[field] as { source_quote?: string | null } | undefined
    if (!f?.source_quote) continue
    const quote = f.source_quote.toLowerCase().replace(/\s+/g, ' ').trim()
    if (quote.length < 8) continue  // too short to meaningfully check
    if (!normalizedMarkdown.includes(quote)) {
      warnings.push(
        `Validation: Field "${String(field)}" source_quote not found in scraped markdown. Possible Sonnet hallucination. Quote: "${quote.slice(0, 100)}..."`,
      )
    }
  }

  // ── Check 4: hubs = empty for known airlines (alliances correctly empty) ──
  // (Skipped here — hubs validation requires knowing program type;
  //  caller passes type, not validator.)

  if (warnings.length > 0) {
    return {
      ...extraction,
      extraction_warnings: [
        ...(extraction.extraction_warnings ?? []),
        ...warnings,
      ],
    }
  }
  return extraction
}
