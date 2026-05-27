import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { setDisposition } from './actions'

export const dynamic = 'force-dynamic'

type Fact = {
  id: string
  program_slug: string
  claim_text: string
  category: string | null
  verdict: 'verified' | 'needs_clarification' | 'incorrect'
  risk_level: 'high' | 'medium' | 'low'
  sources: Array<{ url: string; publication_date: string | null; snippet: string | null; is_official?: boolean; why_chosen?: string }>
  third_party_fallback: boolean
  disposition: string | null
  override_reason: string | null
  reviewed_at: string
  reviewed_by: string | null
  prior_version_id: string | null
}

const VERDICT_LABEL: Record<Fact['verdict'], string> = {
  verified: 'Verified',
  needs_clarification: 'Needs clarification',
  incorrect: 'Incorrect',
}
const VERDICT_TONE: Record<Fact['verdict'], 'success' | 'warning' | 'danger'> = {
  verified: 'success',
  needs_clarification: 'warning',
  incorrect: 'danger',
}
const RISK_TONE: Record<Fact['risk_level'], 'danger' | 'warning' | 'neutral'> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
}
const DISPOSITION_OPTIONS = [
  { value: 'auto_locked', label: 'Auto-locked' },
  { value: 'kept', label: 'Kept' },
  { value: 'reworded', label: 'Reworded' },
  { value: 'removed', label: 'Removed' },
  { value: 'deferred', label: 'Deferred' },
] as const

function formatAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(ms / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default async function ProgramFactsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: program } = await supabase
    .from('programs')
    .select('slug, name')
    .eq('slug', slug)
    .maybeSingle()
  if (!program) notFound()

  const { data: facts } = await supabase
    .from('program_facts')
    .select('id, program_slug, claim_text, category, verdict, risk_level, sources, third_party_fallback, disposition, override_reason, reviewed_at, reviewed_by, prior_version_id')
    .eq('program_slug', slug)
    .is('superseded_at', null)
    .order('verdict', { ascending: true })
    .order('risk_level', { ascending: true })

  const factList = (facts ?? []) as Fact[]
  const byVerdict = {
    verified: factList.filter((f) => f.verdict === 'verified'),
    needs_clarification: factList.filter((f) => f.verdict === 'needs_clarification'),
    incorrect: factList.filter((f) => f.verdict === 'incorrect'),
  }

  return (
    <div>
      <PageHeader
        title={`${program.name} — Facts`}
        description="Per-fact verification ledger. Run fact-check to extract claims from the program's prose, verify against trusted sources, and capture the audit trail. Phase 1 of the facts ledger system."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href={`/admin/programs/${slug}/edit`} className="admin-btn admin-btn-ghost admin-btn-sm">
              ← Back to edit
            </Link>
          </div>
        }
      />

      {/* Summary metric strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <Metric label="Verified" value={byVerdict.verified.length} tone="success" />
        <Metric label="Needs review" value={byVerdict.needs_clarification.length} tone={byVerdict.needs_clarification.length > 0 ? 'warning' : 'neutral'} />
        <Metric label="Incorrect" value={byVerdict.incorrect.length} tone={byVerdict.incorrect.length > 0 ? 'danger' : 'neutral'} />
        <Metric label="Total" value={factList.length} tone="neutral" />
      </div>

      {/* Run fact-check — CLI only in Phase 1 (Vercel serverless can't background long jobs) */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Run fact-check</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', marginBottom: '0.75rem' }}>
          Phase 1: run from your laptop terminal. Takes 2-10 minutes depending on prose length. Phase 4 will add a one-button background queue.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: '0.25rem' }}>
              Full program fact-check
            </div>
            <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.8125rem', margin: 0 }}>
              {`node scripts/factcheck-program.mjs --slug=${slug}`}
            </pre>
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: '0.25rem' }}>
              Extract only (no DB writes, just print claims)
            </div>
            <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.8125rem', margin: 0 }}>
              {`node scripts/factcheck-program.mjs --slug=${slug} --extract-only`}
            </pre>
          </div>
        </div>
      </Card>

      {factList.length === 0 ? (
        <EmptyState
          title="No facts yet"
          description={`Run fact-check above to populate the ledger for ${program.name}.`}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <FactSection title="⚠️ Needs clarification" facts={byVerdict.needs_clarification} defaultExpanded slug={slug} />
          <FactSection title="❌ Incorrect (default action: remove)" facts={byVerdict.incorrect} defaultExpanded slug={slug} />
          <FactSection title="✅ Verified (auto-locked)" facts={byVerdict.verified} defaultExpanded={false} slug={slug} />
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const colorByTone: Record<string, string> = {
    success: 'var(--admin-success, #2f855a)',
    warning: '#c47a00',
    danger: '#b91c1c',
    neutral: 'var(--admin-text, #1a1a1a)',
  }
  return (
    <Card style={{ padding: '0.875rem 1rem' }}>
      <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 600, color: colorByTone[tone], marginTop: '0.25rem' }}>
        {value}
      </div>
    </Card>
  )
}

