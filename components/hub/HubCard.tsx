import Link from 'next/link'

export type HubCardProps = {
  title: string
  description: string
  icon: string // emoji
  href: string
  status: 'live' | 'coming-soon'
  accent?: string // brand accent color override
}

const cardBaseStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '1.5rem 1.25rem',
  background: '#fff',
  border: '1px solid var(--color-border-soft)',
  borderRadius: 'var(--radius-card)',
  textDecoration: 'none',
  color: 'var(--color-text-primary)',
  height: '100%',
  minHeight: '12rem',
  position: 'relative',
  transition: 'box-shadow 0.2s ease, transform 0.15s ease',
}

export default function HubCard({
  title,
  description,
  icon,
  href,
  status,
}: HubCardProps) {
  return (
    <Link href={href} className="rg-hub-card" style={cardBaseStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <span style={{ fontSize: '2rem', lineHeight: 1 }} aria-hidden>
          {icon}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.625rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0.1875rem 0.5rem',
            borderRadius: '999px',
            background:
              status === 'live' ? '#D1FAE5' : 'var(--color-background-soft)',
            color:
              status === 'live' ? '#065F46' : 'var(--color-text-secondary)',
            border:
              status === 'live'
                ? '1px solid #A7F3D0'
                : '1px solid var(--color-border-soft)',
          }}
        >
          {status === 'live' ? 'Live' : 'Coming soon'}
        </span>
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.375rem',
          fontWeight: 700,
          color: 'var(--color-primary)',
          margin: '0 0 0.5rem',
          lineHeight: 1.2,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
          color: 'var(--color-text-secondary)',
          margin: 0,
          lineHeight: 1.5,
          flex: 1,
        }}
      >
        {description}
      </p>
      <div
        style={{
          marginTop: '1rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color:
            status === 'live'
              ? 'var(--color-primary)'
              : 'var(--color-text-secondary)',
        }}
      >
        {status === 'live' ? 'Open tool →' : 'Get notified →'}
      </div>
    </Link>
  )
}
