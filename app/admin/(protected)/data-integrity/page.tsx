import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardBody } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { runIntegrityChecks, type IntegrityFinding, type IntegritySeverity } from '@/utils/integrity/runIntegrityChecks'

export const dynamic = 'force-dynamic'

const TONE: Record<IntegritySeverity, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger',
  med: 'warning',
  low: 'neutral',
}

export default async function DataIntegrityPage() {
  const supabase = createAdminClient()
  let findings: IntegrityFinding[] = []
  let error: string | null = null
  try {
    findings = await runIntegrityChecks(supabase)
  } catch (err) {
    error = String(err)
  }

  const counts = {
    high: findings.filter((f) => f.severity === 'high').length,
    med: findings.filter((f) => f.severity === 'med').length,
    low: findings.filter((f) => f.severity === 'low').length,
  }

  return (
    <div>
      <PageHeader
        title="Data integrity"
        description="Daily structural audit of the program/transfer graph — orphan/junk slugs, ratio formats, deprecated dupes, currency flags. Detection only (no auto-fix). Also runs nightly via /api/cron/data-integrity and emails a summary."
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <Badge tone="danger">{counts.high} high</Badge>
        <Badge tone="warning">{counts.med} medium</Badge>
        <Badge tone="neutral">{counts.low} low</Badge>
      </div>

      {error ? (
        <Card>
          <CardBody>
            <p style={{ color: 'var(--admin-danger, #b91c1c)' }}>Check failed: {error}</p>
          </CardBody>
        </Card>
      ) : findings.length === 0 ? (
        <EmptyState title="All clean" description="No structural issues in the program/transfer graph." />
      ) : (
        <Card>
          <CardBody padding="0">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--admin-border, #e5e7eb)' }}>
                  <th style={{ padding: '0.625rem 0.875rem' }}>Severity</th>
                  <th style={{ padding: '0.625rem 0.875rem' }}>Check</th>
                  <th style={{ padding: '0.625rem 0.875rem' }}>Program</th>
                  <th style={{ padding: '0.625rem 0.875rem' }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--admin-border, #f1f1f4)' }}>
                    <td style={{ padding: '0.625rem 0.875rem' }}>
                      <Badge tone={TONE[f.severity]}>{f.severity}</Badge>
                    </td>
                    <td style={{ padding: '0.625rem 0.875rem', fontFamily: 'var(--font-ui, monospace)' }}>{f.check}</td>
                    <td style={{ padding: '0.625rem 0.875rem' }}>
                      {f.programSlug ? (
                        <a href={`/programs/${f.programSlug}`} style={{ color: 'var(--color-primary, #6B2D8F)' }}>
                          {f.programSlug}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '0.625rem 0.875rem', color: 'var(--admin-muted, #4a4a4a)' }}>{f.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
