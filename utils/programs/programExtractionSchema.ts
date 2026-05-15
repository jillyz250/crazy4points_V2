/**
 * Schema Claude must return when extracting a program's content from the
 * official airline/alliance/hotel page.
 *
 * Every field carries a source_quote — verbatim from the markdown — per the
 * verified-math rule. Editor can audit every value back to the source.
 *
 * Fields mirror the editable columns on the `programs` table.
 */

export type ProgramExtracted<T> = {
  value: T | null
  source_quote: string | null
  confidence: 'high' | 'medium' | 'low'
}

/** One row in the tier_benefits jsonb. Matches TierBenefitRow in queries.ts. */
export type ProgramTierRow = {
  name: string
  qualification: string
  benefits: string[]
}

export type ProgramExtraction = {
  // Short editorial paragraph — Sonnet writes 1-3 sentences in brand voice.
  // Goes to programs.intro.
  intro: ProgramExtracted<string>

  // Long-form markdown content describing best redemption picks.
  // Goes to programs.sweet_spots.
  sweet_spots: ProgramExtracted<string>

  // Long-form markdown — who can access which lounges, fees, conditions.
  // Goes to programs.lounge_access.
  lounge_access: ProgramExtracted<string>

  // Fine print, gotchas, fuel-surcharge warnings, etc.
  // Goes to programs.quirks.
  quirks: ProgramExtracted<string>

  // Award chart — verified prose with redemption point amounts per region/cabin.
  // Goes to programs.award_chart.
  award_chart: ProgramExtracted<string>

  // Tier benefit rows — status tiers, qualification, benefits per tier.
  // Goes to programs.tier_benefits (jsonb).
  tier_benefits: {
    rows: ProgramTierRow[]
    source_quote: string | null
    confidence: 'high' | 'medium' | 'low'
  }

  // Alliance membership — one of the three globals or 'none'/'other'.
  // Goes to programs.alliance.
  alliance: ProgramExtracted<'oneworld' | 'skyteam' | 'star_alliance' | 'none' | 'other'>

  // Primary hub airports — IATA codes preferred.
  // Goes to programs.hubs (text[]).
  hubs: ProgramExtracted<string[]>

  // Slug of the parent loyalty program if this is a sub-program.
  // Goes to programs.parent_program_slug.
  parent_program_slug: ProgramExtracted<string>

  // Warnings — fields the model tried but couldn't verify, or checklist items not found.
  extraction_warnings: string[]
}
