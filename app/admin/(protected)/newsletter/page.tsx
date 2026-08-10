import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import NewsletterEditor from './NewsletterEditor'
import InputsPreview from './InputsPreview'
import type { NewsletterSlots, AlsoHappeningItem } from '@/utils/ai/newsletterSlots'
import type { VerifyClaim } from '@/utils/ai/verifyAlertDraft'
import type { MissingFact } from '@/utils/ai/verifyBigStoryDraft'
import { getNewsletterInputs } from '@/utils/ai/runBuildNewsletter'
import { getActiveBonusAlerts, type ActiveBonusAlert } from '@/utils/ai/getActiveBonusAlerts'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState as UIEmptyState } from '@/components/admin/ui/EmptyState'

export type BigStoryCandidate = {
  id: string
  title: string
  slug: string | null
  alert_type: string | null
  published_at: string | null
  end_date: string | null
  why_this_matters: string | null
}

export const dynamic = 'force-dynamic'

type NewsletterRow = {
  id: string
  week_of: string
  subject: string | null
  subject_options: string[] | null
  status: 'draft' | 'sent' | 'failed'
  sent_at: string | null
  display_date: string | null
  recipient_count: number | null
  created_at: string
  // V2 slot columns (migration 222)
  hero_kicker: string | null
  jill_prompt: string | null
  big_story_ref_type: 'alert' | 'intel' | null
  big_story_ref_id: string | null
  big_story_title: string | null
  big_story_html: string | null
  big_story_claims: VerifyClaim[] | null
  big_story_missing_facts: MissingFact[] | null
  sweet_spot_ref_type: 'alert' | null
  sweet_spot_ref_id: string | null
  sweet_spot: NewsletterSlots['sweet_spot'] | null
  top_experiences: NewsletterSlots['top_experiences'] | null
  top_sweepstakes: NewsletterSlots['top_sweepstakes'] | null
  also_happening: AlsoHappeningItem[] | null
  active_offers: NewsletterSlots['active_offers']
  elevated_bonuses: NewsletterSlots['elevated_bonuses']
  jills_take_html: string | null
  game_slug: string | null
  game_title: string | null
  game_clue_text: string | null
}

function rowToSlots(r: NewsletterRow): NewsletterSlots {
  return {
    hero_kicker: r.hero_kicker,
    display_date: r.display_date,
    game: { slug: r.game_slug, title: r.game_title, clue_text: r.game_clue_text },
    big_story_ref_type: r.big_story_ref_type,
    big_story_ref_id: r.big_story_ref_id,
    big_story_title: r.big_story_title ?? null,
    big_story_html: r.big_story_html,
    sweet_spot: r.sweet_spot ?? null,
    top_experiences: r.top_experiences ?? null,
    top_sweepstakes: r.top_sweepstakes ?? null,
    also_happening: Array.isArray(r.also_happening) ? r.also_happening : [],
    active_offers: r.active_offers ?? null,
    elevated_bonuses: r.elevated_bonuses ?? null,
    jills_take_html: r.jills_take_html,
    jill_prompt: r.jill_prompt,
    subject: r.subject ?? r.subject_options?.[0] ?? '',
    subject_options: r.subject_options ?? [],
  }
}

function isPopulated(r: NewsletterRow): boolean {
  return !!(
    r.big_story_html ||
    r.sweet_spot ||
    (r.also_happening && r.also_happening.length > 0) ||
    r.jills_take_html ||
    r.subject ||
    (r.subject_options && r.subject_options.length > 0)
  )
}

