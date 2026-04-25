import Link from 'next/link'
import type { Program, Alliance } from '@/utils/supabase/queries'

const ALLIANCE_LABEL: Record<Alliance, string> = {
  skyteam:        'SkyTeam',
  star_alliance:  'Star Alliance',
  oneworld:       'oneworld',
  none:           'Independent',
  other:          'Partnership',
}

const ALLIANCE_BADGE_COLOR: Record<Alliance, string> = {
  skyteam:       '#0033A0',  // SkyTeam navy
  star_alliance: '#1A1A1A',  // Star Alliance black
  oneworld:      '#C8102E',  // oneworld red
  none:          '#4A4A4A',
  other:         '#4A4A4A',
}

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
  sections,
}: {
  program: Program
  activeAlertCount: number
  totalAlertCount: number
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
      {/* Type label */}
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
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

      {/* Active offer callout banner */}
      {activeAlertCount > 0 && (
        <Link
          href="#alerts"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.75rem 1rem',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-card)',
            color: 'var(--color-text-primary)',
            textDecoration: 'none',
            marginBottom: '1.25rem',
          }}
        >
          <span style={{ fontSize: '1.125rem' }} aria-hidden="true">🔥</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem' }}>
            <strong>{activeAlertCount} active offer{activeAlertCount === 1 ? '' : 's'}</strong> for {program.name} — see what's live
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
            }}
          >
            View →
          </span>
        </Link>
      )}

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
