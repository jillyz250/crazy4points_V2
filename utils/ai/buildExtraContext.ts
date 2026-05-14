/**
 * Builds the `extra_context` string passed to writeAlertDraft. Consolidates
 * program Page content (intro, transfer partners, sweet spots, quirks, etc.),
 * concurrent active offers (transfer bonuses + stackable promos), verified
 * official terms, and admin-filled gap fields into one authoritative block.
 *
 * Used by both the regenerate flow (alerts/actions.ts) and the build-brief
 * flow (app/api/build-brief/route.ts) so first drafts get the same program
 * context as regenerates.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export interface FilledGap {
  field: string
  filled?: string | null
}

export interface BuildExtraContextArgs {
  /** Slugs of programs tagged on the intel/alert (Scout output). */
  programSlugs: string[]
  /** Admin-pasted authoritative T&C text. Highest authority when present. */
  verifiedTerms?: string | null
  /** Admin-filled gap field values (from prior fact-check chips). */
  filledGaps?: FilledGap[]
  /** Alert ID to exclude from active-offer queries (self-reference guard). */
  excludeAlertId?: string | null
}

export interface BuildExtraContextResult {
  extra_context: string | null
  /** Slugs of programs that contributed Page content — used for FAQ targeting. */
  faq_program_slugs: string[]
}

interface ProgramRow {
  id: string
  slug: string
  name: string
  type: string
  intro: string | null
  transfer_partners: Array<Record<string, unknown>> | null
  sweet_spots: string | null
  quirks: string | null
  how_to_spend: string | null
  tier_benefits: Array<Record<string, unknown>> | null
  lounge_access: string | null
}

function buildProgramSection(p: ProgramRow): string | null {
  const parts: string[] = []
  if (p.intro?.trim()) parts.push(`#### About\n${p.intro.trim()}`)
  if ((p.transfer_partners?.length ?? 0) > 0) {
    const lines = p.transfer_partners!
      .map((row) => {
        const r = row as Record<string, unknown>
        const slug = typeof r.from_slug === 'string' ? r.from_slug : '?'
        const ratio = typeof r.ratio === 'string' ? r.ratio : '?'
        const notes = typeof r.notes === 'string' ? ` — ${r.notes}` : ''
        const bonus = r.bonus_active === true ? '  🔥 BONUS ACTIVE' : ''
        return `- ${slug} → ${ratio}${notes}${bonus}`
      })
      .join('\n')
    parts.push(`#### Transfer partners (inbound to ${p.name})\n${lines}`)
  }
  if (p.how_to_spend?.trim()) parts.push(`#### How to spend miles\n${p.how_to_spend.trim()}`)
  if (p.sweet_spots?.trim()) parts.push(`#### Sweet spots\n${p.sweet_spots.trim()}`)
  if ((p.tier_benefits?.length ?? 0) > 0) {
    const lines = p.tier_benefits!
      .map((row) => {
        const r = row as Record<string, unknown>
        const name = typeof r.name === 'string' ? r.name : '?'
        const qual = typeof r.qualification === 'string' ? r.qualification : ''
        const benefits = Array.isArray(r.benefits)
          ? (r.benefits as unknown[]).filter((b): b is string => typeof b === 'string')
          : []
        const qualPart = qual ? ` (${qual})` : ''
        const bensPart = benefits.length ? `: ${benefits.join('; ')}` : ''
        return `- ${name}${qualPart}${bensPart}`
      })
      .join('\n')
    parts.push(`#### Elite tiers & benefits\n${lines}`)
  }
  if (p.lounge_access?.trim()) parts.push(`#### Lounge access\n${p.lounge_access.trim()}`)
  if (p.quirks?.trim()) parts.push(`#### Tips & quirks\n${p.quirks.trim()}`)
  return parts.length > 0 ? parts.join('\n\n') : null
}

const STACKABLE_TYPES = [
  'limited_time_offer',
  'award_availability',
  'status_promo',
  'point_purchase',
  'award_sale',
]

