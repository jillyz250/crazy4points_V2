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

  const [{ data: facts }, { data: links }] = await Promise.all([
    supabase
      .from('program_facts')
      .select('id, program_slug, claim_text, category, verdict, risk_level, sources, third_party_fallback, disposition, override_reason, reviewed_at, reviewed_by, prior_version_id')
      .eq('program_slug', slug)
      .is('superseded_at', null)
      .order('verdict', { ascending: true })
      .order('risk_level', { ascending: true }),
    supabase
      .from('prose_fact_links')
      .select('field_name, fact_id')
      .eq('program_slug', slug),
  ])

  const allFacts = (facts ?? []) as Fact[]

  // Build fact_id -> Set<field_name> map for "linked to" badges on each card
  const linkedFieldsByFactId = new Map<string, Set<string>>()
  for (const link of (links ?? []) as Array<{ fact_id: string; field_name: string }>) {
    if (!linkedFieldsByFactId.has(link.fact_id)) linkedFieldsByFactId.set(link.fact_id, new Set())
    linkedFieldsByFactId.get(link.fact_id)!.add(link.field_name)
  }

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

      {/* Summary: prominent triage status banner + smaller breakdown rows */}
      <TriageStatusBanner
        total={allFacts.length}
        untriaged={untriagedCount}
        verdictCounts={allByVerdict}
        facts={allFacts}
      />


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
          <FactSection title="⚠️ Needs clarification" facts={byVerdict.needs_clarification} defaultExpanded linkedFieldsByFactId={linkedFieldsByFactId} />
          <FactSection title="❌ Incorrect (default action: remove)" facts={byVerdict.incorrect} defaultExpanded linkedFieldsByFactId={linkedFieldsByFactId} />
          <FactSection title="✅ Verified (auto-locked)" facts={byVerdict.verified} defaultExpanded={show !== 'untriaged'} linkedFieldsByFactId={linkedFieldsByFactId} />
        </div>
      )}
    </div>
  )
}

function TriageStatusBanner({
  total,
  untriaged,
  verdictCounts,
  facts,
}: {
  total: number
  untriaged: number
  verdictCounts: { verified: Fact[]; needs_clarification: Fact[]; incorrect: Fact[] }
  facts: Fact[]
}) {
  const isClear = untriaged === 0 && total > 0
  const dispositionCounts: Record<string, number> = {}
  for (const f of facts) {
    const d = f.disposition ?? 'none'
    dispositionCounts[d] = (dispositionCounts[d] ?? 0) + 1
  }

  const bannerBg = isClear ? 'rgba(46, 125, 50, 0.08)' : 'rgba(196, 122, 0, 0.08)'
  const bannerBorder = isClear ? 'rgba(46, 125, 50, 0.35)' : 'rgba(196, 122, 0, 0.35)'
  const bannerFg = isClear ? '#2e7d32' : '#c47a00'

  const headline = total === 0
    ? 'Ledger is empty — run fact-check to populate'
    : isClear
      ? `✓ All ${total} facts triaged`
      : `⚠️ ${untriaged} of ${total} facts need your attention`

  const dispoOrder = ['auto_locked', 'kept', 'reworded', 'removed', 'deferred']
  const dispositionParts: string[] = []
  for (const d of dispoOrder) {
    const n = dispositionCounts[d] ?? 0
    if (n > 0) dispositionParts.push(`${n} ${d.replace('_', '-')}`)
  }
  if (dispositionCounts.none > 0) dispositionParts.push(`${dispositionCounts.none} untriaged`)

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Prominent triage status */}
      <div
        style={{
          background: bannerBg,
          border: `1px solid ${bannerBorder}`,
          borderRadius: '0.5rem',
          padding: '1rem 1.25rem',
          marginBottom: '0.5rem',
        }}
      >
        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: bannerFg }}>
          {headline}
        </div>
        {total > 0 && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', marginTop: '0.25rem' }}>
            <strong>Your triage:</strong> {dispositionParts.length > 0 ? dispositionParts.join(' · ') : '—'}
          </div>
        )}
      </div>

      {/* Smaller breakdown: script verdicts (informational only) */}
      {total > 0 && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid var(--admin-border)',
            borderRadius: '0.5rem',
            padding: '0.625rem 1rem',
            fontSize: '0.75rem',
            color: 'var(--admin-text-muted)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'baseline',
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ marginRight: '0.25rem' }}>What the script said (informational):</strong>
          <span style={{ color: '#2e7d32', fontWeight: 600 }}>✅ {verdictCounts.verified.length} verified</span>
          <span style={{ color: 'var(--admin-text-muted)' }}>·</span>
          <span style={{ color: '#c47a00', fontWeight: 600 }}>⚠️ {verdictCounts.needs_clarification.length} needs review</span>
          <span style={{ color: 'var(--admin-text-muted)' }}>·</span>
          <span style={{ color: '#b91c1c', fontWeight: 600 }}>❌ {verdictCounts.incorrect.length} incorrect</span>
          <span style={{ marginLeft: 'auto', fontStyle: 'italic', fontSize: '0.6875rem' }}>
            Verdicts never change — they&apos;re the script&apos;s snapshot. Your dispositions above are what you control.
          </span>
        </div>
      )}
    </div>
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
  linkedFieldsByFactId,
}: {
  title: string
  facts: Fact[]
  defaultExpanded: boolean
  linkedFieldsByFactId: Map<string, Set<string>>
}) {
  if (facts.length === 0) return null
  return (
    <details open={defaultExpanded} style={{ border: '1px solid var(--admin-border)', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem' }}>
        {title} ({facts.length})
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
        {facts.map((f) => (
          <FactCard key={f.id} fact={f} linkedFields={[...(linkedFieldsByFactId.get(f.id) ?? [])]} />
        ))}
      </div>
    </details>
  )
}