function FactSection({
  title,
  facts,
  defaultExpanded,
  slug,
}: {
  title: string
  facts: Fact[]
  defaultExpanded: boolean
  slug: string
}) {
  if (facts.length === 0) return null
  return (
    <details open={defaultExpanded} style={{ border: '1px solid var(--admin-border)', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem' }}>
        {title} ({facts.length})
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
        {facts.map((f) => (
          <FactRow key={f.id} fact={f} slug={slug} />
        ))}
      </div>
    </details>
  )
}

function FactRow({ fact, slug }: { fact: Fact; slug: string }) {
  void slug
  return (
    <div
      style={{
        border: '1px solid var(--admin-border)',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        background: 'var(--admin-surface, #fff)',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
        <Badge tone={VERDICT_TONE[fact.verdict]}>{VERDICT_LABEL[fact.verdict]}</Badge>
        <Badge tone={RISK_TONE[fact.risk_level]}>{fact.risk_level.toUpperCase()}</Badge>
        {fact.category && <Badge tone="neutral">{fact.category}</Badge>}
        {fact.third_party_fallback && <Badge tone="warning">third-party fallback</Badge>}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
          Last verified {formatAge(fact.reviewed_at)}
          {fact.reviewed_by && <> · by {fact.reviewed_by}</>}
        </span>
      </div>

      <div style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>{fact.claim_text}</div>

      {fact.sources.length > 0 && (
        <details>
          <summary style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
            Sources ({fact.sources.length})
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
            {fact.sources.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(0,0,0,0.03)',
                  borderRadius: '0.25rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                  {s.is_official && <Badge tone="success">official</Badge>}
                  <a href={s.url} target="_blank" rel="noopener" style={{ color: 'var(--admin-link)', wordBreak: 'break-all' }}>
                    {s.url}
                  </a>
                  {s.publication_date && (
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>
                      ({s.publication_date})
                    </span>
                  )}
                </div>
                {s.snippet && <div style={{ marginTop: '0.25rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>&ldquo;{s.snippet}&rdquo;</div>}
              </div>
            ))}
          </div>
        </details>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <form action={setDisposition} style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <input type="hidden" name="id" value={fact.id} />
          <label style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Disposition:</label>
          <select
            name="disposition"
            defaultValue={fact.disposition ?? ''}
            style={{ fontSize: '0.8125rem', padding: '0.25rem 0.375rem', border: '1px solid var(--admin-border)', borderRadius: '0.25rem' }}
          >
            <option value="">— none —</option>
            {DISPOSITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm" style={{ fontSize: '0.75rem' }}>
            Save
          </button>
        </form>

        <details style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--admin-text-muted)' }}>Re-verify CLI</summary>
          <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '0.375rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', margin: '0.25rem 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {`node scripts/factcheck-program.mjs --fact-id=${fact.id}`}
          </pre>
        </details>
      </div>
    </div>
  )
}
