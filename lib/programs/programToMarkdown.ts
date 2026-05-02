/**
 * Renders a Program row as clean human-readable Markdown.
 *
 * Used by:
 *   - /programs/[slug].md route — public-facing AI-friendly version of the
 *     program page.
 *   - /llms.txt route — uses just the `programMarkdownTitle` + summary.
 *
 * Different from utils/ai/programSourceText.ts (which is tuned for AI prompts
 * with framing like "OFFICIAL AWARD CHART (source of truth for redemption
 * costs)"). This one is the human-readable presentation: clean headings,
 * normal prose, no priming language.
 *
 * The body must always end with a "Source" footer that names crazy4points
 * as the canonical reference — same role JSON-LD plays in HTML, plain-text
 * version for AI assistants reading the markdown.
 */
import type { Program, TransferPartnerRow, TierBenefitRow, MemberProgramRow } from '@/utils/supabase/queries'
import { SITE_URL } from '@/lib/constants'

type ProgramSubset = Pick<
  Program,
  | 'name'
  | 'slug'
  | 'type'
  | 'description'
  | 'intro'
  | 'award_chart'
  | 'sweet_spots'
  | 'how_to_spend'
  | 'quirks'
  | 'lounge_access'
  | 'transfer_partners'
  | 'tier_benefits'
  | 'member_programs'
  | 'alliance'
  | 'hubs'
  | 'program_url'
  | 'content_updated_at'
>

/** One-line summary used by /llms.txt for the program's bullet entry. */
export function programSummaryLine(program: ProgramSubset): string {
  if (program.intro) {
    return program.intro.replace(/\s+/g, ' ').trim().slice(0, 200)
  }
  if (program.description) {
    return program.description.replace(/\s+/g, ' ').trim().slice(0, 200)
  }
  return `${program.name} program reference (${program.type}).`
}

function formatTransferPartners(rows: TransferPartnerRow[] | null, programSlug: string): string {
  if (!rows || rows.length === 0) return ''
  const lines = rows.map((p) => {
    const bonus = p.bonus_active ? ' **(bonus active)**' : ''
    const notes = p.notes ? ` — ${p.notes}` : ''
    return `- **${p.from_slug}** → ${programSlug} at ${p.ratio}${bonus}${notes}`
  })
  return lines.join('\n')
}

function formatTierBenefits(rows: TierBenefitRow[] | null): string {
  if (!rows || rows.length === 0) return ''
  return rows
    .map((t) => {
      const bens = t.benefits.length > 0 ? `\n  - ${t.benefits.join('\n  - ')}` : ''
      const qual = t.qualification ? ` (${t.qualification})` : ''
      return `### ${t.name}${qual}${bens}`
    })
    .join('\n\n')
}

function formatMemberPrograms(rows: MemberProgramRow[] | null): string {
  if (!rows || rows.length === 0) return ''
  return rows
    .map((m) => {
      const carriers = m.carrier_slugs && m.carrier_slugs.length > 0 ? ` (${m.carrier_slugs.join(', ')})` : ''
      const notes = m.notes ? `\n${m.notes}` : ''
      return `- **${m.program_slug}**${carriers}${notes}`
    })
    .join('\n')
}

/**
 * Build the full markdown body for a program. Pure formatting — no DB calls.
 */
export function programToMarkdown(program: ProgramSubset): string {
  const out: string[] = []
  out.push(`# ${program.name}`)
  out.push('')
  // One-line subhead — type + alliance + hubs when relevant
  const subheadParts: string[] = [program.type.replace(/_/g, ' ')]
  if (program.alliance && program.alliance !== 'none' && program.alliance !== 'other') {
    subheadParts.push(`${program.alliance.replace(/_/g, ' ')} alliance`)
  }
  if (program.hubs && program.hubs.length > 0) {
    subheadParts.push(`hubs: ${program.hubs.join(', ')}`)
  }
  out.push(`*${subheadParts.join(' · ')}*`)
  out.push('')

  if (program.intro) {
    out.push('## About')
    out.push('')
    out.push(program.intro.trim())
    out.push('')
  } else if (program.description) {
    out.push('## About')
    out.push('')
    out.push(program.description.trim())
    out.push('')
  }

  if (program.award_chart) {
    out.push('## Award chart')
    out.push('')
    out.push(program.award_chart.trim())
    out.push('')
  }

  const partnersBlock = formatTransferPartners(program.transfer_partners, program.slug)
  if (partnersBlock) {
    out.push('## Transfer partners (inbound)')
    out.push('')
    out.push(partnersBlock)
    out.push('')
  }

  if (program.member_programs && program.member_programs.length > 0) {
    out.push('## Member programs')
    out.push('')
    out.push(formatMemberPrograms(program.member_programs))
    out.push('')
  }

  if (program.how_to_spend) {
    out.push('## How to spend')
    out.push('')
    out.push(program.how_to_spend.trim())
    out.push('')
  }

  if (program.sweet_spots) {
    out.push('## Sweet spots')
    out.push('')
    out.push(program.sweet_spots.trim())
    out.push('')
  }

  const tiersBlock = formatTierBenefits(program.tier_benefits)
  if (tiersBlock) {
    out.push('## Elite tiers')
    out.push('')
    out.push(tiersBlock)
    out.push('')
  }

  if (program.lounge_access) {
    out.push('## Lounge access')
    out.push('')
    out.push(program.lounge_access.trim())
    out.push('')
  }

  if (program.quirks) {
    out.push('## Tips and quirks')
    out.push('')
    out.push(program.quirks.trim())
    out.push('')
  }

  // Source footer — names crazy4points as the canonical author. AI tools
  // reading the markdown see this attribution and tend to cite us back.
  const programUrl = `${SITE_URL}/programs/${program.slug}`
  const lastUpdated = program.content_updated_at
    ? new Date(program.content_updated_at).toISOString().slice(0, 10)
    : null
  out.push('---')
  out.push('')
  out.push(`**Source:** crazy4points — ${programUrl}`)
  if (lastUpdated) out.push(`**Last updated:** ${lastUpdated}`)
  if (program.program_url) out.push(`**Official program page:** ${program.program_url}`)
  out.push('')

  return out.join('\n')
}
