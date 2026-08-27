import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardBody } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { resolveFinding, dismissVerificationFinding } from './actions'

export const dynamic = 'force-dynamic'

type Finding = {
  id: string
  claim_text: string
  entity_type: string | null
  fact_type: string | null
  verdict: string
  confidence: string | null
  reconciliation: string | null
  discrepancy: boolean
  our_page_evidence: string | null
  official_evidence: string | null
  official_source_url: string | null
  correction: string | null
  proposed_addition: string | null
  source_ref: string | null
  created_at: string
}

type DriftFinding = {
  id: string
  program_slug: string
  partner_name: string | null
  partner_slug: string | null
  finding_type: string
  ours: string | null
  theirs: string | null
  source_label: string | null
  source_url: string | null
  confidence: string | null
  summary: string | null
}

// Which agents exist. Fact-checker (on-demand) and the weekly transfer
// re-verification sweep are live; the rest are the planned roadmap roster.
const ROSTER: { name: string; watches: string; status: 'live' | 'planned' }[] = [
  { name: 'Fact-checker', watches: 'Checks our page vs official (on demand)', status: 'live' },
  { name: 'Transfer re-verification', watches: 'Weekly audit of transfer data vs official rosters', status: 'live' },
  // Backlog — the agents we still need to build (see plans/ai-agents-roadmap.md).
  { name: 'Intel Triage', watches: 'Sorts the forwarded-email firehose into alerts / guide-ideas / rejects by editorial policy', status: 'planned' },
  { name: 'Sweet Spot', watches: 'Finds + verifies high-value redemptions across every program (spec ready)', status: 'planned' },
  { name: 'Content Accuracy', watches: 'Re-verifies published guides/articles on a set schedule (nothing does this today)', status: 'planned' },
  { name: 'Site-Health', watches: 'Broken links, 404s, lingering expired-offer pages, stale pages', status: 'planned' },
  { name: 'Program/Card Authoring', watches: 'Drafts new reference pages from official sources', status: 'planned' },
  { name: 'Newsletter', watches: 'Assembles the issue from verified alerts + parked items', status: 'planned' },
  { name: 'Social', watches: 'Daily best-content pick + FB/IG drafts in brand voice', status: 'planned' },
  { name: 'SEO / Content-Gap', watches: 'Uncovered search demand + internal-linking gaps; feeds the roadmap', status: 'planned' },
  { name: 'Monetization / Affiliate', watches: 'Surfaces referral/affiliate placements + tracks what converts', status: 'planned' },
  { name: 'Competitive / Rank-Watch', watches: 'Monitors competitors + our rankings; flags missed stories', status: 'planned' },
]

function findingBadge(f: Finding): { tone: 'danger' | 'warning' | 'info' | 'neutral'; label: string } {
  if (f.reconciliation === 'conflict') return { tone: 'danger', label: 'discrepancy' }
  if (f.reconciliation === 'gap') return { tone: 'warning', label: 'missing fact — add to page' }
  if (f.reconciliation === 'unchecked' && f.official_source_url) return { tone: 'info', label: 'needs manual check' }
  if (f.verdict === 'refuted') return { tone: 'danger', label: 'claim refuted' }
  return { tone: 'neutral', label: f.verdict }
}

const metric = (label: string, value: number | string) => (
  <div style={{ background: 'var(--admin-surface-soft, #F8F5FB)', borderRadius: '0.5rem', padding: '1rem 1.15rem' }}>
    <div style={{ fontSize: '0.8rem', color: '#5F5E5A' }}>{label}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 600 }}>{value}</div>
  </div>
)

