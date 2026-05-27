import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { Card } from '@/components/admin/ui/Card'

type Fact = {
  id: string
  claim_text: string
  category: string | null
  verdict: 'verified' | 'needs_clarification' | 'incorrect'
  risk_level: 'high' | 'medium' | 'low'
  disposition: string | null
}

type Link = {
  field_name: string
  fragment_anchor: string
  fact_id: string
}

const VERDICT_EMOJI: Record<Fact['verdict'], string> = {
  verified: '✅',
  needs_clarification: '⚠️',
  incorrect: '❌',
}

const FIELD_LABEL: Record<string, string> = {
  intro: 'Intro',
  sweet_spots: 'Sweet spots',
  quirks: 'Quirks',
  how_to_spend: 'How to spend',
  lounge_access: 'Lounge access',
  tier_benefits: 'Tier benefits',
  award_chart: 'Award chart',
  transfer_partners: 'Transfer partners',
  transfer_partners_outbound: 'Transfer partners (outbound)',
}

/**
 * Phase 2c — server component that renders below the program edit form.
 * Shows the prose-fact linkage so the editor can see "this intro depends on
 * 12 facts" + click into the Facts tab for full management.
 *
 * Read-only. No inline markers inside the textarea (that requires rich
 * editor + is deferred). This is the pragmatic MVP that ships today.
 */
export default async function LinkedFactsPanel({ slug }: { slug: string }) {
  const supabase = createAdminClient()

  // Total fact count for this program
  const { data: allFacts } = await supabase
    .from('program_facts')
    .select('id, claim_text, category, verdict, risk_level, disposition')
    .eq('program_slug', slug)
    .is('superseded_at', null)

  // All prose-fact links for this program
  const { data: links } = await supabase
    .from('prose_fact_links')
    .select('field_name, fragment_anchor, fact_id')
    .eq('program_slug', slug)

  const facts = (allFacts ?? []) as Fact[]
  const factById = new Map(facts.map((f) => [f.id, f]))
  const linkList = (links ?? []) as Link[]

  // Group by field
  const byField = new Map<string, Set<string>>()
  for (const l of linkList) {
    if (!byField.has(l.field_name)) byField.set(l.field_name, new Set())
    byField.get(l.field_name)!.add(l.fact_id)
  }

  // Identify orphaned facts (in ledger but not linked anywhere)
  const linkedFactIds = new Set(linkList.map((l) => l.fact_id))
  const orphanedFacts = facts.filter((f) => !linkedFactIds.has(f.id))

  // Verdict counts of all facts
  const verdictCounts = {
    verified: facts.filter((f) => f.verdict === 'verified').length,
    needs_clarification: facts.filter((f) => f.verdict === 'needs_clarification').length,
    incorrect: facts.filter((f) => f.verdict === 'incorrect').length,
  }

  if (facts.length === 0) {
    return (
      <Card style={{ marginTop: '1.5rem', padding: '1rem' }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
          <strong>📋 Facts ledger</strong> — no facts in the ledger yet for this program.{' '}
          <Link href={`/admin/programs/${slug}/facts`} style={{ color: 'var(--admin-link, #2563eb)' }}>
            Open Facts tab →
          </Link>{' '}
          to run a fact-check.
        </div>
      </Card>
    )
  }

  return (
    <Card style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
            📋 Facts cited in this program ({facts.length})
          </h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.25rem' }}>
            {verdictCounts.verified} verified ·{' '}
            {verdictCounts.needs_clarification > 0 && <strong style={{ color: '#c47a00' }}>{verdictCounts.needs_clarification} need review · </strong>}
            {verdictCounts.incorrect > 0 && <strong style={{ color: '#b91c1c' }}>{verdictCounts.incorrect} incorrect · </strong>}
            {linkedFactIds.size} linked to prose paragraphs ·{' '}
            {orphanedFacts.length} orphaned (in ledger but not cited)
          </div>
        </div>
        <Link
          href={`/admin/programs/${slug}/facts`}
          className="admin-btn admin-btn-secondary admin-btn-sm"
          style={{ fontSize: '0.75rem' }}
        >
          Manage in Facts tab →
        </Link>
      </div>

      {byField.size > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
          {[...byField.entries()].map(([field, factIds]) => (
            <details key={field} style={{ border: '1px solid var(--admin-border)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                {FIELD_LABEL[field] ?? field} — {factIds.size} fact{factIds.size === 1 ? '' : 's'} cited
              </summary>
              <ul style={{ listStyle: 'none', padding: '0.5rem 0 0 0', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {[...factIds].map((fid) => {
                  const f = factById.get(fid)
                  if (!f) return null
                  return (
                    <li
                      key={fid}
                      style={{
                        fontSize: '0.8125rem',
                        padding: '0.375rem 0.5rem',
                        background: 'rgba(0,0,0,0.03)',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'baseline',
                      }}
                    >
                      <span style={{ fontSize: '0.875rem' }}>{VERDICT_EMOJI[f.verdict]}</span>
                      <span style={{ flex: '1 1 auto' }}>{f.claim_text}</span>
                      {f.category && (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--admin-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {f.category}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </details>
          ))}
        </div>
      )}

      {orphanedFacts.length > 0 && (
        <details style={{ marginTop: '0.75rem', border: '1px dashed var(--admin-border)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
            ⚪ Orphaned facts ({orphanedFacts.length}) — in ledger but not linked to any paragraph
          </summary>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.5rem' }}>
            These facts are verified but no prose paragraph cites them. They may be safe to remove, OR you may want to incorporate them into the prose. Linked by{' '}
            <code>scripts/draft-program.mjs</code> when AI drafts new prose from verified facts.
          </div>
          <ul style={{ listStyle: 'none', padding: '0.5rem 0 0 0', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {orphanedFacts.slice(0, 10).map((f) => (
              <li
                key={f.id}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  color: 'var(--admin-text-muted)',
                }}
              >
                {VERDICT_EMOJI[f.verdict]} {f.claim_text.slice(0, 120)}
                {f.claim_text.length > 120 ? '...' : ''}
              </li>
            ))}
            {orphanedFacts.length > 10 && (
              <li style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', padding: '0.25rem 0.5rem' }}>
                + {orphanedFacts.length - 10} more (view all in Facts tab)
              </li>
            )}
          </ul>
        </details>
      )}

      {byField.size === 0 && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
          No prose-fact linkages recorded yet. Run{' '}
          <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>
            node scripts/draft-program.mjs --slug={slug} --force
          </code>{' '}
          to (re-)draft the prose and create paragraph-level fact linkages.
        </div>
      )}
    </Card>
  )
}
