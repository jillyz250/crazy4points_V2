import { marked } from 'marked'
import type { Program } from '@/utils/supabase/queries'
import SimpleTile from './SimpleTile'
import TransferPartnersTable from './TransferPartnersTable'
import TierBenefitsTable from './TierBenefitsTable'
import MemberProgramsTable from './MemberProgramsTable'

/**
 * Uniform 2-column tile grid for program-page reference sections.
 * Replaces the previous asymmetric tile grid + ProgramPageContent
 * dump-everything layout. Matches the admin dashboard tile pattern.
 *
 * Each tile is a server-rendered <details>. Click summary → expand
 * inline. Content stays in DOM when collapsed (AI/LLM citable).
 *
 * Order of tiles is meaningful — most-clicked first. Award chart and
 * Sweet spots lead because they're the reader's primary "what can I
 * book and how much does it cost" questions.
 */
export default async function SimpleTileGrid({
  program,
  programNameBySlug,
}: {
  program: Program
  programNameBySlug: Map<string, string>
}) {
  const isAlliance = program.type === 'alliance'

  const hasAwardChart = !!program.award_chart?.trim() && !isAlliance
  const hasPartners = (program.transfer_partners?.length ?? 0) > 0 && !isAlliance
  const hasMembers = isAlliance && (program.member_programs?.length ?? 0) > 0
  const hasSweetSpots = !!program.sweet_spots?.trim()
  const hasQuirks = !!program.quirks?.trim()
  const hasHowToSpend = !!program.how_to_spend?.trim() && !isAlliance
  const hasTiers = (program.tier_benefits?.length ?? 0) > 0
  const hasLounge = !!program.lounge_access?.trim()

  if (
    !hasAwardChart &&
    !hasPartners &&
    !hasMembers &&
    !hasSweetSpots &&
    !hasQuirks &&
    !hasHowToSpend &&
    !hasTiers &&
    !hasLounge
  ) {
    return null
  }

  // Pre-parse markdown server-side
  const awardChartHtml = hasAwardChart ? await marked.parse(program.award_chart!, { async: true }) : null
  const sweetSpotsHtml = hasSweetSpots ? await marked.parse(program.sweet_spots!, { async: true }) : null
  const quirksHtml = hasQuirks ? await marked.parse(program.quirks!, { async: true }) : null
  const howToSpendHtml = hasHowToSpend ? await marked.parse(program.how_to_spend!, { async: true }) : null
  const loungeAccessHtml = hasLounge ? await marked.parse(program.lounge_access!, { async: true }) : null

  const partnerCount = program.transfer_partners?.length ?? 0
  const tierCount = program.tier_benefits?.length ?? 0
  const memberCount = program.member_programs?.length ?? 0

  return (
    <section aria-label="Program sections" className="rg-simple-tile-grid">
      {awardChartHtml && (
        <SimpleTile
          title="Award chart"
          description={`Official redemption costs from ${program.name}.`}
        >
          <div className="rg-prose" dangerouslySetInnerHTML={{ __html: awardChartHtml }} />
        </SimpleTile>
      )}

      {sweetSpotsHtml && (
        <SimpleTile
          title="Sweet spots"
          description="Routes worth pricing right now, hand-curated."
        >
          <div className="rg-prose" dangerouslySetInnerHTML={{ __html: sweetSpotsHtml }} />
        </SimpleTile>
      )}

      {hasPartners && (
        <SimpleTile
          title="Transfer partners"
          description={`${partnerCount} currenc${partnerCount === 1 ? 'y' : 'ies'} transfer into this program.`}
        >
          <TransferPartnersTable rows={program.transfer_partners ?? []} programNameBySlug={programNameBySlug} />
        </SimpleTile>
      )}

      {hasMembers && (
        <SimpleTile
          title="Member airlines"
          description={`${memberCount} carriers in the alliance, with status crossover.`}
        >
          <MemberProgramsTable rows={program.member_programs ?? []} programNameBySlug={programNameBySlug} />
        </SimpleTile>
      )}

      {hasTiers && (
        <SimpleTile
          title="Tier benefits"
          description={`${tierCount} status level${tierCount === 1 ? '' : 's'}, qualification rules, and what each unlocks.`}
        >
          <TierBenefitsTable rows={program.tier_benefits ?? []} />
        </SimpleTile>
      )}

      {loungeAccessHtml && (
        <SimpleTile
          title="Lounge access"
          description="Which lounges your status or ticket gets you into."
        >
          <div className="rg-prose" dangerouslySetInnerHTML={{ __html: loungeAccessHtml }} />
        </SimpleTile>
      )}

      {howToSpendHtml && (
        <SimpleTile
          title="How to spend"
          description="Where this currency punches above its weight."
        >
          <div className="rg-prose" dangerouslySetInnerHTML={{ __html: howToSpendHtml }} />
        </SimpleTile>
      )}

      {quirksHtml && (
        <SimpleTile
          title="Tips & quirks"
          description="Stopover rules, taxes, gotchas — the stuff that bites you."
        >
          <div className="rg-prose" dangerouslySetInnerHTML={{ __html: quirksHtml }} />
        </SimpleTile>
      )}
    </section>
  )
}
