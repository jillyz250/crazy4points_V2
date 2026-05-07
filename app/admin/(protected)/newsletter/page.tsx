import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import NewsletterEditor from './NewsletterEditor'
import InputsPreview from './InputsPreview'
import type { NewsletterSlots, AlsoHappeningItem } from '@/utils/ai/newsletterSlots'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState as UIEmptyState } from '@/components/admin/ui/EmptyState'

export const dynamic = 'force-dynamic'

type NewsletterRow = {
  id: string
  week_of: string
  subject: string | null
  subject_options: string[] | null
  status: 'draft' | 'sent' | 'failed'
  sent_at: string | null
  recipient_count: number | null
  created_at: string
  // V2 slot columns (migration 222)
  hero_kicker: string | null
  jill_prompt: string | null
  big_story_ref_type: 'alert' | 'intel' | null
  big_story_ref_id: string | null
  big_story_html: string | null
  also_happening: AlsoHappeningItem[] | null
  jills_take_html: string | null
  game_slug: string | null
  game_title: string | null
  game_clue_text: string | null
}

function rowToSlots(r: NewsletterRow): NewsletterSlots {
  return {
    hero_kicker: r.hero_kicker,
    game: { slug: r.game_slug, title: r.game_title, clue_text: r.game_clue_text },
    big_story_ref_type: r.big_story_ref_type,
    big_story_ref_id: r.big_story_ref_id,
    big_story_html: r.big_story_html,
    also_happening: Array.isArray(r.also_happening) ? r.also_happening : [],
    jills_take_html: r.jills_take_html,
    jill_prompt: r.jill_prompt,
    subject: r.subject ?? r.subject_options?.[0] ?? '',
    subject_options: r.subject_options ?? [],
  }
}

function isPopulated(r: NewsletterRow): boolean {
  return !!(
    r.big_story_html ||
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
      'id, week_of, subject, subject_options, status, sent_at, recipient_count, created_at, hero_kicker, jill_prompt, big_story_ref_type, big_story_ref_id, big_story_html, also_happening, jills_take_html, game_slug, game_title, game_clue_text',
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
