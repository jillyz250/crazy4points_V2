import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import NewsletterEditor from './NewsletterEditor'
import type { NewsletterDraft } from '@/utils/ai/buildNewsletter'

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
    .select('id, week_of, subject, subject_options, draft_json, comic_url, status, sent_at, recipient_count, created_at')
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
          />
          <History rows={rows} activeId={current.id} />
        </>
      ) : (
        <EmptyState hasAny={rows.length > 0} rows={rows} />
      )}
    </div>
  )
}

function History({ rows, activeId }: { rows: NewsletterRow[]; activeId: string }) {
  if (rows.length <= 1) return null
  return (
    <div style={{ marginTop: '2.5rem' }}>
      <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Past weeks</h2>
      <div style={{
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        background: '#fff',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '0.9375rem' }}>
          <thead>
            <tr style={{ background: 'var(--color-background-soft)', textAlign: 'left' }}>
              <th style={thStyle}>Week of</th>
              <th style={thStyle}>Subject</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Sent to</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--color-border-soft)', background: r.id === activeId ? 'var(--color-background-soft)' : 'transparent' }}>
                <td style={tdStyle}>{r.week_of}</td>
                <td style={tdStyle}>{r.subject ?? <em style={{ color: 'var(--color-text-secondary)' }}>—</em>}</td>
                <td style={tdStyle}>{r.status}</td>
                <td style={tdStyle}>{r.recipient_count ?? '—'}</td>
                <td style={tdStyle}>
                  {r.id !== activeId && (
                    <Link href={`/admin/newsletter?id=${r.id}`} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                      Open →
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptyState({ hasAny, rows }: { hasAny: boolean; rows: NewsletterRow[] }) {
  return (
    <div>
      <h1>Newsletter</h1>
      <div style={{
        marginTop: '1rem',
        padding: '2rem',
        border: '1px dashed var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-background-soft)',
        textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', margin: '0 0 1rem' }}>
          {hasAny ? 'Selected newsletter has no draft content.' : 'No newsletters yet.'}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.875rem' }}>
          Trigger one manually: <code>curl -H "x-intel-secret: $INTEL_API_SECRET" http://localhost:3000/api/build-newsletter?force=1</code>
        </p>
      </div>
      {hasAny && <History rows={rows} activeId="" />}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  verticalAlign: 'middle',
}
