import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardBody } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { dismissFinding } from './actions'

export const dynamic = 'force-dynamic'

type Finding = {
  id: string
  program_slug: string
  partner_slug: string | null
  partner_name: string | null
  finding_type: string
  ours: string | null
  theirs: string | null
  source_label: string
  source_url: string
  confidence: string
  summary: string
  last_seen_at: string
}

const CONF_TONE: Record<string, 'danger' | 'warning' | 'neutral'> = { high: 'danger', med: 'warning', low: 'neutral' }
const TYPE_TONE: Record<string, 'danger' | 'warning' | 'neutral'> = { ghost: 'warning', wrong_ratio: 'danger', missing: 'neutral' }

export default async function VerificationFindingsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('verification_findings')
    .select('*')
    .eq('status', 'new')
    .order('confidence', { ascending: true })
    .order('program_slug', { ascending: true })
  const findings = (data ?? []) as Finding[]

  return (
    <div>
      <PageHeader
        title="Re-verification findings"
        description="Weekly sweep comparing our stored transfer-partner data to current rosters (model-assisted). Detection only — verify each against the issuer's own page, apply manually, then dismiss. Sources are aggregators (issuer pages are bot-blocked), so treat as leads to check, not facts to apply."
      />

      {findings.length === 0 ? (
        <EmptyState title="No open findings" description="The weekly re-verification sweep hasn't flagged any unreviewed discrepancies." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {findings.map((f) => (
            <Card key={f.id}>
              <CardBody>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <Badge tone={CONF_TONE[f.confidence] ?? 'neutral'}>{f.confidence}</Badge>
                  <Badge tone={TYPE_TONE[f.finding_type] ?? 'neutral'}>{f.finding_type}</Badge>
                  <a href={`/programs/${f.program_slug}`} style={{ fontWeight: 600, color: 'var(--color-primary, #6B2D8F)' }}>
                    {f.program_slug}
                  </a>
                  <span style={{ color: 'var(--admin-muted, #4a4a4a)' }}>→</span>
                  <span style={{ fontWeight: 500 }}>{f.partner_slug ?? f.partner_name ?? '?'}</span>
                </div>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 500 }}>{f.summary}</p>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                  <span>ours: <b>{f.ours ?? '—'}</b></span>
                  <span>source: <b>{f.theirs ?? '—'}</b></span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                  <a href={f.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary, #6B2D8F)' }}>
                    {f.source_label} ↗
                  </a>
                  <span style={{ color: 'var(--admin-muted, #4a4a4a)' }}>seen {new Date(f.last_seen_at).toLocaleDateString()}</span>
                  <form action={dismissFinding} style={{ marginLeft: 'auto' }}>
                    <input type="hidden" name="id" value={f.id} />
                    <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm" style={{ fontSize: '0.8125rem' }}>
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
