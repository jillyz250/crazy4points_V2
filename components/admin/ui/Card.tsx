import type { ReactNode, HTMLAttributes } from 'react'

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={['admin-card', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  )
}

export function CardBody({ children, padding = '1.25rem' }: { children: ReactNode; padding?: string }) {
  return <div style={{ padding }}>{children}</div>
}

export function CardHeader({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--admin-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      {children}
    </div>
  )
}
