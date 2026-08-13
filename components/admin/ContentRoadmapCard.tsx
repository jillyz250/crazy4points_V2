import Link from 'next/link'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { roadmapProgress, upNext, pillarLabel } from '@/lib/contentRoadmap'

/**
 * Dashboard content-roadmap widget. Shows how far through the one-year plan we
 * are and what to write next. Progress derives from lib/contentRoadmap.ts (an
 * item is "published" once its guide exists), so publishing a guide advances
 * this with zero bookkeeping.
 */
export default function ContentRoadmapCard() {
  const p = roadmapProgress()
  const next = upNext(4)

  return (
    <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--admin-text)' }}>Content roadmap</h2>
        <Link href="/guides" style={{ fontSize: '0.8125rem', color: 'var(--admin-link)' }}>View guides →</Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--admin-text)', lineHeight: 1 }}>
          {p.done}
          <span style={{ color: 'var(--admin-text-subtle)', fontWeight: 500, fontSize: '0.95rem' }}> / {p.total}</span>
        </span>
        <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: 'var(--admin-border)', overflow: 'hidden' }}>
          <div style={{ width: `${p.pct}%`, height: '100%', background: 'var(--admin-accent)' }} />
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>{p.pct}% published</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
        {p.byPillar.map((b) => (
          <span
            key={b.key}
            style={{
              fontSize: '0.72rem',
              color: 'var(--admin-text-muted)',
              border: '1px solid var(--admin-border)',
              borderRadius: '999px',
              padding: '0.15rem 0.5rem',
            }}
          >
            {b.label} <b style={{ color: 'var(--admin-text)' }}>{b.done}/{b.total}</b>
          </span>
        ))}
      </div>

      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--admin-border)', paddingTop: '0.75rem' }}>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-text-subtle)', fontWeight: 700, marginBottom: '0.5rem' }}>
          Up next
        </div>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {next.map((item, i) => (
            <li key={item.title} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  flex: '0 0 auto',
                  width: '1.3rem',
                  height: '1.3rem',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '999px',
                  background: 'var(--admin-accent-soft)',
                  color: 'var(--admin-accent)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--admin-text)' }}>{item.title}</span>
              <Badge tone="neutral">{pillarLabel(item.pillar)}</Badge>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  )
}
