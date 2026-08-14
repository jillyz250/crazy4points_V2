import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardBody } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { dismissSignal, snoozeSignal } from './actions'

export const dynamic = 'force-dynamic'

type Signal = {
  id: string
  source_name: string
  source_url: string
  program_slug: string | null
  signal_type: string
  summary: string
  excerpt: string | null
  confidence: string
  first_seen_at: string
  last_seen_at: string
}

const CONF_TONE: Record<string, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger',
  med: 'warning',
  low: 'neutral',
}

export default async function ChangeSignalsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('change_signals')
    .select('*')
    .eq('status', 'new')
    // Hide snoozed signals until their snooze passes (then they auto-resurface).
    .or(`snoozed_until.is.null,snoozed_until.lte.${new Date().toISOString()}`)
    .order('confidence', { ascending: true })
    .order('last_seen_at', { ascending: false })
  const signals = (data ?? []) as Signal[]

  return (
    <div>
      <PageHeader
        title="Change signals"
        description="Daily scan of issuer newsrooms + points blogs for transfer-partner / award-ratio CHANGES affecting programs we track (Haiku-classified). Detection only — verify against the issuer's own page, apply manually, then dismiss."
      />

      {signals.length === 0 ? (
        <EmptyState title="No open signals" description="The announcement monitor hasn't flagged any unreviewed changes." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {signals.map((s) => (
            <Card key={s.id}>
              <CardBody>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <Badge tone={CONF_TONE[s.confidence] ?? 'neutral'}>{s.confidence}</Badge>
                  <Badge tone="neutral">{s.signal_type}</Badge>
                  {s.program_slug && (
                    <a href={`/programs/${s.program_slug}`} style={{ fontWeight: 600, color: 'var(--color-primary, #6B2D8F)' }}>
                      {s.program_slug}
                    </a>
                  )}
                </div>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 500 }}>{s.summary}</p>
                {s.excerpt && (
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--admin-muted, #4a4a4a)', fontStyle: 'italic' }}>
                    &ldquo;{s.excerpt}&rdquo;
                  </p>
                )}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                  <a href={s.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary, #6B2D8F)' }}>
                    {s.source_name} ↗
                  </a>
                  <span style={{ color: 'var(--admin-muted, #4a4a4a)' }}>
                    seen {new Date(s.last_seen_at).toLocaleDateString()}
                  </span>
                  <form action={snoozeSignal} style={{ marginLeft: 'auto' }}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="days" value="30" />
                    <button type="submit" className="admin-btn admin-btn-ghost" style={{ fontSize: '0.8125rem' }} title="Hide for 30 days, then auto-resurface (for 'coming soon' changes not live yet)">
                      Snooze 30d
                    </button>
                  </form>
                  <form action={dismissSignal}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="admin-btn admin-btn-ghost" style={{ fontSize: '0.8125rem' }}>
                      Dismiss
                    </button>
                  </form>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
