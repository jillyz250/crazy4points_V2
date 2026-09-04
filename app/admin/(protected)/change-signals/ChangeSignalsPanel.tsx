import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardBody } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { dismissSignal, snoozeSignal } from './actions'
import { isStandingSignal, alreadyReflected, ownNameTokens } from './reconcile'
import ApplyToPage from './ApplyToPage'

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

/** Live count of open (non-snoozed) change signals — for the hub tab badge. */
export async function changeSignalsCount(): Promise<number> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('change_signals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')
    .or(`snoozed_until.is.null,snoozed_until.lte.${new Date().toISOString()}`)
  return count ?? 0
}

/**
 * Change signals panel — the body of the old /admin/change-signals page,
 * relocated verbatim so it can render inside the Accuracy hub. Detection only:
 * verify against the issuer's own page, apply manually, then dismiss.
 */
export default async function ChangeSignalsPanel() {
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

  // Reconcile: for STANDING signals tied to a program, fetch that program's
  // prose ONCE (quirks + sweet_spots + intro) and decide whether the change is
  // already documented. Biased toward showing "Apply" when uncertain, so a real
  // change is never silently hidden. No LLM here — a cheap token-overlap check.
  const standingSlugs = Array.from(
    new Set(
      signals
        .filter((s) => isStandingSignal(s.signal_type) && s.program_slug)
        .map((s) => s.program_slug as string),
    ),
  )
  const pageTextBySlug = new Map<string, string>()
  const ownTokensBySlug = new Map<string, string[]>()
  if (standingSlugs.length > 0) {
    const { data: progRows } = await supabase
      .from('programs')
      .select('slug, name, quirks, sweet_spots, intro')
      .in('slug', standingSlugs)
    for (const p of (progRows ?? []) as Array<{ slug: string; name: string | null; quirks: string | null; sweet_spots: string | null; intro: string | null }>) {
      pageTextBySlug.set(p.slug, [p.quirks, p.sweet_spots, p.intro].filter(Boolean).join('\n'))
      ownTokensBySlug.set(p.slug, ownNameTokens(p.name, p.slug))
    }
  }

  return (
    <div>
      <PageHeader
        title="Change signals"
        description="Daily scan of issuer newsrooms + points blogs for transfer-partner / award-ratio CHANGES affecting programs we track (Haiku-classified). For a standing program change not yet on the page, verify against the source, then Apply to page (review the drafted edit before it's saved). Temporary promos are alerts, never page edits."
      />

      {signals.length === 0 ? (
        <EmptyState title="No open signals" description="The announcement monitor hasn't flagged any unreviewed changes." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {signals.map((s) => {
            const eligible = isStandingSignal(s.signal_type) && !!s.program_slug
            const onPage =
              eligible &&
              alreadyReflected(
                s.summary,
                pageTextBySlug.get(s.program_slug as string) ?? '',
                ownTokensBySlug.get(s.program_slug as string) ?? [],
              )
            return (
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
                {eligible && (
                  <div style={{ margin: '0 0 0.5rem' }}>
                    {onPage ? (
                      <span
                        style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--admin-text-muted, #4a4a4a)' }}
                        title="This program page already appears to document this change (token match against its quirks / sweet spots / intro)."
                      >
                        ✓ Already on page
                      </span>
                    ) : (
                      <ApplyToPage signalId={s.id} programSlug={s.program_slug as string} />
                    )}
                  </div>
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
            )
          })}
        </div>
      )}
    </div>
  )
}
