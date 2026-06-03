import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { dismissObservation } from './actions'
import CopySqlButton from './CopySqlButton'

export const dynamic = 'force-dynamic'

type Observation = {
  id: string
  program_slug: string
  partner_slug: string
  observed_state: 'has_bonus' | 'no_bonus'
  observed_ratio: string | null
  observed_context: string | null
  source_url: string
  current_bonus_active: boolean | null
  current_promo_ratio: string | null
  current_base_ratio: string | null
  observed_at: string
}

type ProgramRow = {
  slug: string
  name: string
  transfer_bonuses_source_url: string | null
  transfer_bonuses_scraped_at: string | null
}

// Programs whose ratios vary by card tier — surfaced inline so the editor
// never forgets to scope a bonus to premium-only / autograph-only / etc.
const TIER_AWARE: Record<string, string> = {
  citi: 'Premium cards (Strata Elite, Prestige) transfer 1:1; no-AF cards 1:0.7. Scope bonus to premium tier only.',
  chase: 'Premium cards (Sapphire, Ink Preferred/Premier) transfer; no-AF cards pool only. Scope to premium tier.',
  'wells-fargo': 'Only Autograph + Autograph Journey transfer. Other WF cards excluded.',
}

function freshnessTone(scrapedAt: string | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (!scrapedAt) return 'danger'
  const ageDays = (Date.now() - new Date(scrapedAt).getTime()) / 86_400_000
  if (ageDays > 14) return 'danger'
  if (ageDays > 7) return 'warning'
  return 'success'
}

function formatAge(scrapedAt: string | null): string {
  if (!scrapedAt) return 'never scraped'
  const ms = Date.now() - new Date(scrapedAt).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days === 0) {
    const hours = Math.floor(ms / 3_600_000)
    return hours === 0 ? 'just now' : `${hours}h ago`
  }
  return `${days}d ago`
}

/**
 * Generate a paste-ready SQL snippet for an observation. Editor reviews
 * + edits (especially tier scoping for Citi/Chase/WF) before running.
 */
function suggestSql(obs: Observation): string {
  const isTierAware = obs.program_slug in TIER_AWARE
  const header = [
    `-- ${obs.program_slug} → ${obs.partner_slug}: ${describeChange(obs)}`,
    `-- Source: ${obs.source_url}`,
    `-- Observed: ${new Date(obs.observed_at).toISOString()}`,
    isTierAware
      ? `-- ⚠️  TIER-AWARE PROGRAM — ${TIER_AWARE[obs.program_slug]}`
      : null,
    '',
  ]
    .filter(Boolean)
    .join('\n')

  if (obs.observed_state === 'has_bonus') {
    const promo = obs.observed_ratio ?? '?:?'
    return `${header}update programs
   set transfer_partners_outbound = (
     select jsonb_agg(
       case
         when entry->>'from_slug' = '${obs.partner_slug}'
           then entry || jsonb_build_object('bonus_active', true, 'promo_ratio', '${promo}')
         else entry
       end
     )
     from jsonb_array_elements(transfer_partners_outbound) as entry
   ),
   last_verified = current_date
 where slug = '${obs.program_slug}';`
  }

  // Bonus ended
  return `${header}update programs
   set transfer_partners_outbound = (
     select jsonb_agg(
       case
         when entry->>'from_slug' = '${obs.partner_slug}'
           then (entry - 'promo_ratio') || jsonb_build_object('bonus_active', false)
         else entry
       end
     )
     from jsonb_array_elements(transfer_partners_outbound) as entry
   ),
   last_verified = current_date
 where slug = '${obs.program_slug}';`
}

function describeChange(obs: Observation): string {
  const wasBonus = !!obs.current_bonus_active
  const isBonus = obs.observed_state === 'has_bonus'
  if (!wasBonus && isBonus) {
    return `NEW bonus ${obs.observed_ratio ?? '(ratio unclear)'} (base ${obs.current_base_ratio ?? '?'})`
  }
  if (wasBonus && !isBonus) {
    return `ENDED bonus (was ${obs.current_promo_ratio ?? 'active'})`
  }
  return `CHANGED ${obs.current_promo_ratio ?? '?'} → ${obs.observed_ratio ?? '?'}`
}

