/**
 * Small reusable banner that sits below the hero on Hub tool pages that
 * deal with redemption pricing. Sets honest expectations: we publish
 * chart-based pricing, not live availability. Users still need to verify
 * space on the operating airline's site before transferring miles.
 */
export default function ChartDisclaimer({
  className = '',
}: {
  className?: string
}) {
  return (
    <p
      className={className}
      style={{
        margin: '0 0 1.5rem',
        padding: '0.625rem 0.875rem',
        background: 'var(--color-background-soft)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-ui)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.8125rem',
        color: 'var(--color-text-secondary)',
        lineHeight: 1.5,
      }}
    >
      <strong style={{ color: 'var(--color-text-primary)' }}>Heads up:</strong>{' '}
      pricing here comes from published partner award charts, not live
      availability. Always confirm the seat on the operating airline&apos;s
      site before transferring miles in.
    </p>
  )
}
