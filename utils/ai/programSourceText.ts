/**
 * Builds an authoritative source-text block from a Program row's official
 * page content. Used by the writer (so drafts cite Page-level facts) and the
 * fact-checker (so claims about a program are grounded against the official
 * page, not just an alert blurb).
 */
import type { Program } from '@/utils/supabase/queries'

type ProgramSubset = Pick<
  Program,
  | 'name'
  | 'slug'
  | 'type'
  | 'intro'
  | 'award_chart'
  | 'sweet_spots'
  | 'how_to_spend'
  | 'quirks'
  | 'lounge_access'
  | 'transfer_partners'
  | 'tier_benefits'
  | 'alliance'
  | 'hubs'
  | 'description'
>

export const PROGRAM_FIELDS_FOR_SOURCE =
  'slug, name, type, intro, award_chart, sweet_spots, how_to_spend, quirks, lounge_access, transfer_partners, tier_benefits, alliance, hubs, description'

export function programToSourceText(program: ProgramSubset): string {
  const out: string[] = []
  out.push(`# ${program.name} (${program.slug})`)
  if (program.type) out.push(`Type: ${program.type}`)
  if (program.alliance) out.push(`Alliance: ${program.alliance}`)
  if (program.hubs && program.hubs.length > 0) out.push(`Hubs: ${program.hubs.join(', ')}`)
  if (program.description) out.push(`\nDescription:\n${program.description}`)
  if (program.intro) out.push(`\nIntro:\n${program.intro}`)
  // Award chart is the most authoritative reference data we have. Place it
  // prominently so the writer + fact-checker see it before editorial sweet
  // spots / quirks.
  if (program.award_chart) {
    out.push(`\nOFFICIAL AWARD CHART (source of truth for redemption costs):\n${program.award_chart}`)
  }
  if (program.sweet_spots) out.push(`\nSweet spots:\n${program.sweet_spots}`)
  if (program.how_to_spend) out.push(`\nHow to spend:\n${program.how_to_spend}`)
  if (program.quirks) out.push(`\nQuirks / fine print:\n${program.quirks}`)
  if (program.lounge_access) out.push(`\nLounge access:\n${program.lounge_access}`)
  if (program.transfer_partners && program.transfer_partners.length > 0) {
    const lines = program.transfer_partners.map((p) => {
      const bonus = p.bonus_active ? ' (BONUS ACTIVE)' : ''
      const notes = p.notes ? ` — ${p.notes}` : ''
      return `• ${p.from_slug} → ${program.slug} ratio ${p.ratio}${bonus}${notes}`
    })
    out.push(`\nTransfer partners:\n${lines.join('\n')}`)
  }
  if (program.tier_benefits && program.tier_benefits.length > 0) {
    const lines = program.tier_benefits.map((t) => {
      return `• ${t.name} — qualifies via ${t.qualification}\n  benefits: ${t.benefits.join('; ')}`
    })
    out.push(`\nTier benefits:\n${lines.join('\n')}`)
  }
  return out.join('\n')
}

export function programsToSourceText(programs: ProgramSubset[]): string {
  if (programs.length === 0) return ''
  return programs.map(programToSourceText).join('\n\n═══════════════════════════════════════════\n\n')
}
