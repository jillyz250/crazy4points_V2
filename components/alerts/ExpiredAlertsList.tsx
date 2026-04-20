import Link from 'next/link'
import type { AlertWithPrograms } from '@/utils/supabase/queries'

function formatEnded(endDate: string | null): string {
  if (!endDate) return 'ended'
  const d = new Date(endDate)
  if (isNaN(d.getTime())) return 'ended'
  return `ended ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export default function ExpiredAlertsList({
  alerts,
}: {
  alerts: AlertWithPrograms[]
}) {
  if (alerts.length === 0) {
    return (
      <p className="font-body text-sm text-[var(--color-text-secondary)]">
        No expired alerts in the archive yet.
      </p>
    )
  }

  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        borderTop: '1px solid var(--color-border-soft)',
      }}
    >
      {alerts.map((a) => (
        <li
          key={a.id}
          style={{
            borderBottom: '1px solid var(--color-border-soft)',
            padding: '0.625rem 0',
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#991b1b',
              background: '#fee2e2',
              padding: '2px 6px',
              borderRadius: '3px',
              flexShrink: 0,
            }}
          >
            Expired
          </span>
          <Link
            href={`/alerts/${a.slug}`}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              flex: '1 1 auto',
              minWidth: 0,
            }}
            className="hover:text-[var(--color-primary)] hover:underline"
          >
            {a.title}
          </Link>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              flexShrink: 0,
            }}
          >
            {a.type.replace(/_/g, ' ')} · {formatEnded(a.end_date)}
          </span>
        </li>
      ))}
    </ul>
  )
}
