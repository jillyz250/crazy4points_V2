import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getPrograms } from '@/utils/supabase/queries'
import { updateContentIdeaStatusAction, updateContentIdeaNotesAction, updateContentIdeaOverrideAction } from './actions'
import WriteArticleButton from '@/components/admin/WriteArticleButton'
import FactCheckButton from '@/components/admin/FactCheckButton'
import BrandCheckButton from '@/components/admin/BrandCheckButton'
import CheckOriginalityButton from '@/components/admin/CheckOriginalityButton'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

type IdeaStatus = 'new' | 'queued' | 'drafted' | 'published' | 'dismissed'
type IdeaType = 'newsletter' | 'blog'
type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'

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
  article_body: string | null
  written_by: string | null
  written_at: string | null
  fact_checked_at: string | null
  fact_check_claims: unknown
  voice_checked_at: string | null
  voice_notes: string | null
  voice_pass: boolean | null
  originality_checked_at: string | null
  originality_notes: string | null
  originality_pass: boolean | null
  override_reason: string | null
  source_alert?: {
    title: string | null
    end_date: string | null
    computed_score: number | null
  } | null
}

const STATUS_TONE: Record<IdeaStatus, { tone: Tone; label: string }> = {
  new:       { tone: 'accent', label: 'New' },
  queued:    { tone: 'warning', label: 'Queued' },
  drafted:   { tone: 'info', label: 'Drafted' },
  published: { tone: 'success', label: 'Published' },
  dismissed: { tone: 'neutral', label: 'Dismissed' },
}

const NEXT_STATUS: Record<IdeaStatus, { label: string; to: IdeaStatus; variant?: 'primary' | 'secondary' }[]> = {
  new:       [{ label: 'Queue', to: 'queued', variant: 'primary' }, { label: 'Dismiss', to: 'dismissed', variant: 'secondary' }],
  queued:    [{ label: 'Mark Drafted', to: 'drafted', variant: 'primary' }, { label: 'Back to New', to: 'new', variant: 'secondary' }, { label: 'Dismiss', to: 'dismissed', variant: 'secondary' }],
  drafted:   [{ label: 'Mark Published', to: 'published', variant: 'primary' }, { label: 'Back to Queued', to: 'queued', variant: 'secondary' }],
  published: [{ label: 'Reopen', to: 'queued', variant: 'secondary' }],
  dismissed: [{ label: 'Restore', to: 'new', variant: 'secondary' }],
}