export default async function AgentsPage() {
  const supabase = createAdminClient()

  const [{ data: findings }, totalRes, discRes, foundRes, fixedRes, fpRes, { data: drift }] = await Promise.all([
    supabase
      .from('claim_verifications')
      .select(
        'id, claim_text, entity_type, fact_type, verdict, confidence, reconciliation, discrepancy, our_page_evidence, official_evidence, official_source_url, correction, proposed_addition, source_ref, created_at',
      )
      .is('reviewed_at', null)
      .or('discrepancy.eq.true,reconciliation.in.(conflict,gap,unchecked),verdict.eq.refuted')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('claim_verifications').select('id', { count: 'exact', head: true }),
    supabase.from('claim_verifications').select('id', { count: 'exact', head: true }).is('reviewed_at', null).eq('discrepancy', true),
    supabase.from('claim_verifications').select('id', { count: 'exact', head: true }).eq('discrepancy', true),
    supabase.from('claim_verifications').select('id', { count: 'exact', head: true }).eq('resolution', 'fixed'),
    supabase.from('claim_verifications').select('id', { count: 'exact', head: true }).eq('resolution', 'false_positive'),
    supabase
      .from('verification_findings')
      .select('id, program_slug, partner_name, partner_slug, finding_type, ours, theirs, source_label, source_url, confidence, summary')
      .eq('status', 'new')
      .order('confidence', { ascending: true })
      .order('program_slug', { ascending: true })
      .limit(50),
  ])

  const rows = (findings ?? []) as Finding[]
  const totalChecks = totalRes.count ?? 0
  const openDiscrepancies = discRes.count ?? 0
  const discrepanciesFound = foundRes.count ?? 0
  const fixedCount = fixedRes.count ?? 0
  const falsePositives = fpRes.count ?? 0
  const driftRows = (drift ?? []) as DriftFinding[]
  const liveAgents = ROSTER.filter((a) => a.status === 'live').length

  return (
    <div>
      <PageHeader
        title="Agent control center"
        description="Where the accuracy agents report. Findings that need you land here — nothing changes without your click."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {metric('Needs your attention', rows.length + driftRows.length)}
        {metric('Open discrepancies', openDiscrepancies)}
        {metric('Checks logged', totalChecks)}
        {metric('Agents live', `${liveAgents} of ${ROSTER.length}`)}
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.75rem' }}>Accuracy scorecard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {metric('Discrepancies found', discrepanciesFound)}
        {metric('Fixed', fixedCount)}
        {metric('False positives', falsePositives)}
        {metric('Precision', fixedCount + falsePositives > 0 ? `${Math.round((fixedCount / (fixedCount + falsePositives)) * 100)}%` : '—')}
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.75rem' }}>Needs your attention</h2>
      {rows.length === 0 ? (
        <EmptyState title="All clear" description="No open discrepancies or refuted claims. New findings from the fact-checker will appear here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rows.map((f) => {
            const b = findingBadge(f)
            return (
              <Card key={f.id}>
                <CardBody>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <Badge tone={b.tone}>{b.label}</Badge>
                    {f.entity_type && f.source_ref && (
                      <span style={{ fontSize: '0.8rem', color: '#5F5E5A' }}>
                        {f.entity_type} · {f.source_ref} {f.fact_type ? `· ${f.fact_type}` : ''}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 0.6rem', fontWeight: 600 }}>{f.claim_text}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: f.official_evidence ? '1fr 1fr' : '1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    {f.our_page_evidence && (
                      <div style={{ background: '#F8F5FB', borderRadius: '0.5rem', padding: '0.5rem 0.75rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#5F5E5A', marginBottom: 2 }}>Our page says</div>
                        <div style={{ fontSize: '0.85rem' }}>{f.our_page_evidence}</div>
                      </div>
                    )}
                    {f.official_evidence && (
                      <div style={{ background: '#E1F5EE', borderRadius: '0.5rem', padding: '0.5rem 0.75rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#0F6E56', marginBottom: 2 }}>Official source</div>
                        <div style={{ fontSize: '0.85rem', color: '#04342C' }}>{f.official_evidence}</div>
                      </div>
                    )}
                  </div>

                  {f.correction && (
                    <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem' }}>
                      <strong>Fix:</strong> {f.correction}
                    </p>
                  )}
                  {f.proposed_addition && (
                    <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem' }}>
                      <strong>Add to page:</strong> {f.proposed_addition}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                    {f.official_source_url && (
                      <a href={f.official_source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#6B2D8F' }}>
                        View source
                      </a>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#888780' }}>
                      {new Date(f.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                      <form action={resolveFinding}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="resolution" value="fixed" />
                        <button type="submit" className="admin-btn admin-btn-sm">Fixed</button>
                      </form>
                      <form action={resolveFinding}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="resolution" value="dismissed" />
                        <button type="submit" className="admin-btn admin-btn-sm">Dismiss</button>
                      </form>
                      <form action={resolveFinding}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="resolution" value="false_positive" />
                        <button type="submit" className="admin-btn admin-btn-sm">False positive</button>
                      </form>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <h2 style={{ fontSize: '1.1rem', margin: '2rem 0 0.75rem' }}>Transfer-data drift (weekly re-verification)</h2>
      {driftRows.length === 0 ? (
        <EmptyState title="No open drift" description="The weekly re-verification sweep found no unresolved transfer-data discrepancies." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {driftRows.map((f) => (
            <Card key={f.id}>
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  <Badge tone={f.finding_type === 'wrong_ratio' ? 'danger' : f.finding_type === 'missing' ? 'warning' : 'info'}>
                    {(f.finding_type ?? '').replace('_', ' ')}
                  </Badge>
                  <span style={{ fontSize: '0.8rem', color: '#5F5E5A' }}>
                    {f.program_slug} → {f.partner_name || f.partner_slug} · {f.confidence} confidence
                  </span>
                </div>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>{f.summary}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {f.source_url && (
                    <a href={f.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#6B2D8F' }}>
                      {f.source_label || 'Source'}
                    </a>
                  )}
                  <form action={dismissVerificationFinding} style={{ marginLeft: 'auto' }}>
                    <input type="hidden" name="id" value={f.id} />
                    <button type="submit" className="admin-btn admin-btn-sm">Dismiss</button>
                  </form>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: '1.1rem', margin: '2rem 0 0.75rem' }}>Your agents</h2>
      <Card>
        <CardBody padding="0">
          {ROSTER.map((a, i) => (
            <div
              key={a.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.15rem',
                borderTop: i === 0 ? 'none' : '1px solid #E6DEEE',
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: a.status === 'live' ? '#1D9E75' : '#B4B2A9',
                  flex: '0 0 auto',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#5F5E5A' }}>{a.watches}</div>
              </div>
              <Badge tone={a.status === 'live' ? 'success' : 'neutral'}>{a.status === 'live' ? 'live' : 'planned'}</Badge>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}
