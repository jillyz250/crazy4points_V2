import { marked } from 'marked'
import type { Program } from '@/utils/supabase/queries'
import Tile from './Tile'
import TransferPartnersTable from './TransferPartnersTable'
import TierBenefitsTable from './TierBenefitsTable'
import MemberProgramsTable from './MemberProgramsTable'

/**
 * Asymmetric 12-column tile grid for the program-page reference
 * sections. Replaces ProgramPageContent.tsx for everything BUT the
 * intro (which renders separately above the grid).
 *
 * Each tile is a server-rendered <details> element. Click the summary
 * → expand inline. Content stays in DOM when collapsed so LLM crawlers
 * still index it.
 *
 * Tile span allocation (desktop, 12-col):
 *   - Award chart:        span 7  (hero tile, widest)
 *   - Sweet spots:        span 5
 *   - Transfer partners:  span 4
 *   - Tier benefits:      span 4
 *   - Lounges:            span 4
 *   - How to spend:       span 6
 *   - Tips & quirks:      span 6
 *
 * Tile categories drive the hairline color under the eyebrow:
 *   - Reference (gold)  — chart, partners, tier benefits, lounges
 *   - Live (purple)     — sweet spots
 *   - Opinion (black)   — how to spend, tips & quirks
 *
 * Each tile carries an oversized Playfair stat as its visual
 * fingerprint (no icons, no decoration — just numbers as identity).
 */
export default async function ProgramTilesGrid({
  program,
  programNameBySlug,
}: {
  program: Program
  programNameBySlug: Map<string, string>
}) {
  const isAlliance = program.type === 'alliance'

  // Detect which content is present so we only render populated tiles.
  const hasAwardChart = !!program.award_chart?.trim() && !isAlliance
  const hasPartners = (program.transfer_partners?.length ?? 0) > 0 && !isAlliance
  const hasMembers = isAlliance && (program.member_programs?.length ?? 0) > 0
  const hasSweetSpots = !!program.sweet_spots?.trim()
  const hasQuirks = !!program.quirks?.trim()
  const hasHowToSpend = !!program.how_to_spend?.trim() && !isAlliance
  const hasTiers = (program.tier_benefits?.length ?? 0) > 0
  const hasLounge = !!program.lounge_access?.trim()

  // Pre-parse markdown to HTML on the server.
  const awardChartHtml = hasAwardChart
    ? await marked.parse(program.award_chart!, { async: true })
    : null
  const sweetSpotsHtml = hasSweetSpots
    ? await marked.parse(program.sweet_spots!, { async: true })
    : null
  const quirksHtml = hasQuirks
    ? await marked.parse(program.quirks!, { async: true })
    : null
  const howToSpendHtml = hasHowToSpend
    ? await marked.parse(program.how_to_spend!, { async: true })
    : null
  const loungeAccessHtml = hasLounge
    ? await marked.parse(program.lounge_access!, { async: true })
    : null

  // Counts feed the oversized stat numerals.
  const partnerCount = program.transfer_partners?.length ?? 0
  const tierCount = program.tier_benefits?.length ?? 0
  const memberCount = program.member_programs?.length ?? 0

  // Bail when nothing to show.
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

  let i = 0
  const idx = () => String(++i).padStart(2, '0')

  return (
    <section aria-label="Program sections">
      {/* Section eyebrow + 48px gold rule rhymes with Live Now + Promos */}
      <div
        aria-hidden
        style={{
          width: '48px',
          height: '2px',
          background: 'var(--color-accent)',
          marginBottom: '0.625rem',
        }}
      />
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-primary)',
          margin: 0,
        }}
      >
        Explore the program
      </p>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0.25rem 0 1.5rem',
          lineHeight: 1.2,
        }}
      >
        Reference & deep dives
      </h2>

      <div className="rg-tile-grid">
        {awardChartHtml && (
          <Tile
            index={idx()}
            category="Reference"
            title="Award chart"
            teaser={`Official redemption costs from ${program.name}.`}
            stat="View"
            statLabel="The rules"
            span={7}
          >
            <div
              className="rg-prose"
              dangerouslySetInnerHTML={{ __html: awardChartHtml }}
            />
          </Tile>
        )}

        {sweetSpotsHtml && (
          <Tile
            index={idx()}
            category="Live"
            title="Sweet spots"
            teaser="Routes worth pricing now, curated by hand."
            stat="★"
            statLabel="Curator picks"
            span={5}
          >
            <div
              className="rg-prose"
              dangerouslySetInnerHTML={{ __html: sweetSpotsHtml }}
            />
          </Tile>
        )}

        {hasPartners && (
          <Tile
            index={idx()}
            category="Reference"
            title="Transfer partners"
            teaser="Every currency that transfers into this program, with ratios."
            stat={partnerCount}
            statLabel="Currencies"
            span={4}
          >
            <TransferPartnersTable
              rows={program.transfer_partners ?? []}
              programNameBySlug={programNameBySlug}
            />
          </Tile>
        )}

        {hasMembers && (
          <Tile
            index={idx()}
            category="Reference"
            title="Member airlines"
            teaser={`Carriers in the ${program.name} alliance.`}
            stat={memberCount}
            statLabel="Airlines"
            span={4}
          >
            <MemberProgramsTable
              rows={program.member_programs ?? []}
              programNameBySlug={programNameBySlug}
            />
          </Tile>
        )}

        {hasTiers && (
          <Tile
            index={idx()}
            category="Reference"
            title="Tier benefits"
            teaser="Status levels, qualification, and what each one unlocks."
            stat={tierCount}
            statLabel="Tiers"
            span={4}
          >
            <TierBenefitsTable rows={program.tier_benefits ?? []} />
          </Tile>
        )}

        {loungeAccessHtml && (
          <Tile
            index={idx()}
            category="Reference"
            title="Lounge access"
            teaser="Which lounges your status (or ticket) gets you into."
            stat="Network"
            statLabel="Access map"
            span={4}
          >
            <div
              className="rg-prose"
              dangerouslySetInnerHTML={{ __html: loungeAccessHtml }}
            />
          </Tile>
        )}

        {howToSpendHtml && (
          <Tile
            index={idx()}
            category="Opinion"
            title="How to spend"
            teaser="Where this currency punches above its weight, in practice."
            stat="Spend"
            statLabel="The take"
            span={6}
          >
            <div
              className="rg-prose"
              dangerouslySetInnerHTML={{ __html: howToSpendHtml }}
            />
          </Tile>
        )}

        {quirksHtml && (
          <Tile
            index={idx()}
            category="Opinion"
            title="Tips & quirks"
            teaser="Stopover rules, taxes, gotchas — the stuff that bites you."
            stat="Tips"
            statLabel="What to know"
            span={6}
          >
            <div
              className="rg-prose"
              dangerouslySetInnerHTML={{ __html: quirksHtml }}
            />
          </Tile>
        )}
      </div>
    </section>
  )
}
