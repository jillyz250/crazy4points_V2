import { createAdminClient } from '@/utils/supabase/server'
import { getSources, getLastFindingBySource } from '@/utils/supabase/queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { LinkButton } from '@/components/admin/ui/Button'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import SourcesTable from './SourcesTable'

type SourceHealthRow = {
  is_active?: boolean | null
  last_scraped_at?: string | null
  items_produced?: number | null
  name?: string | null
}

export default async function AdminSourcesPage() {
  const supabase = createAdminClient()
  const [sources, lastFindingsMap] = await Promise.all([
    getSources(supabase),
    getLastFindingBySource(supabase),
  ])

  // Map → plain object for the client component
  const lastFindings: Record<string, string> = {}
  for (const [name, iso] of lastFindingsMap.entries()) {
    if (iso) lastFindings[name] = iso
  }

  // ── Source health (Priya) — is every active source actually pulling? ──
  // stale = active but not scraped in 14d; quiet = active + scraped but has
  // produced 0 items ever (a silently-dead feed). Both are things to fix.
  const cutoff = Date.now() - 14 * 86_400_000
  const rows = sources as SourceHealthRow[]
  const active = rows.filter((s) => s.is_active)
  const stale = active.filter((s) => {
    const t = s.last_scraped_at ? Date.parse(s.last_scraped_at) : null
    return t == null || t < cutoff
  })
  const quiet = active.filter((s) => (s.items_produced ?? 0) === 0)
  const healthOk = stale.length === 0 && quiet.length === 0

  return (
    <div>
      <PageHeader
        title="Sources"
        description="Intelligence sources scraped by Claude Scout. Control tiers, frequency, and activity."
        actions={<LinkButton href="/admin/sources/new" variant="primary">+ Add Source</LinkButton>}
      />

      {/* Source health strip — Priya's "are our feeds actually working?" glance. */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14,
        padding: '12px 16px', marginBottom: 16, borderRadius: 12,
        border: '1px solid var(--admin-border)', background: 'var(--admin-surface)',
        fontSize: '0.9rem',
      }}>
        <strong style={{ fontWeight: 800 }}>Source health</strong>
        <span>{active.length} active</span>
        <span style={{ color: stale.length ? 'var(--admin-danger)' : 'var(--admin-text-muted)', fontWeight: stale.length ? 700 : 400 }}>
          {stale.length} not scraped in 14d
        </span>
        <span style={{ color: quiet.length ? 'var(--admin-warning, #9a6a00)' : 'var(--admin-text-muted)', fontWeight: quiet.length ? 700 : 400 }}>
          {quiet.length} producing 0 items
        </span>
        {healthOk && <span style={{ color: 'var(--admin-success)', fontWeight: 700 }}>All feeds pulling ✓</span>}
        {!healthOk && (stale.length + quiet.length) > 0 && (
          <span style={{ color: 'var(--admin-text-muted)' }}>
            &mdash; check: {[...stale, ...quiet].slice(0, 5).map((s) => s.name).filter(Boolean).join(', ')}
            {(stale.length + quiet.length) > 5 ? '…' : ''}
          </span>
        )}
      </div>

      {sources.length === 0 ? (
        <EmptyState title="No sources yet" description="Add one to start feeding Scout." />
      ) : (
        <SourcesTable sources={sources} lastFindings={lastFindings} />
      )}
    </div>
  )
}
