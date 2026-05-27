import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import FactCard from './FactCard'

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

// "Triaged" = editor took action. auto_locked counts as triaged because it
// means the script auto-applied a verified verdict; editor doesn't need to look.
function isTriaged(f: Fact): boolean {
  return !!f.disposition
}

export default async function ProgramFactsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ show?: string }>
}) {
  const { slug } = await params
  const { show = 'untriaged' } = await searchParams

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

  const allFacts = (facts ?? []) as Fact[]

  // Filter based on show param
  const filteredFacts =
    show === 'all' ? allFacts :
    show === 'triaged' ? allFacts.filter(isTriaged) :
    allFacts.filter((f) => !isTriaged(f))  // default: untriaged

  const byVerdict = {
    needs_clarification: filteredFacts.filter((f) => f.verdict === 'needs_clarification'),
    incorrect: filteredFacts.filter((f) => f.verdict === 'incorrect'),
    verified: filteredFacts.filter((f) => f.verdict === 'verified'),
  }

  // Counts use ALL facts (not filtered) so the metrics don't change with filter
  const allByVerdict = {
    verified: allFacts.filter((f) => f.verdict === 'verified'),
    needs_clarification: allFacts.filter((f) => f.verdict === 'needs_clarification'),
    incorrect: allFacts.filter((f) => f.verdict === 'incorrect'),
  }
  const triagedCount = allFacts.filter(isTriaged).length
  const untriagedCount = allFacts.length - triagedCount

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
        <Metric label="Verified" value={allByVerdict.verified.length} tone="success" />
        <Metric label="Needs review" value={allByVerdict.needs_clarification.length} tone={allByVerdict.needs_clarification.length > 0 ? 'warning' : 'neutral'} />
        <Metric label="Incorrect" value={allByVerdict.incorrect.length} tone={allByVerdict.incorrect.length > 0 ? 'danger' : 'neutral'} />
        <Metric label="Untriaged" value={untriagedCount} tone={untriagedCount > 0 ? 'warning' : 'success'} />
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

      {/* Filter toggle */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginRight: '0.5rem' }}>Show:</span>
        <FilterTab label={`Untriaged (${untriagedCount})`} slug={slug} value="untriaged" active={show === 'untriaged'} />
        <FilterTab label={`Triaged (${triagedCount})`} slug={slug} value="triaged" active={show === 'triaged'} />
        <FilterTab label={`All (${allFacts.length})`} slug={slug} value="all" active={show === 'all'} />
      </div>

      {allFacts.length === 0 ? (
        <EmptyState
          title="No facts yet"
          description={`Run fact-check above to populate the ledger for ${program.name}.`}
        />
      ) : filteredFacts.length === 0 ? (
        <EmptyState
          title={show === 'untriaged' ? '🎉 All triaged!' : 'No facts in this view'}
          description={
            show === 'untriaged'
              ? `You've triaged every fact in ${program.name}. Switch to "All" or "Triaged" to review past decisions.`
              : `No facts match the current filter. Try switching to "All".`
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <FactSection title="⚠️ Needs clarification" facts={byVerdict.needs_clarification} defaultExpanded />
          <FactSection title="❌ Incorrect (default action: remove)" facts={byVerdict.incorrect} defaultExpanded />
          <FactSection title="✅ Verified (auto-locked)" facts={byVerdict.verified} defaultExpanded={show !== 'untriaged'} />
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const colorByTone: Record<string, string> = {
    success: '#2e7d32',
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

function FilterTab({ label, slug, value, active }: { label: string; slug: string; value: string; active: boolean }) {
  return (
    <Link
      href={`/admin/programs/${slug}/facts?show=${value}`}
      className={`admin-btn admin-btn-sm ${active ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
      style={{ fontSize: '0.75rem' }}
    >
      {label}
    </Link>
  )
}

function FactSection({
  title,
  facts,
  defaultExpanded,
}: {
  title: string
  facts: Fact[]
  defaultExpanded: boolean
}) {
  if (facts.length === 0) return null
  return (
    <details open={defaultExpanded} style={{ border: '1px solid var(--admin-border)', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem' }}>
        {title} ({facts.length})
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
        {facts.map((f) => (
          <FactCard key={f.id} fact={f} />
        ))}
      </div>
    </details>
  )
}
