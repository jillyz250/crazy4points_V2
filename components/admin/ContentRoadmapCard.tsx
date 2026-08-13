import Link from 'next/link'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { roadmapProgress, upNext, pillarLabel } from '@/lib/contentRoadmap'

/**
 * Dashboard content-roadmap summary. Compact by design — progress + the next
 * few to build, with a link to the full /admin/roadmap page. Progress derives
 * from lib/guides.ts (an item is "published" once its guide exists), so
 * publishing a guide advances this with zero bookkeeping.
 */
export default function ContentRoadmapCard() {
  const p = roadmapProgress()
  const next = upNext(3)

  return (
    <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--admin-text)' }}>Content roadmap</h2>
        <Link href="/admin/roadmap" style={{ fontSize: '0.8125rem', color: 'var(--admin-link)' }}>See full roadmap →</Link>
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

      <div style={{ marginTop: '0.9rem', borderTop: '1px solid var(--admin-border)', paddingTop: '0.7rem' }}>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-text-subtle)', fontWeight: 700, marginBottom: '0.45rem' }}>
          Up next
        </div>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {next.map((item, i) => (
            <li key={item.title} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  flex: '0 0 auto', width: '1.3rem', height: '1.3rem', display: 'grid', placeItems: 'center',
                  borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                  background: i === 0 ? 'var(--admin-accent)' : 'var(--admin-accent-soft)',
                  color: i === 0 ? '#fff' : 'var(--admin-accent)',
                }}
              >
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--admin-text)', fontWeight: i === 0 ? 600 : 400 }}>{item.title}</span>
              <Badge tone="neutral">{pillarLabel(item.pillar)}</Badge>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  )
}
