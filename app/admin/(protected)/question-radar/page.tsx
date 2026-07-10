import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { setQuestionStatus } from './actions'

export const dynamic = 'force-dynamic'

type Q = {
  id: string
  source: string
  source_detail: string | null
  source_url: string | null
  question: string
  topic: string | null
  relevance: number
  matched_url: string | null
  matched_label: string | null
  post_hook: string | null
  status: string
  fetched_at: string
}

function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={setQuestionStatus} style={{ display: 'inline' }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '0.3rem 0.6rem',
          borderRadius: '0.375rem',
          border: '1px solid var(--color-border-soft)',
          background: 'var(--color-background)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    </form>
  )
}

export default async function QuestionRadarPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('content_questions')
    .select('*')
    .in('status', ['new', 'saved'])
    .order('status', { ascending: true }) // 'new' before 'saved'
    .order('relevance', { ascending: false })
    .order('fetched_at', { ascending: false })
    .limit(200)

  const questions = (data ?? []) as Q[]
  const tableMissing = error?.message?.includes('content_questions') || error?.code === '42P01'

  return (
    <div>
      <PageHeader
        title="Question Radar"
        description="Real user questions pulled daily from Reddit + Google 'People Also Ask', ranked by relevance and matched to a page you can link. Each has a draft post hook. Save the good ones, mark them used once you post, dismiss the rest."
      />

      {tableMissing ? (
        <EmptyState
          title="Table not created yet"
          description="Apply migration 604_content_questions.sql, then the daily cron will start filling this in."
        />
      ) : questions.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="The daily scrape hasn't added anything, or you've cleared the queue. Check back after the next run."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {questions.map((q) => (
            <div
              key={q.id}
              style={{
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-card)',
                background: 'var(--color-background)',
                padding: '1rem 1.25rem',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Badge tone={q.source === 'reddit' ? 'warning' : 'neutral'}>
                  {q.source === 'reddit' ? q.source_detail ?? 'reddit' : 'Google'}
                </Badge>
                {q.topic && <Badge tone="neutral">{q.topic}</Badge>}
                <Badge tone={q.relevance >= 85 ? 'danger' : q.relevance >= 70 ? 'warning' : 'neutral'}>
                  {q.relevance}
                </Badge>
                {q.status === 'saved' && <Badge tone="warning">saved</Badge>}
                {q.source_url && (
                  <a
                    href={q.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: 'auto', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--color-primary)' }}
                  >
                    source ↗
                  </a>
                )}
              </div>

              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>
                {q.question}
              </p>

              {q.matched_url && q.matched_label && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0 0 0.5rem' }}>
                  Link to:{' '}
                  <Link href={q.matched_url} style={{ color: 'var(--color-primary)' }}>
                    {q.matched_label}
                  </Link>
                </p>
              )}

              {q.post_hook && (
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9375rem',
                    fontStyle: 'italic',
                    color: 'var(--color-text-primary)',
                    background: 'var(--color-background-soft)',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    margin: '0 0 0.75rem',
                  }}
                >
                  {q.post_hook}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {q.status === 'new' && <StatusButton id={q.id} status="saved" label="Save" />}
                <StatusButton id={q.id} status="used" label="Mark used" />
                <StatusButton id={q.id} status="dismissed" label="Dismiss" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