export async function buildExtraContext(
  supabase: SupabaseClient,
  args: BuildExtraContextArgs
): Promise<BuildExtraContextResult> {
  const { programSlugs, verifiedTerms, filledGaps, excludeAlertId } = args

  // 1) Load tagged programs with their Page content.
  let programs: ProgramRow[] = []
  if (programSlugs.length > 0) {
    const { data } = await supabase
      .from('programs')
      .select(
        'id, slug, name, type, intro, transfer_partners, sweet_spots, quirks, how_to_spend, tier_benefits, lounge_access'
      )
      .in('slug', programSlugs)
    programs = (data ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      slug: p.slug as string,
      name: p.name as string,
      type: p.type as string,
      intro: (p.intro as string | null) ?? null,
      transfer_partners: (p.transfer_partners as Array<Record<string, unknown>> | null) ?? null,
      sweet_spots: (p.sweet_spots as string | null) ?? null,
      quirks: (p.quirks as string | null) ?? null,
      how_to_spend: (p.how_to_spend as string | null) ?? null,
      tier_benefits: (p.tier_benefits as Array<Record<string, unknown>> | null) ?? null,
      lounge_access: (p.lounge_access as string | null) ?? null,
    }))
  }

  const programSections = programs
    .map((p) => {
      const ctx = buildProgramSection(p)
      return ctx ? `### ${p.name}\n\n${ctx}` : null
    })
    .filter((s): s is string => !!s)

  const faq_program_slugs = programs
    .filter((p) => buildProgramSection(p) !== null)
    .map((p) => p.slug)

  // 2) Concurrent active offers — transfer bonuses + stackable promos —
  //    for any tagged program. Surfaces stack/alternative-path opportunities.
  let activeBonusBlock = ''
  if (programs.length > 0) {
    const programIds = programs.map((p) => p.id)
    const today = new Date().toISOString()
    const SELECT_COLS =
      'id, slug, title, end_date, type, primary_program_id, alert_programs!inner(program_id)'
    const byId = new Map(programs.map((p) => [p.id, p.name]))
    const formatRow = (row: Record<string, unknown>): string => {
      const programName =
        (row.primary_program_id && byId.get(row.primary_program_id as string)) ?? '?'
      const ends = row.end_date
        ? ` (ends ${new Date(row.end_date as string).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })})`
        : ''
      const slug = (row.slug as string | null) ?? null
      const slugRef = slug ? ` [/alerts/${slug}]` : ''
      const typeTag = row.type ? ` — ${row.type}` : ''
      return `- ${row.title}${ends} — primary program: ${programName}${typeTag}${slugRef}`
    }

    let bonusQuery = supabase
      .from('alerts')
      .select(SELECT_COLS)
      .eq('type', 'transfer_bonus')
      .eq('status', 'published')
      .or(`end_date.gte.${today},end_date.is.null`)
      .in('alert_programs.program_id', programIds)
      .order('end_date', { ascending: true, nullsFirst: false })
      .limit(8)
    if (excludeAlertId) bonusQuery = bonusQuery.neq('id', excludeAlertId)
    const { data: bonusAlertRows } = await bonusQuery
    const bonusLines = (bonusAlertRows ?? []).map((r) =>
      formatRow(r as Record<string, unknown>)
    )

    let otherQuery = supabase
      .from('alerts')
      .select(SELECT_COLS)
      .in('type', STACKABLE_TYPES)
      .eq('status', 'published')
      .or(`end_date.gte.${today},end_date.is.null`)
      .in('alert_programs.program_id', programIds)
      .order('end_date', { ascending: true, nullsFirst: false })
      .limit(6)
    if (excludeAlertId) otherQuery = otherQuery.neq('id', excludeAlertId)
    const { data: otherAlertRows } = await otherQuery
    const otherLines = (otherAlertRows ?? []).map((r) =>
      formatRow(r as Record<string, unknown>)
    )

    const blocks: string[] = []
    if (bonusLines.length > 0) {
      blocks.push(
        `### Active transfer bonuses involving these programs\n\n` +
          bonusLines.join('\n') +
          `\n\n_When relevant, lead the call-to-action with one of these (link the slug)._`
      )
    }
    if (otherLines.length > 0) {
      blocks.push(
        `### Other active offers for these programs (stack or alternative-path candidates)\n\n` +
          otherLines.join('\n') +
          `\n\n_REDEEM-SIDE alerts (transfer_bonus, award_availability, award_sale, sweet_spot, companion_pass): if one of these naturally complements this alert, weave the stack play into paragraph 2 or 3 — name it, link the slug, and quantify the combined value when you can. Don't force it if the connection is weak._` +
          `\n\n_EARN-SIDE alerts (paid-fare bonus, dining, portal, status promo, signup, point_purchase): do NOT frame these as stacks — earn and redeem paths are mutually exclusive for one trip. Instead follow the ALTERNATIVE PATH CLOSE rule in the system prompt (one italicized line at the end of the description)._`
      )
    }
    if (blocks.length > 0) activeBonusBlock = blocks.join('\n\n')
  }

  // 3) Verified gap fields (admin-supplied values from prior chips).
  let verifiedGapBlock = ''
  const filled = (filledGaps ?? []).filter(
    (g) => typeof g.filled === 'string' && g.filled!.trim().length > 0
  )
  if (filled.length > 0) {
    const lines = filled.map((g) => `- **${g.field}:** ${g.filled!.trim()}`)
    verifiedGapBlock =
      `### Verified gap fields (admin-supplied — include as bullets)\n\n` +
      lines.join('\n') +
      `\n\n_These were flagged as unknown on a prior draft; admin filled them in. Surface each as a real bullet in the "What qualifies" block. Remove from gaps_acknowledged in your output._`
  }

  // 4) Verified official T&Cs (highest authority).
  const verifiedTermsBlock =
    verifiedTerms && verifiedTerms.trim().length > 0
      ? `### VERIFIED OFFICIAL TERMS (authoritative — overrides raw_text on conflict)\n\n` +
        verifiedTerms.trim() +
        `\n\n_The text above is the program's own published terms. Treat as ground truth. Extract every applicable promo-term field (booking window, travel window, eligibility, exclusions, routing, registration, etc.) as a real bullet in the description. Only list a field in gaps_acknowledged if it is genuinely absent from BOTH this block AND the source article._`
      : ''

  const ctxParts: string[] = []
  if (verifiedTermsBlock) ctxParts.push(verifiedTermsBlock)
  if (programSections.length) ctxParts.push(programSections.join('\n\n---\n\n'))
  if (activeBonusBlock) ctxParts.push(activeBonusBlock)
  if (verifiedGapBlock) ctxParts.push(verifiedGapBlock)
  const extra_context = ctxParts.length > 0 ? ctxParts.join('\n\n---\n\n') : null

  return { extra_context, faq_program_slugs }
}
