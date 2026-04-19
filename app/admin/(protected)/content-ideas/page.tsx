import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { updateContentIdeaStatusAction, updateContentIdeaNotesAction } from './actions'

type IdeaStatus = 'new' | 'queued' | 'drafted' | 'published' | 'dismissed'
type IdeaType = 'newsletter' | 'blog'

interface ContentIdeaRow {
  id: string
  type: IdeaType
  title: string
  pitch: string
  status: IdeaStatus
  source: string
  source_alert_id: string | null
  source_intel_id: string | null
  source_brief_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

const STATUS_COLORS: Record<IdeaStatus, { bg: string; fg: string; label: string }> = {
  new:       { bg: '#F8F5FB', fg: '#6B2D8F', label: 'New' },
  queued:    { bg: '#FFF8E1', fg: '#92400e', label: 'Queued' },
  drafted:   { bg: '#E0F2FE', fg: '#075985', label: 'Drafted' },
  published: { bg: '#DCFCE7', fg: '#166534', label: 'Published' },
  dismissed: { bg: '#F3F4F6', fg: '#6B7280', label: 'Dismissed' },
}

const NEXT_STATUS: Record<IdeaStatus, { label: string; to: IdeaStatus }[]> = {
  new:       [{ label: 'Queue', to: 'queued' }, { label: 'Dismiss', to: 'dismissed' }],
  queued:    [{ label: 'Mark Drafted', to: 'drafted' }, { label: 'Back to New', to: 'new' }, { label: 'Dismiss', to: 'dismissed' }],
  drafted:   [{ label: 'Mark Published', to: 'published' }, { label: 'Back to Queued', to: 'queued' }],
  published: [{ label: 'Reopen', to: 'queued' }],
  dismissed: [{ label: 'Restore', to: 'new' }],
}

export default async function ContentIdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>
}) {
  const { type: typeFilter, status: statusFilter } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('content_ideas')
    .select('*')
    .order('created_at', { ascending: false })

  if (typeFilter === 'newsletter' || typeFilter === 'blog') {
    query = query.eq('type', typeFilter)
  }
  if (statusFilter && ['new', 'queued', 'drafted', 'published', 'dismissed'].includes(statusFilter)) {
    query = query.eq('status', statusFilter)
  } else if (!statusFilter) {
    query = query.in('status', ['new', 'queued', 'drafted'])
  }

  const { data, error } = await query
  if (error) throw error
  const ideas = (data ?? []) as ContentIdeaRow[]

  const newsletter = ideas.filter((i) => i.type === 'newsletter')
  const blog = ideas.filter((i) => i.type === 'blog')

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Content Pipeline</h1>
        <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>
          Running queue of newsletter candidates and blog ideas produced by each day's editorial plan.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', flexWrap: 'wrap' }}>
        <FilterLink href="/admin/content-ideas" active={!typeFilter && !statusFilter} label="Open" />
        <FilterLink href="/admin/content-ideas?type=newsletter" active={typeFilter === 'newsletter' && !statusFilter} label="Newsletter only" />
        <FilterLink href="/admin/content-ideas?type=blog" active={typeFilter === 'blog' && !statusFilter} label="Blog only" />
        <FilterLink href="/admin/content-ideas?status=published" active={statusFilter === 'published'} label="Published" />
        <FilterLink href="/admin/content-ideas?status=dismissed" active={statusFilter === 'dismissed'} label="Dismissed" />
      </div>

      <IdeaSection title="📬 Newsletter Candidates" ideas={newsletter} />
      <IdeaSection title="✍️ Blog Ideas" ideas={blog} />

      {ideas.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', padding: '2rem 0', textAlign: 'center' }}>
          Nothing here. The daily brief adds ideas automatically.
        </p>
      )}
    </div>
  )
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      style={{
        padding: '0.375rem 0.75rem',
        borderRadius: 'var(--radius-ui)',
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border-soft)'}`,
        background: active ? 'var(--color-primary)' : 'white',
        color: active ? 'white' : 'var(--color-text-primary)',
        textDecoration: 'none',
        fontWeight: 600,
      }}
    >
      {label}
    </Link>
  )
}

function IdeaSection({ title, ideas }: { title: string; ideas: ContentIdeaRow[] }) {
  if (ideas.length === 0) return null
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title} · {ideas.length}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>
    </section>
  )
}

function IdeaCard({ idea }: { idea: ContentIdeaRow }) {
  const color = STATUS_COLORS[idea.status]
  const actions = NEXT_STATUS[idea.status] ?? []
  return (
    <div
      style={{
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        padding: '1.25rem',
        background: 'white',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1.0625rem', margin: 0, flex: 1 }}>{idea.title}</h3>
        <span
          style={{
            padding: '0.25rem 0.625rem',
            borderRadius: '999px',
            background: color.bg,
            color: color.fg,
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-ui)',
            whiteSpace: 'nowrap',
          }}
        >
          {color.label}
        </span>
      </div>

      <p style={{ margin: '0 0 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
        {idea.pitch}
      </p>

      {idea.source_alert_id && (
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem' }}>
          <Link href={`/admin/alerts/${idea.source_alert_id}/edit`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            → Open source alert
          </Link>
        </p>
      )}

      <form action={updateContentIdeaNotesAction.bind(null, idea.id)} style={{ marginBottom: '0.75rem' }}>
        <textarea
          name="notes"
          defaultValue={idea.notes ?? ''}
          placeholder="Notes / outline…"
          rows={2}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-ui)',
            border: '1px solid var(--color-border-soft)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            resize: 'vertical',
          }}
        />
        <button type="submit" style={{ marginTop: '0.375rem', fontSize: '0.75rem', padding: '0.25rem 0.625rem', background: 'transparent', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-ui)', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
          Save notes
        </button>
      </form>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {actions.map((a) => (
          <form key={a.to} action={updateContentIdeaStatusAction.bind(null, idea.id, a.to)}>
            <button
              type="submit"
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: 'var(--radius-ui)',
                border: '1px solid var(--color-primary)',
                background: a.to === 'dismissed' ? 'white' : 'var(--color-primary)',
                color: a.to === 'dismissed' ? 'var(--color-primary)' : 'white',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'var(--font-ui)',
                cursor: 'pointer',
              }}
            >
              {a.label}
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