export default async function ContentIdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; q?: string; program?: string }>
}) {
  const sp = await searchParams
  const typeFilter = sp.type
  const statusFilter = sp.status
  const q = (sp.q ?? '').trim()
  const programSlug = (sp.program ?? '').trim()
  const supabase = createAdminClient()

  // Program filter: get tagged alert_ids AND capture the program name so we
  // can ALSO match ideas that mention the program by name in their title /
  // pitch / notes / source-alert title. Many alerts come in untagged (Scout
  // doesn't always populate alert_programs), so a strict junction-only filter
  // misses ideas that obviously belong to the program.
  let programTaggedAlertIds: Set<string> | null = null
  let programNameNeedle: string | null = null
  if (programSlug) {
    const { data: program } = await supabase
      .from('programs')
      .select('id, name')
      .eq('slug', programSlug)
      .maybeSingle()
    if (program) {
      programNameNeedle = program.name.toLowerCase()
      const { data: links } = await supabase
        .from('alert_programs')
        .select('alert_id')
        .eq('program_id', program.id)
      programTaggedAlertIds = new Set((links ?? []).map((l) => l.alert_id as string))
    }
  }

  let query = supabase
    .from('content_ideas')
    .select('*, source_alert:alerts!source_alert_id(title, end_date, computed_score)')
    .order('created_at', { ascending: false })

  if (typeFilter === 'newsletter' || typeFilter === 'blog') {
    query = query.eq('type', typeFilter)
  }
  if (statusFilter && ['new', 'queued', 'drafted', 'published', 'dismissed'].includes(statusFilter)) {
    query = query.eq('status', statusFilter)
  } else if (!statusFilter) {
    query = query.in('status', ['new', 'queued', 'drafted'])
  }
  // Text search and program filter are applied in-memory below, not via
  // PostgREST `.or()` — PostgREST's or-filter has nasty edge cases with
  // embedded spaces, parens, and punctuation in ilike patterns. Admin lists
  // are small enough that a JS filter is predictable and bug-free.

  const [queryRes, programs] = await Promise.all([query, getPrograms(supabase)])
  if (queryRes.error) throw queryRes.error
  let ideas = (queryRes.data ?? []) as ContentIdeaRow[]

  // Program filter: keep ideas whose source_alert is tagged OR whose text
  // mentions the program by name (works around upstream untagged alerts).
  if (programNameNeedle) {
    ideas = ideas.filter((i) => {
      const taggedHit = i.source_alert_id && programTaggedAlertIds?.has(i.source_alert_id)
      if (taggedHit) return true
      const hay = [i.title, i.pitch, i.notes ?? '', i.source_alert?.title ?? ''].join(' ').toLowerCase()
      return hay.includes(programNameNeedle)
    })
  }

  if (q) {
    const needle = q.toLowerCase()
    ideas = ideas.filter((i) =>
      i.title.toLowerCase().includes(needle) ||
      i.pitch.toLowerCase().includes(needle) ||
      (i.notes ?? '').toLowerCase().includes(needle) ||
      (i.source_alert?.title ?? '').toLowerCase().includes(needle)
    )
  }

  const now = Date.now()
  const rankScore = (i: ContentIdeaRow): number => {
    const end = i.source_alert?.end_date ? new Date(i.source_alert.end_date).getTime() : null
    if (end !== null && !isNaN(end)) {
      const hoursLeft = (end - now) / (60 * 60 * 1000)
      if (hoursLeft > 0 && hoursLeft <= 48) return 0
      if (hoursLeft > 48 && hoursLeft <= 24 * 7) return 1
      if (hoursLeft > 24 * 7) return 2
      return 4
    }
    return 3
  }
  const sortIdeas = (list: ContentIdeaRow[]) =>
    [...list].sort((a, b) => {
      const ra = rankScore(a)
      const rb = rankScore(b)
      if (ra !== rb) return ra - rb
      const sa = a.source_alert?.computed_score ?? -Infinity
      const sb = b.source_alert?.computed_score ?? -Infinity
      if (sa !== sb) return sb - sa
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const newsletter = sortIdeas(ideas.filter((i) => i.type === 'newsletter'))
  const blog = sortIdeas(ideas.filter((i) => i.type === 'blog'))

  return (
    <div>
      <PageHeader
        title="Content Pipeline"
        description="Running queue of newsletter candidates and blog ideas produced by each day's editorial plan."
      />

      <form
        method="GET"
        action="/admin/content-ideas"
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search title, pitch, notes…"
          className="admin-input"
          style={{ minWidth: '16rem', flex: '1 1 16rem' }}
        />
        <select name="program" defaultValue={programSlug} className="admin-input" style={{ minWidth: '14rem' }}>
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
          Search
        </button>
        {(q || programSlug) && (
          <Link
            href={`/admin/content-ideas${
              typeFilter || statusFilter
                ? `?${[typeFilter && `type=${typeFilter}`, statusFilter && `status=${statusFilter}`]
                    .filter(Boolean)
                    .join('&')}`
                : ''
            }`}
            className="admin-btn admin-btn-ghost admin-btn-sm"
          >
            Clear
          </Link>
        )}
      </form>

      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <FilterLink href={buildHref({ q, program: programSlug })} active={!typeFilter && !statusFilter} label="Open" />
        <FilterLink href={buildHref({ q, program: programSlug, type: 'newsletter' })} active={typeFilter === 'newsletter' && !statusFilter} label="Newsletter only" />
        <FilterLink href={buildHref({ q, program: programSlug, type: 'blog' })} active={typeFilter === 'blog' && !statusFilter} label="Blog only" />
        <FilterLink href={buildHref({ q, program: programSlug, status: 'published' })} active={statusFilter === 'published'} label="Published" />
        <FilterLink href={buildHref({ q, program: programSlug, status: 'dismissed' })} active={statusFilter === 'dismissed'} label="Dismissed" />
      </div>

      <IdeaSection title="Newsletter Candidates" ideas={newsletter} />
      <IdeaSection title="Blog Ideas" ideas={blog} />

      {ideas.length === 0 && (
        <EmptyState title="Nothing here" description="The daily brief adds ideas automatically." />
      )}
    </div>
  )
}

function buildHref(parts: { q?: string; program?: string; type?: string; status?: string }): string {
  const search = new URLSearchParams()
  if (parts.q) search.set('q', parts.q)
  if (parts.program) search.set('program', parts.program)
  if (parts.type) search.set('type', parts.type)
  if (parts.status) search.set('status', parts.status)
  const qs = search.toString()
  return qs ? `/admin/content-ideas?${qs}` : '/admin/content-ideas'
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link href={href} className={`admin-btn admin-btn-sm ${active ? 'admin-btn-primary' : 'admin-btn-ghost'}`}>
      {label}
    </Link>
  )
}

function IdeaSection({ title, ideas }: { title: string; ideas: ContentIdeaRow[] }) {
  if (ideas.length === 0) return null
  return (
    <section style={{ marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '0.9375rem' }}>{title}</h2>
        <Badge tone="neutral">{ideas.length}</Badge>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>
    </section>
  )
}

function rankLabel(idea: ContentIdeaRow): { label: string; tone: Tone } | null {
  const end = idea.source_alert?.end_date ? new Date(idea.source_alert.end_date) : null
  if (end && !isNaN(end.getTime())) {
    const hoursLeft = (end.getTime() - Date.now()) / (60 * 60 * 1000)
    const dateStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (hoursLeft < 0) return { label: 'Expired', tone: 'danger' }
    if (hoursLeft <= 48) return { label: `⏰ Ends ${dateStr}`, tone: 'warning' }
    if (hoursLeft <= 24 * 7) return { label: `Ends ${dateStr}`, tone: 'neutral' }
    return { label: `Ends ${dateStr}`, tone: 'neutral' }
  }
  return null
}

interface VerificationPill {
  label: string
  on: boolean
  hint: string
}

function verificationPills(idea: ContentIdeaRow): VerificationPill[] {
  const flagged = Array.isArray(idea.fact_check_claims)
    ? (idea.fact_check_claims as { supported?: boolean }[]).some((c) => c && c.supported === false)
    : false
  return [
    {
      label: 'Written',
      on: Boolean(idea.written_at && idea.article_body),
      hint: idea.written_by ? `Written by ${idea.written_by}` : 'Article body not drafted yet',
    },
    {
      label: 'Fact-checked',
      on: Boolean(idea.fact_checked_at) && !flagged,
      hint: idea.fact_checked_at
        ? flagged
          ? 'Fact-check ran but claims are flagged'
          : `Fact-checked ${new Date(idea.fact_checked_at).toLocaleDateString()}`
        : 'Not fact-checked yet',
    },
    {
      label: 'On-brand voice',
      on: Boolean(idea.voice_checked_at) && idea.voice_pass === true,
      hint: idea.voice_checked_at
        ? idea.voice_notes
          ? `${idea.voice_pass ? 'PASS' : 'FAIL'} — ${idea.voice_notes}`
          : `Voice-checked ${new Date(idea.voice_checked_at).toLocaleDateString()}`
        : 'Not voice-checked yet',
    },
    {
      label: 'Original',
      on: Boolean(idea.originality_checked_at) && idea.originality_pass === true,
      hint: idea.originality_checked_at
        ? idea.originality_notes
          ? `${idea.originality_pass ? 'PASS' : 'FAIL'} — ${idea.originality_notes}`
          : `Originality checked ${new Date(idea.originality_checked_at).toLocaleDateString()}`
        : 'Originality not checked yet',
    },
  ]
}

function VerificationRow({ pills }: { pills: VerificationPill[] }) {
  return (
    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
      {pills.map((p) => (
        <span key={p.label} title={p.hint}>
          <Badge tone={p.on ? 'success' : 'neutral'}>
            {p.on ? '✓' : '○'} {p.label}
          </Badge>
        </span>
      ))}
    </div>
  )
}

function IdeaCard({ idea }: { idea: ContentIdeaRow }) {
  const statusDef = STATUS_TONE[idea.status]
  const actions = NEXT_STATUS[idea.status] ?? []
  const rank = rankLabel(idea)
  const score = idea.source_alert?.computed_score
  const pills = verificationPills(idea)
  return (
    <div className="admin-card" style={{ padding: '1rem 1.125rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', margin: 0, flex: 1, color: 'var(--admin-text)' }}>{idea.title}</h3>
        <Badge tone={statusDef.tone}>{statusDef.label}</Badge>
      </div>

      {(rank || typeof score === 'number') && (
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
          {rank && <Badge tone={rank.tone}>{rank.label}</Badge>}
          {typeof score === 'number' && !isNaN(score) && (
            <Badge tone="accent">Score {score.toFixed(1)}</Badge>
          )}
        </div>
      )}

      <VerificationRow pills={pills} />

      <p style={{ margin: '0 0 0.75rem', color: 'var(--admin-text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
        {idea.pitch}
      </p>

      {idea.article_body && (
        <details style={{ margin: '0 0 0.75rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--admin-accent)', fontWeight: 600 }}>
            Article body ({idea.article_body.length.toLocaleString()} chars{idea.written_at ? ` · drafted ${new Date(idea.written_at).toLocaleString()}` : ''})
          </summary>
          <pre
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem 0.875rem',
              background: 'var(--admin-surface-alt)',
              border: '1px solid var(--admin-border)',
              borderRadius: 'var(--admin-radius)',
              fontSize: '0.8125rem',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {idea.article_body}
          </pre>
        </details>
      )}

      {idea.source_alert_id && (
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem' }}>
          <Link href={`/admin/alerts/${idea.source_alert_id}/edit`} style={{ fontWeight: 600 }}>
            → Open source alert
          </Link>
        </p>
      )}

      <form action={updateContentIdeaNotesAction.bind(null, idea.id)} style={{ marginBottom: '0.5rem' }}>
        <textarea
          name="notes"
          defaultValue={idea.notes ?? ''}
          placeholder="Notes / outline…"
          rows={2}
          className="admin-input"
          style={{ width: '100%', resize: 'vertical' }}
        />
        <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm" style={{ marginTop: '0.375rem' }}>
          Save notes
        </button>
      </form>

      <details style={{ marginBottom: '0.75rem' }} open={Boolean(idea.override_reason)}>
        <summary style={{ cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-ui)', color: idea.override_reason ? '#b45309' : 'var(--admin-text-muted)' }}>
          {idea.override_reason ? '⚠ Override active' : 'Editorial override (use sparingly)'}
        </summary>
        <form action={updateContentIdeaOverrideAction.bind(null, idea.id)} style={{ marginTop: '0.375rem' }}>
          <textarea
            name="override_reason"
            defaultValue={idea.override_reason ?? ''}
            placeholder="Why publishing despite a fact-check or check failure. Leave blank to require all 4 pills."
            rows={2}
            className="admin-input"
            style={{ width: '100%', resize: 'vertical' }}
          />
          <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm" style={{ marginTop: '0.375rem' }}>
            Save override
          </button>
        </form>
      </details>

      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <WriteArticleButton ideaId={idea.id} hasBody={Boolean(idea.article_body)} />
        <FactCheckButton ideaId={idea.id} hasBody={Boolean(idea.article_body)} />
        <BrandCheckButton ideaId={idea.id} hasBody={Boolean(idea.article_body)} />
        <CheckOriginalityButton ideaId={idea.id} hasBody={Boolean(idea.article_body)} />
        {actions.map((a) => (
          <form key={a.to} action={updateContentIdeaStatusAction.bind(null, idea.id, a.to)}>
            <button
              type="submit"
              className={`admin-btn admin-btn-sm ${a.variant === 'primary' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              {a.label}
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
