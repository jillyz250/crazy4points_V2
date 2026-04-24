import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        border: '1px dashed var(--admin-border-strong)',
        borderRadius: 'var(--admin-radius-lg)',
        background: 'var(--admin-surface)',
      }}
    >
      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--admin-text)' }}>
        {title}
      </div>
      {description && (
        <p style={{ marginTop: '0.375rem', fontSize: '0.875rem' }}>{description}</p>
      )}
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  )
}
