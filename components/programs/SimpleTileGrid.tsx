import { marked } from 'marked'
import type { Program, TransferPartnerRow } from '@/utils/supabase/queries'
import SimpleTile from './SimpleTile'
import TransferPartnersTable, { isPublishableTransferRow } from './TransferPartnersTable'
import TierBenefitsTable from './TierBenefitsTable'
import MemberProgramsTable from './MemberProgramsTable'
import HotelAwardChartTable from './HotelAwardChartTable'
import FreeNightCertsTable from './FreeNightCertsTable'

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
  inboundRows,
}: {
  program: Program
  programNameBySlug: Map<string, string>
  /** "Ways to earn more" rows derived from other programs' outbound lists
   *  (the source of truth). When provided, replaces the legacy
   *  program.transfer_partners column so the section can never drift. */
  inboundRows?: TransferPartnerRow[]
}) {
  const isAlliance = program.type === 'alliance'
  const isHotel = program.type === 'hotel'

  const hasAwardChart = !!program.award_chart?.trim() && !isAlliance
  const hasCategoryChart = (program.award_category_chart?.length ?? 0) > 0 && !isAlliance
  const hasFreeNightCerts = (program.free_night_certs?.length ?? 0) > 0 && !isAlliance
  // INBOUND partners: programs that transfer INTO this one (closed-loop
  // airline co-brands). OUTBOUND partners: where this program's points go
  // (transferable currencies + hotels + Avios family). Each gets its own
  // tile when present. See migration 301.
  // Count only publishable rows — draft/unconfirmed rows must not gate or
  // label a section (they're filtered out of the table render too).
  const waysToEarnRows = inboundRows ?? program.transfer_partners ?? []
  const inboundCount = waysToEarnRows.filter(isPublishableTransferRow).length
  const outboundCount = (program.transfer_partners_outbound ?? []).filter(isPublishableTransferRow).length
  const hasPartners = inboundCount > 0 && !isAlliance
  const hasOutboundPartners = outboundCount > 0 && !isAlliance
  const hasMembers = isAlliance && (program.member_programs?.length ?? 0) > 0
  const hasSweetSpots = !!program.sweet_spots?.trim()
  const hasQuirks = !!program.quirks?.trim()
  const hasHowToSpend = !!program.how_to_spend?.trim() && !isAlliance
  const hasTiers = (program.tier_benefits?.length ?? 0) > 0
  const hasLounge = !!program.lounge_access?.trim()

  if (
    !hasAwardChart &&
    !hasPartners &&
    !hasOutboundPartners &&
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

  const partnerCount = inboundCount
  const tierCount = program.tier_benefits?.length ?? 0
  const memberCount = program.member_programs?.length ?? 0

  return (
    <section aria-label="Program sections" className="rg-simple-tile-grid">
      {awardChartHtml && (
        <SimpleTile
          title="Award chart"
          description="The actual numbers. Get your nerd on, memorize the cheap ones."
          cta="See the rates"
          preview="The cheat sheet."
        >
          <div className="rg-prose" dangerouslySetInnerHTML={{ __html: awardChartHtml }} />
        </SimpleTile>
      )}

      {hasCategoryChart && (
        <SimpleTile
          title="Award category chart"
          description="Points per night by category, with off-peak, standard, and peak pricing."
          cta="See the bands"
          preview="What a night costs, category by category."
        >
          <HotelAwardChartTable rows={program.award_category_chart!} />
        </SimpleTile>
      )}

      {sweetSpotsHtml && (
        <SimpleTile
          title="Sweet spots"
          description="Where your points punch above their weight."
          cta="Show me the picks"
          preview="Where this currency genuinely shines."
        >
          <div className="rg-prose" dangerouslySetInnerHTML={{ __html: sweetSpotsHtml }} />
        </SimpleTile>
      )}

      {hasOutboundPartners && (
        <SimpleTile
          title="Transfer partners"
          description={`${outboundCount} place${outboundCount === 1 ? '' : 's'} to send these points. Where the currency goes.`}
          cta="Meet the partners"
          preview={`${outboundCount} program${outboundCount === 1 ? '' : 's'} this transfers out to.`}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '0.75rem',
            }}
          >
            {program.name} transfers points or miles OUT to these programs.
          </p>
          <TransferPartnersTable
            rows={program.transfer_partners_outbound ?? []}
            programNameBySlug={programNameBySlug}
            direction="outbound"
          />
        </SimpleTile>
      )}

      {hasPartners && (
        <SimpleTile
          title="Ways to earn more"
          description="How to get more points."
          cta="See inbound paths"
          preview={`${partnerCount} program${partnerCount === 1 ? '' : 's'} that transfer${partnerCount === 1 ? 's' : ''} in.`}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '0.75rem',
            }}
          >
            Programs that transfer points or miles into {program.name}.
          </p>
          <TransferPartnersTable
            rows={waysToEarnRows}
            programNameBySlug={programNameBySlug}
            direction="inbound"
          />
        </SimpleTile>
      )}

      {hasMembers && (
        <SimpleTile
          title="Member airlines"
          description={`${memberCount} carriers in the alliance. Status follows you across all of them.`}
          cta="Browse the roster"
          preview={`${memberCount} carriers + status crossover.`}
        >
          <MemberProgramsTable rows={program.member_programs ?? []} programNameBySlug={programNameBySlug} />
        </SimpleTile>
      )}

      {hasTiers && (
        <SimpleTile
          title="Tier benefits"
          description={`The status ladder. ${tierCount} rung${tierCount === 1 ? '' : 's'}, each unlocking better lounges, bags, and bragging rights.`}
          cta="Climb the ladder"
          preview={`${tierCount} status level${tierCount === 1 ? '' : 's'}.`}
        >
          <TierBenefitsTable rows={program.tier_benefits ?? []} />
        </SimpleTile>
      )}

      {hasFreeNightCerts && (
        <SimpleTile
          title="Free Night Certificates"
          description="Annual free-night awards from co-brand cards, with category ceilings and conditions."
          cta="See the certs"
          preview="The yearly free nights and where they work."
        >
          <FreeNightCertsTable rows={program.free_night_certs!} />
        </SimpleTile>
      )}

      {loungeAccessHtml && (
        <SimpleTile
          title="Lounge access"
          description={
            isHotel
              ? 'Club lounges and breakfast: who gets in.'
              : 'Where to vanish before takeoff. Your status (or ticket) opens which doors.'
          }
          cta="See the rules"
          preview="Who gets in, who doesn't, and the carve-outs."
        >
          <div className="rg-prose" dangerouslySetInnerHTML={{ __html: loungeAccessHtml }} />
        </SimpleTile>
      )}

      {howToSpendHtml && (
        <SimpleTile
          title="How to spend"
          description="The high-leverage moves. Read this before you transfer a single mile."
          cta="Get the playbook"
          preview="The smart-money plays."
        >
          <div className="rg-prose" dangerouslySetInnerHTML={{ __html: howToSpendHtml }} />
        </SimpleTile>
      )}

      {quirksHtml && (
        <SimpleTile
          title="Tips & quirks"
          description="Stopover rules, surcharges, the stuff nobody tells you until you've been burned once."
          cta="Spill the gotchas"
          preview="The fine print, decoded."
        >
          <div className="rg-prose" dangerouslySetInnerHTML={{ __html: quirksHtml }} />
        </SimpleTile>
      )}
    </section>
  )
}