export default async function NewsletterAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id: idParam } = await searchParams
  const supabase = createAdminClient()

  const { data: rowsData } = await supabase
    .from('newsletters')
    .select(
      'id, week_of, subject, subject_options, status, sent_at, display_date, recipient_count, created_at, hero_kicker, jill_prompt, big_story_ref_type, big_story_ref_id, big_story_title, big_story_html, big_story_claims, big_story_missing_facts, sweet_spot_ref_type, sweet_spot_ref_id, sweet_spot, top_experiences, top_sweepstakes, also_happening, active_offers, elevated_bonuses, jills_take_html, game_slug, game_title, game_clue_text',
    )
    .order('week_of', { ascending: false })
    .limit(12)

  const rows = (rowsData ?? []) as NewsletterRow[]

  const { count } = await supabase
    .from('subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('active', true)

  const activeCount = count ?? 0

  const current = idParam
    ? rows.find((r) => r.id === idParam)
    : rows.find((r) => r.status === 'draft') ?? rows[0]

  // NL1a — load eligible Big Story candidates (the same alert pool the
  // generator would consider) so the editor can show a picker. Skip the
  // query if we have no current draft or the newsletter is already sent.
  let candidates: BigStoryCandidate[] = []
  let activeBonuses: ActiveBonusAlert[] = []
  if (current && current.status !== 'sent') {
    try {
      const inputs = await getNewsletterInputs()
      // Top 5 candidates only — keeps the picker scannable and aligned with
      // the editorial cadence Jill described (pick from 5).
      candidates = inputs.alerts.slice(0, 5).map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        alert_type: a.alert_type,
        published_at: a.published_at,
        end_date: a.end_date,
        why_this_matters: a.why_this_matters,
      }))
    } catch {
      candidates = []
    }
    try {
      activeBonuses = await getActiveBonusAlerts()
    } catch {
      activeBonuses = []
    }
  }

  return (
    <div>
      {current && isPopulated(current) ? (
        <>
          <NewsletterEditor
            id={current.id}
            weekOf={current.week_of}
            status={current.status}
            slots={rowToSlots(current)}
            sentAt={current.sent_at}
            recipientCount={current.recipient_count}
            activeSubscriberCount={activeCount}
            bigStoryCandidates={candidates}
            bigStoryClaims={current.big_story_claims ?? []}
            bigStoryMissingFacts={current.big_story_missing_facts ?? []}
            sweetSpotRefId={current.sweet_spot_ref_id}
            sweetSpotRefType={current.sweet_spot_ref_type}
            activeBonuses={activeBonuses}
          />
          {/* Don't show the inputs preview for already-sent newsletters. */}
          {current.status !== 'sent' && <InputsPreview />}
          <History rows={rows} activeId={current.id} />
        </>
      ) : (
        <EmptyShell hasAny={rows.length > 0} rows={rows} />
      )}
    </div>
  )
}

function statusTone(status: NewsletterRow['status']): 'accent' | 'success' | 'danger' {
  if (status === 'sent') return 'success'
  if (status === 'failed') return 'danger'
  return 'accent'
}

function History({ rows, activeId }: { rows: NewsletterRow[]; activeId: string }) {
  if (rows.length <= 1) return null
  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Past weeks</h2>
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Week of</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Sent to</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ background: r.id === activeId ? 'var(--admin-surface-alt)' : 'transparent' }}>
                  <td style={{ fontWeight: 500 }}>{r.week_of}</td>
                  <td>{r.subject ?? <span style={{ color: 'var(--admin-text-subtle)' }}>—</span>}</td>
                  <td><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                  <td style={{ color: 'var(--admin-text-muted)' }}>{r.recipient_count ?? '—'}</td>
                  <td>
                    {r.id !== activeId && (
                      <Link href={`/admin/newsletter?id=${r.id}`} style={{ fontWeight: 600 }}>
                        Open →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function EmptyShell({ hasAny, rows }: { hasAny: boolean; rows: NewsletterRow[] }) {
  return (
    <div>
      <PageHeader title="Newsletter" description="Weekly newsletter draft & send." />
      <UIEmptyState
        title={hasAny ? 'Selected newsletter has no slot content yet' : 'No newsletters yet'}
        description={'Click "Run Now" once we have a draft row, or trigger via curl: curl -H "x-intel-secret: $INTEL_API_SECRET" http://localhost:3000/api/build-newsletter?force=1'}
      />
      {hasAny && <History rows={rows} activeId="" />}
    </div>
  )
}
