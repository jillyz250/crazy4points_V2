import Link from 'next/link'

export type HubCardProps = {
  title: string
  description: string
  icon?: string // legacy emoji prop — ignored in editorial layout
  href: string
  status: 'live' | 'coming-soon'
  accent?: string
}

const cardBaseStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '1.75rem 1.5rem 1.5rem',
  background: '#fff',
  border: '1px solid var(--color-border-soft)',
  borderRadius: 'var(--radius-card)',
  textDecoration: 'none',
  color: 'var(--color-text-primary)',
  height: '100%',
  minHeight: '11rem',
  position: 'relative',
  transition: 'box-shadow 0.2s ease, transform 0.15s ease, border-color 0.2s ease',
}

function CardInner({
  title,
  description,
  isLive,
}: {
  title: string
  description: string
  isLive: boolean
}) {
  return (
    <>
      {/* Status indicator — top right. Coming-soon variant is more
          prominent now (gold pill instead of grey dot) since the
          previous version was too subtle for readers to register. */}
      {isLive ? (
        <span
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1.25rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.625rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-primary)',
          }}
        >
          <span
            aria-hidden
            style={{
              width: '0.4375rem',
              height: '0.4375rem',
              borderRadius: '999px',
              background: 'var(--color-accent)',
              display: 'inline-block',
            }}
          />
          Live
        </span>
      ) : (
        <span
          style={{
            position: 'absolute',
            top: '0.875rem',
            right: '1rem',
            padding: '0.25rem 0.625rem',
            background: 'var(--color-accent)',
            color: '#3D2A00',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.625rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderRadius: '999px',
          }}
        >
          Coming Soon
        </span>
      )}

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-primary)',
          margin: '0 0 0.625rem',
          lineHeight: 1.15,
          paddingRight: '6rem', // clear the status indicator
        }}
      >
        {title}
      </h3>

      {/* Gold underline accent for live tools only */}
      {isLive && (
        <span
          aria-hidden
          style={{
            display: 'block',
            width: '2rem',
            height: '2px',
            background: 'var(--color-accent)',
            marginBottom: '0.875rem',
          }}
        />
      )}

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
          color: 'var(--color-text-secondary)',
          margin: 0,
          lineHeight: 1.55,
          flex: 1,
        }}
      >
        {description}
      </p>

      <div
        style={{
          marginTop: '1.25rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: isLive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        }}
      >
        {isLive ? 'Open tool →' : 'In the works'}
      </div>
    </>
  )
}

export default function HubCard({
  title,
  description,
  href,
  status,
}: HubCardProps) {
  const isLive = status === 'live'

  // Coming-soon cards render as non-clickable divs. Previously they were
  // <Link>s with aria-disabled, which screen readers respected but mouse
  // clicks still navigated to the (broken) page. Cleaner: no link at all
  // until the tool ships.
  if (!isLive) {
    return (
      <div
        className="rg-hub-card"
        style={{
          ...cardBaseStyle,
          opacity: 0.78,
          cursor: 'not-allowed',
        }}
        aria-disabled
      >
        <CardInner title={title} description={description} isLive={false} />
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="rg-hub-card"
      style={cardBaseStyle}
    >
      <CardInner title={title} description={description} isLive={true} />
    </Link>
  )
}
