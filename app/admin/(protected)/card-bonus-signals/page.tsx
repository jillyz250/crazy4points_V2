import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardBody } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { applySignal, dismissSignal } from './actions'

export const dynamic = 'force-dynamic'

type Signal = {
  id: string
  card_slug: string
  card_name: string
  source_url: string
  bonus_currency: string | null
  stored_amount: number | null
  stored_spend: number | null
  detected_amount: number | null
  detected_spend: number | null
  summary: string
  confidence: string
  first_seen_at: string
  last_seen_at: string
}

const CONF_TONE: Record<string, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger',
  med: 'warning',
  low: 'neutral',
}

function fmt(n: number | null, cur: string | null): string {
  if (n == null) return '—'
  return `${n.toLocaleString()}${cur ? ` ${cur}` : ''}`
}

export default async function CardBonusSignalsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('card_bonus_signals')
    .select('*')
    .eq('status', 'new')
    .order('confidence', { ascending: true })
    .order('last_seen_at', { ascending: false })
  const signals = (data ?? []) as Signal[]

  return (
    <div>
      <PageHeader
        title="Welcome-bonus signals"
        description="Daily scan of each active card's welcome-bonus source page. Flags cards whose live sign-up bonus differs from our stored value. Detection only — Apply to write the detected value (and mark verified today), or Dismiss."
      />

      {signals.length === 0 ? (
        <EmptyState title="🎉 All current" description="No card welcome-bonus discrepancies flagged. Every monitored card matches its source page." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {signals.map((s) => (
            <Card key={s.id}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: '16rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <Badge tone={CONF_TONE[s.confidence] ?? 'neutral'}>{s.confidence}</Badge>
                      <strong>{s.card_name}</strong>
                    </div>
                    <table style={{ fontSize: '0.875rem', borderCollapse: 'collapse', margin: '0.25rem 0 0.5rem' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '0.15rem 0.75rem 0.15rem 0', color: 'var(--admin-text-muted)' }}>Stored</td>
                          <td style={{ padding: '0.15rem 0' }}>{fmt(s.stored_amount, s.bonus_currency)} · ${s.stored_spend?.toLocaleString() ?? '—'} spend</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.15rem 0.75rem 0.15rem 0', color: 'var(--admin-text-muted)' }}>Detected</td>
                          <td style={{ padding: '0.15rem 0', fontWeight: 700 }}>{fmt(s.detected_amount, s.bonus_currency)} · ${s.detected_spend?.toLocaleString() ?? '—'} spend</td>
                        </tr>
                      </tbody>
                    </table>
                    <a href={s.source_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: 'var(--admin-accent)' }}>
                      View source page ↗
                    </a>
                    {' · '}
                    <a href={`/cards/${s.card_slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: 'var(--admin-accent)' }}>
                      Card page ↗
                    </a>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <form action={applySignal}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="admin-btn admin-btn-primary" style={{ whiteSpace: 'nowrap' }}>
                        Apply detected
                      </button>
                    </form>
                    <form action={dismissSignal}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="admin-btn">Dismiss</button>
                    </form>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
