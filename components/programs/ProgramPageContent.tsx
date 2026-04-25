import { marked } from 'marked'
import type { Program } from '@/utils/supabase/queries'
import TransferPartnersTable from './TransferPartnersTable'

/**
 * Renders the editorial content sections for a program (intro / transfer
 * partners / sweet spots / quirks). Returns null if the program has no
 * content set yet — caller can fall back to alerts-only layout.
 *
 * All markdown fields (intro/sweet_spots/quirks) are rendered as HTML via
 * marked. Transfer partners JSONB renders as a structured table.
 */
export default async function ProgramPageContent({
  program,
  programNameBySlug,
}: {
  program: Program
  programNameBySlug: Map<string, string>
}) {
  const hasIntro = !!program.intro?.trim()
  const hasPartners = (program.transfer_partners?.length ?? 0) > 0
  const hasSweetSpots = !!program.sweet_spots?.trim()
  const hasQuirks = !!program.quirks?.trim()
  const hasAny = hasIntro || hasPartners || hasSweetSpots || hasQuirks

  if (!hasAny) return null

  const introHtml = hasIntro ? await marked.parse(program.intro!, { async: true }) : null
  const sweetSpotsHtml = hasSweetSpots ? await marked.parse(program.sweet_spots!, { async: true }) : null
  const quirksHtml = hasQuirks ? await marked.parse(program.quirks!, { async: true }) : null

  const sectionStyle: React.CSSProperties = {
    marginBottom: '2.5rem',
  }
  const headingStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--color-primary)',
    marginBottom: '0.75rem',
  }
  const proseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    lineHeight: 1.65,
    color: 'var(--color-text-primary)',
  }

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {introHtml && (
        <section
          style={{
            ...sectionStyle,
            padding: '1.25rem 1.5rem',
            background: 'var(--color-background-soft)',
            borderRadius: 'var(--radius-card)',
            borderLeft: '3px solid var(--color-primary)',
          }}
        >
          <div
            style={proseStyle}
            className="rg-prose"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
        </section>
      )}

      {hasPartners && (
        <section style={sectionStyle}>
          <h2 style={headingStyle}>Transfer partners</h2>
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
            rows={program.transfer_partners!}
            programNameBySlug={programNameBySlug}
          />
        </section>
      )}

      {sweetSpotsHtml && (
        <section style={sectionStyle}>
          <h2 style={headingStyle}>Sweet spots</h2>
          <div
            style={proseStyle}
            className="rg-prose"
            dangerouslySetInnerHTML={{ __html: sweetSpotsHtml }}
          />
        </section>
      )}

      {quirksHtml && (
        <section style={sectionStyle}>
          <h2 style={headingStyle}>Tips & quirks</h2>
          <div
            style={proseStyle}
            className="rg-prose"
            dangerouslySetInnerHTML={{ __html: quirksHtml }}
          />
        </section>
      )}
    </div>
  )
}