export default async function TransferBonusesPage() {
  const supabase = createAdminClient()

  const { data: programs } = await supabase
    .from('programs')
    .select('slug, name, transfer_bonuses_source_url, transfer_bonuses_scraped_at')
    .not('transfer_bonuses_source_url', 'is', null)
    .order('transfer_bonuses_scraped_at', { ascending: true, nullsFirst: true })

  const { data: observations } = await supabase
    .from('transfer_bonus_observations')
    .select('*')
    .eq('status', 'new')
    .order('observed_at', { ascending: false })

  const obsByProgram = new Map<string, Observation[]>()
  for (const o of (observations ?? []) as Observation[]) {
    if (!obsByProgram.has(o.program_slug)) obsByProgram.set(o.program_slug, [])
    obsByProgram.get(o.program_slug)!.push(o)
  }

  const totalPending = observations?.length ?? 0
  const staleCount = (programs ?? []).filter(
    (p) => freshnessTone(p.transfer_bonuses_scraped_at) === 'danger',
  ).length
  const warnCount = (programs ?? []).filter(
    (p) => freshnessTone(p.transfer_bonuses_scraped_at) === 'warning',
  ).length

  return (
    <div>
      <PageHeader
        title="Transfer Bonus Monitor"
        description="Per-program scrape of transfer-bonus pages. Detects new / changed / ended bonuses. Phase 1 is read-only: copy the suggested SQL, review, and run manually so per-card-tier ratios stay correct."
      />

      <Card>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Metric label="Sources monitored" value={programs?.length ?? 0} />
          <Metric label="Pending observations" value={totalPending} tone={totalPending > 0 ? 'warning' : 'neutral'} />
          <Metric label="Stale (>14d)" value={staleCount} tone={staleCount > 0 ? 'danger' : 'success'} />
          <Metric label="Aging (>7d)" value={warnCount} tone={warnCount > 0 ? 'warning' : 'neutral'} />
          <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
            Manual run: <code>node scripts/scrape-transfer-bonuses.mjs</code>
          </div>
        </div>
      </Card>

      <section style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
        {(programs ?? []).map((p: ProgramRow) => {
          const obs = obsByProgram.get(p.slug) ?? []
          const tone = freshnessTone(p.transfer_bonuses_scraped_at)
          const tierWarning = TIER_AWARE[p.slug] ?? null
          return (
            <Card key={p.slug}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600 }}>{p.name}</h2>
                <Badge tone={tone}>{formatAge(p.transfer_bonuses_scraped_at)}</Badge>
                {obs.length > 0 && <Badge tone="warning">{obs.length} pending</Badge>}
                {tierWarning && <Badge tone="info">tier-aware</Badge>}
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
                  <a href={p.transfer_bonuses_source_url ?? '#'} target="_blank" rel="noopener" style={{ color: 'var(--admin-text-muted)' }}>
                    source ↗
                  </a>
                </span>
              </div>

              {tierWarning && (
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                  ⚠️ {tierWarning}
                </p>
              )}

              {obs.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', margin: 0 }}>
                  No pending changes from last scrape.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {obs.map((o) => (
                    <ObservationRow key={o.id} obs={o} />
                  ))}
                </div>
              )}
            </Card>
          )
        })}

        {(programs ?? []).length === 0 && (
          <EmptyState
            title="No monitored programs"
            description="Set programs.transfer_bonuses_source_url for the programs you want to track."
          />
        )}
      </section>
    </div>
  )
}

function Metric({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const colorByTone: Record<string, string> = {
    success: 'var(--color-primary)',
    warning: '#c47a00',
    danger: '#b91c1c',
    neutral: 'var(--color-text-primary)',
  }
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 600, color: colorByTone[tone] }}>{value}</div>
    </div>
  )
}

function ObservationRow({ obs }: { obs: Observation }) {
  const summary = describeChange(obs)
  const wasBonus = !!obs.current_bonus_active
  const isBonus = obs.observed_state === 'has_bonus'
  let tone: 'success' | 'danger' | 'warning' = 'warning'
  if (!wasBonus && isBonus) tone = 'success'
  else if (wasBonus && !isBonus) tone = 'danger'

  const sql = suggestSql(obs)

  return (
    <div
      style={{
        border: '1px solid var(--color-border-soft)',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        background: 'var(--color-background-soft)',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '0.9375rem' }}>{obs.partner_slug}</strong>
        <Badge tone={tone}>{summary}</Badge>
      </div>

      {obs.observed_context && (
        <details style={{ marginTop: '0.5rem' }}>
          <summary style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
            Scraped context
          </summary>
          <pre
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              fontSize: '0.75rem',
              background: 'rgba(0,0,0,0.04)',
              borderRadius: '0.25rem',
              whiteSpace: 'pre-wrap',
              maxHeight: '8rem',
              overflow: 'auto',
            }}
          >
            {obs.observed_context}
          </pre>
        </details>
      )}

      <details style={{ marginTop: '0.5rem' }}>
        <summary style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
          Suggested SQL (review before running)
        </summary>
        <div style={{ marginTop: '0.5rem' }}>
          <pre
            style={{
              padding: '0.75rem',
              fontSize: '0.75rem',
              background: 'rgba(0,0,0,0.04)',
              borderRadius: '0.25rem',
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
            }}
          >
            {sql}
          </pre>
          <div style={{ marginTop: '0.5rem' }}>
            <CopySqlButton sql={sql} />
          </div>
        </div>
      </details>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
        <form action={dismissObservation} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="hidden" name="id" value={obs.id} />
          <input
            name="reason"
            placeholder="Why dismiss? (optional)"
            style={{
              fontSize: '0.8125rem',
              padding: '0.375rem 0.5rem',
              border: '1px solid var(--color-border-soft)',
              borderRadius: '0.25rem',
              minWidth: '12rem',
            }}
          />
          <button
            type="submit"
            className="rg-btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
          >
            Dismiss
          </button>
        </form>
        <a
          href={`/admin/programs/${obs.program_slug}/edit`}
          style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}
        >
          Open program editor ↗
        </a>
      </div>
    </div>
  )
}
