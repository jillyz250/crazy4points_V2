import Link from 'next/link'
import type { Program, Alliance } from '@/utils/supabase/queries'
import { ALLIANCE_LABEL, ALLIANCE_BADGE_COLOR } from '@/lib/alliance'

/**
 * Hero block for the public program page. Replaces the previous formal
 * type-label-then-title layout with a richer header carrying badges
 * (alliance, hubs, active alerts), an active-alerts callout banner when
 * any are live, and a section anchor table-of-contents that flows
 * inline (sticky on tall viewports via parent layout).
 */
export default function ProgramPageHero({
  program,
  activeAlertCount,
  totalAlertCount,
  partners = [],
  homeCarrierSlugs = [],
  sections,
}: {
  program: Program
  activeAlertCount: number
  totalAlertCount: number
  /** Distinct operating-carrier programs derived from partner_redemptions.
   *  Renders as clickable partner pills next to the alliance/hubs row.
   *  Empty array hides the partners row entirely. */
  partners?: Array<{ slug: string; name: string }>
  /** Slugs of programs whose parent_program_slug === this program — i.e.
   *  the "home carriers" (Air France + KLM for Flying Blue; BA + Iberia
   *  for Avios; Alaska + Hawaiian for Atmos). Pills matching these get
   *  a bolder treatment so the eye lands on the operator first. */
  homeCarrierSlugs?: string[]
  sections: Array<{ id: string; label: string }>
}) {
  const alliance = program.alliance as Alliance | null
  const hubs = program.hubs ?? []
  const updated = program.content_updated_at
    ? new Date(program.content_updated_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <header style={{ marginBottom: '2rem' }}>
      {/* Type label — small, light. Tones down per 2026-05-13 audit
          so it doesn't compete with the Playfair title below. */}
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.625rem',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#9CA3AF',
          marginBottom: '0.375rem',
        }}
      >
        {program.type.replace(/_/g, ' ')}
      </p>

      {/* Title */}
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 5vw, 2.75rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          marginBottom: '0.875rem',
          color: 'var(--color-text-primary)',
        }}
      >
        {program.name}
      </h1>

      {/* Badge row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        {alliance && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.3rem 0.7rem',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#fff',
              background: ALLIANCE_BADGE_COLOR[alliance],
              borderRadius: '9999px',
            }}
          >
            {ALLIANCE_LABEL[alliance]}
          </span>
        )}

        {hubs.length > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.7rem',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              background: 'var(--color-background-soft)',
              border: '1px solid var(--color-border-soft)',
              borderRadius: '9999px',
            }}
          >
            <span style={{ color: 'var(--color-text-secondary)' }}>HUBS</span>
            <span>{hubs.join(' · ')}</span>
          </span>
        )}

        {activeAlertCount > 0 ? (
          <Link
            href="#alerts"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.3rem 0.7rem',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#fff',
              background: 'var(--color-primary)',
              borderRadius: '9999px',
              textDecoration: 'none',
            }}
          >
            {activeAlertCount} active alert{activeAlertCount === 1 ? '' : 's'} →
          </Link>
        ) : (
          totalAlertCount > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                padding: '0.3rem 0.5rem',
              }}
            >
              {totalAlertCount} archived alert{totalAlertCount === 1 ? '' : 's'}
            </span>
          )
        )}

        {updated && (
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
            }}
          >
            Last reviewed {updated}
          </span>
        )}
      </div>

      {/* Partner pills row — only renders when partner_redemptions rows
          exist for this program. Surfaces bilateral partnerships (e.g.
          JetBlue's Blue Sky with United) and the partner-redemption
          roster generally. Each pill links to the partner program page. */}
      {partners.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
            alignItems: 'center',
            marginBottom: '0.75rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px dashed var(--color-border-soft)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginRight: '0.125rem',
            }}
          >
            Redeems on:
          </span>
          {partners.map((p) => {
            const isHome = homeCarrierSlugs.includes(p.slug)
            return (
              <Link
                key={p.slug}
                href={`/programs/${p.slug}`}
                className="rg-partner-pill"
                data-home={isHome ? 'true' : undefined}
              >
                {p.name}
              </Link>
            )
          })}
        </div>
      )}

      {/* Old active offer banner removed — LiveBarsHero now renders
          the LIVE TRANSFER BONUS / PROMO REWARDS bars at top of page. */}

      {/* Section TOC */}
      {sections.length > 0 && (
        <nav
          aria-label="On this page"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
            alignItems: 'center',
            paddingBottom: '0.875rem',
            borderBottom: '1px solid var(--color-border-soft)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginRight: '0.25rem',
            }}
          >
            Jump to:
          </span>
          {sections.map((s) => (
            <Link key={s.id} href={`#${s.id}`} className="program-toc-link">
              {s.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
