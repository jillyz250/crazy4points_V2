import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import NewsletterEditor from './NewsletterEditor'
import type { NewsletterDraft } from '@/utils/ai/buildNewsletter'
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
  draft_json: NewsletterDraft | null
  comic_url: string | null
  status: 'draft' | 'sent' | 'failed'
  sent_at: string | null
  recipient_count: number | null
  created_at: string
  fact_checked_at: string | null
  fact_check_claims: { claim: string; supported: boolean; severity: string; source_excerpt?: string | null }[] | null
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
    .select('id, week_of, subject, subject_options, draft_json, comic_url, status, sent_at, recipient_count, created_at, fact_checked_at, fact_check_claims')
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
      {current && current.draft_json ? (
        <>
          <NewsletterEditor
            id={current.id}
            weekOf={current.week_of}
            status={current.status}
            subject={current.subject ?? current.subject_options?.[0] ?? ''}
            subjectOptions={current.subject_options ?? []}
            draft={current.draft_json}
            sentAt={current.sent_at}
            recipientCount={current.recipient_count}
            activeSubscriberCount={activeCount}
            factCheckedAt={current.fact_checked_at}
            factCheckClaims={current.fact_check_claims}
          />
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
        title={hasAny ? 'Selected newsletter has no draft content' : 'No newsletters yet'}
        description={`Trigger one manually: curl -H "x-intel-secret: $INTEL_API_SECRET" http://localhost:3000/api/build-newsletter?force=1`}
      />
      {hasAny && <History rows={rows} activeId="" />}
    </div>
  )
}
