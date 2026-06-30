import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardBody } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { resolveDrift } from './actions'

export const dynamic = 'force-dynamic'

type Conflict = {
  id: string
  headline: string
  conflicts_program_id: string | null
  conflict_field: string | null
  conflict_summary: string | null
  conflict_intel_claim: string | null
  conflict_program_text: string | null
  conflict_detected_at: string | null
  source_url: string | null
  source_name: string | null
}

const RESOLUTIONS: { value: string; label: string; tone: string }[] = [
  { value: 'program_updated', label: 'Page fixed', tone: '#0F6E56' },
  { value: 'intel_dismissed', label: 'Intel wrong', tone: '#991B1B' },
  { value: 'false_positive', label: 'False positive', tone: '#5F5E5A' },
  { value: 'external_verified', label: 'Verified', tone: '#185FA5' },
]

export default async function ProgramDriftPage() {
  const supabase = createAdminClient()
  const [{ data: rows }, { data: progs }] = await Promise.all([
    supabase
      .from('intel_items')
      .select(
        'id, headline, conflicts_program_id, conflict_field, conflict_summary, conflict_intel_claim, conflict_program_text, conflict_detected_at, source_url, source_name',
      )
      .not('conflicts_program_id', 'is', null)
      .is('conflict_resolution', null)
      .is('archived_at', null)
      .order('conflict_detected_at', { ascending: false }),
    supabase.from('programs').select('id, slug, name'),
  ])

  const progById = new Map<string, { slug: string; name: string }>()
  for (const p of (progs ?? []) as Array<{ id: string; slug: string; name: string }>) {
    progById.set(p.id, { slug: p.slug, name: p.name })
  }

  const conflicts = (rows ?? []) as Conflict[]

  return (
    <div>
      <PageHeader
        title="Program-fact drift"
        description="Where fresh intel contradicts what a program page stores (award charts, tiers, transfer partners, fees…). Scout's ingest flags these automatically; verify against the issuer's own page, fix the program page if real, then resolve. Same queue the Daily Data Digest surfaces."
      />

      {conflicts.length === 0 ? (
        <EmptyState title="No open drift" description="No unresolved program-fact conflicts. Nice and current." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {conflicts.map((c) => {
            const prog = c.conflicts_program_id ? progById.get(c.conflicts_program_id) : undefined
            return (
              <Card key={c.id}>
                <CardBody>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {c.conflict_field && <Badge tone="warning">{c.conflict_field}</Badge>}
                    {prog && (
                      <a href={`/programs/${prog.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--color-primary, #6B2D8F)' }}>
                        {prog.name}
                      </a>
                    )}
                    {c.conflict_detected_at && (
                      <span style={{ color: 'var(--admin-muted, #4a4a4a)', fontSize: '0.75rem' }}>
                        detected {new Date(c.conflict_detected_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 0.625rem', fontWeight: 500 }}>{c.conflict_summary ?? c.headline}</p>

                  {(c.conflict_intel_claim || c.conflict_program_text) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8125rem' }}>
                      {c.conflict_intel_claim && (
                        <div style={{ background: '#FEF2F2', padding: '0.5rem 0.625rem', borderRadius: '6px', border: '1px solid #FECACA' }}>
                          <div style={{ fontWeight: 600, color: '#7F1D1D', marginBottom: '0.25rem', fontSize: '0.6875rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            Intel claims
                          </div>
                          <div style={{ color: '#374151', lineHeight: 1.4 }}>{c.conflict_intel_claim}</div>
                        </div>
                      )}
                      {c.conflict_program_text && (
                        <div style={{ background: '#F8F5FB', padding: '0.5rem 0.625rem', borderRadius: '6px', border: '1px solid #E6DEEE' }}>
                          <div style={{ fontWeight: 600, color: '#3730A3', marginBottom: '0.25rem', fontSize: '0.6875rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            {prog?.name ?? 'Program'} page says
                          </div>
                          <div style={{ color: '#374151', lineHeight: 1.4 }}>{c.conflict_program_text}</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                    {c.source_url && (
                      <a href={c.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary, #6B2D8F)' }}>
                        {c.source_name ?? 'source'} ↗
                      </a>
                    )}
                    <div style={{ display: 'flex', gap: '0.375rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
                      {RESOLUTIONS.map((r) => (
                        <form key={r.value} action={resolveDrift}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="resolution" value={r.value} />
                          <button type="submit" className="admin-btn admin-btn-ghost" style={{ fontSize: '0.75rem', color: r.tone }}>
                            {r.label}
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
