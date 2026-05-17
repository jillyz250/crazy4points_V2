import Link from 'next/link'
import { listAllManualOverrides } from '@/utils/admin/manualOverride'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

export const revalidate = 60

const STALE_DAYS = 180  // overrides older than 6 months flag for re-verification

/**
 * Stale manual-values report.
 *
 * Every credit_card or program field that was manually overridden (because
 * the extraction pipeline couldn't reach it) lives in the manual_overrides
 * jsonb column alongside a set_at timestamp. This page lists all those
 * overrides sorted by age so the editor can periodically re-verify the
 * 1-year-stale ones against the issuer's actual published terms.
 *
 * Why this exists: a manually-set foreign_transaction_fee_pct = 3.0 sits on
 * the card row forever with no automated signal if the issuer changes it.
 * This is the safety valve.
 */
export default async function ManualOverridesAdmin() {
  const overrides = await listAllManualOverrides()
  const stale = overrides.filter((o) => o.age_days >= STALE_DAYS)
  const fresh = overrides.filter((o) => o.age_days < STALE_DAYS)

  return (
    <div>
      <PageHeader
        title="Manual field overrides"
        description={
          `Fields manually set by editors (because the extraction pipeline couldn't reach them — e.g., issuers that don't publish a public Schumer-box). ` +
          `Re-verify entries 6+ months old: the auto-extraction has no way to detect if the underlying value changed.`
        }
      />

      {stale.length > 0 ? (
        <section className="mb-8">
          <header className="mb-2 flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-[var(--color-primary)]">
              🔴 Stale ({STALE_DAYS}+ days)
            </h2>
            <Badge tone="danger">{stale.length}</Badge>
          </header>
          <OverridesTable rows={stale} highlight="stale" />
        </section>
      ) : null}

      <section>
        <header className="mb-2 flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-[var(--color-primary)]">
            ✓ Fresh (under {STALE_DAYS} days)
          </h2>
          <Badge tone="neutral">{fresh.length}</Badge>
        </header>
        {fresh.length === 0 ? (
          <EmptyState title="No manual overrides yet" description="When editors set fields manually (FX fee, credit score, etc.), they'll show up here." />
        ) : (
          <OverridesTable rows={fresh} highlight="fresh" />
        )}
      </section>
    </div>
  )
}

function OverridesTable({
  rows,
  highlight,
}: {
  rows: Awaited<ReturnType<typeof listAllManualOverrides>>
  highlight: 'stale' | 'fresh'
}) {
  return (
    <Card>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Entity</th>
              <th>Field</th>
              <th>Value</th>
              <th style={{ textAlign: 'right' }}>Age</th>
              <th>Set at</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.table}-${r.slug}-${r.field}-${i}`}>
                <td>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                    {r.table === 'credit_cards' ? 'Card' : 'Program'}
                  </span>
                  <br />
                  <span style={{ fontWeight: 500 }}>{r.name}</span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{r.field}</td>
                <td>
                  <code style={{ background: 'var(--color-background-soft)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>
                    {typeof r.value === 'object' ? JSON.stringify(r.value) : String(r.value)}
                  </code>
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ color: highlight === 'stale' ? '#b91c1c' : 'var(--color-text-primary)' }}>
                    {r.age_days}d
                  </span>
                </td>
                <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                  {new Date(r.set_at).toLocaleDateString()}
                </td>
                <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', maxWidth: '20rem' }}>
                  {r.note || <em>(no note)</em>}
                </td>
                <td>
                  <Link
                    href={
                      r.table === 'credit_cards'
                        ? `/admin/cards/${r.slug}/extract`
                        : `/admin/programs/${r.slug}/extract`
                    }
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
