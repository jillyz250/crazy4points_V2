import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getPrograms, type Program } from '@/utils/supabase/queries'
import {
  updateContentIdeaStatusAction,
  updateContentIdeaNotesAction,
  updateContentIdeaOverrideAction,
} from './actions'
import { getBlogCategoryLabel } from '@/lib/blog/categories'
import WriteArticleButton from '@/components/admin/WriteArticleButton'
import FactCheckButton from '@/components/admin/FactCheckButton'
import BrandCheckButton from '@/components/admin/BrandCheckButton'
import CheckOriginalityButton from '@/components/admin/CheckOriginalityButton'
import RunAllChecksButton from '@/components/admin/RunAllChecksButton'
import RewriteFromVerifiedFactsButton from '@/components/admin/RewriteFromVerifiedFactsButton'
import BlogMetadataForm from '@/components/admin/BlogMetadataForm'
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
  // Blog publishing metadata (Ship 1)
  category: string | null
  excerpt: string | null
  hero_image_url: string | null
  primary_program_slug: string | null
  secondary_program_slugs: string[] | null
  card_slugs: string[] | null
  reading_time_minutes: number | null
  featured: boolean | null
  featured_rank: number | null
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
  searchParams: Promise<{ type?: string; status?: string; q?: string; program?: string; sortBy?: string }>
}) {
  const sp = await searchParams
  const typeFilter = sp.type
  const statusFilter = sp.status
  const q = (sp.q ?? '').trim()
  const programSlug = (sp.program ?? '').trim()
  type SortMode = 'urgency' | 'newest' | 'oldest'
  const sortMode: SortMode =
    sp.sortBy === 'newest' ? 'newest' :
    sp.sortBy === 'oldest' ? 'oldest' : 'urgency'
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

  // Auto-suggest primary program for blog ideas: for any idea that has a
  // source_alert_id but no primary_program_slug set yet, infer the program
  // from alert_programs. We pick the program tagged role='primary' if one
  // exists, otherwise the first linked program. Skips ideas that already
  // have primary_program_slug set or have no source alert.
  const sourceAlertIdsForSuggest = ideas
    .filter((i) => i.type === 'blog' && i.source_alert_id && !i.primary_program_slug)
    .map((i) => i.source_alert_id as string)
  const suggestedProgramByAlertId: Record<string, string> = {}
  if (sourceAlertIdsForSuggest.length > 0) {
    const { data: links } = await supabase
      .from('alert_programs')
      .select('alert_id, role, programs!inner(slug)')
      .in('alert_id', sourceAlertIdsForSuggest)
    type LinkRow = { alert_id: string; role: string | null; programs: { slug: string } | null }
    const rows = (links ?? []) as unknown as LinkRow[]
    for (const row of rows) {
      if (!row.programs?.slug) continue
      // Prefer 'primary' role; otherwise take the first link we see for the alert.
      if (row.role === 'primary') {
        suggestedProgramByAlertId[row.alert_id] = row.programs.slug
      } else if (!suggestedProgramByAlertId[row.alert_id]) {
        suggestedProgramByAlertId[row.alert_id] = row.programs.slug
      }
    }
  }

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
  const sortIdeas = (list: ContentIdeaRow[]) => {
    const byCreatedDesc = (a: ContentIdeaRow, b: ContentIdeaRow) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    const byCreatedAsc = (a: ContentIdeaRow, b: ContentIdeaRow) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()

    if (sortMode === 'newest') return [...list].sort(byCreatedDesc)
    if (sortMode === 'oldest') return [...list].sort(byCreatedAsc)

    // Default: urgency-first (deadline tier → score → newest).
    return [...list].sort((a, b) => {
      const ra = rankScore(a)
      const rb = rankScore(b)
      if (ra !== rb) return ra - rb
      const sa = a.source_alert?.computed_score ?? -Infinity
      const sb = b.source_alert?.computed_score ?? -Infinity
      if (sa !== sb) return sb - sa
      return byCreatedDesc(a, b)
    })
  }

  const newsletter = sortIdeas(ideas.filter((i) => i.type === 'newsletter'))
  const blog = sortIdeas(ideas.filter((i) => i.type === 'blog'))

  return (
    <div>
      <PageHeader
        title="Content Pipeline"
        description="Running queue of newsletter candidates and blog ideas produced by each day's editorial plan."
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Link
          href="/admin/content-ideas/new-from-prompt"
          className="admin-btn admin-btn-primary admin-btn-sm"
        >
          ⚡ New from prompt
        </Link>
      </div>

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
        {sp.sortBy && <input type="hidden" name="sortBy" value={sp.sortBy} />}
        <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
          Search
        </button>
        {(q || programSlug) && (
          <Link
            href={buildHref({ type: typeFilter, status: statusFilter, sortBy: sp.sortBy })}
            className="admin-btn admin-btn-ghost admin-btn-sm"
          >
            Clear
          </Link>
        )}
      </form>

      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <FilterLink href={buildHref({ q, program: programSlug, sortBy: sp.sortBy })} active={!typeFilter && !statusFilter} label="Open" />
        <FilterLink href={buildHref({ q, program: programSlug, type: 'newsletter', sortBy: sp.sortBy })} active={typeFilter === 'newsletter' && !statusFilter} label="Newsletter only" />
        <FilterLink href={buildHref({ q, program: programSlug, type: 'blog', sortBy: sp.sortBy })} active={typeFilter === 'blog' && !statusFilter} label="Blog only" />
        <FilterLink href={buildHref({ q, program: programSlug, status: 'published', sortBy: sp.sortBy })} active={statusFilter === 'published'} label="Published" />
        <FilterLink href={buildHref({ q, program: programSlug, status: 'dismissed', sortBy: sp.sortBy })} active={statusFilter === 'dismissed'} label="Dismissed" />
      </div>

      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', marginRight: '0.25rem' }}>Sort</span>
        <FilterLink href={buildHref({ q, program: programSlug, type: typeFilter, status: statusFilter })} active={sortMode === 'urgency'} label="Urgency" />
        <FilterLink href={buildHref({ q, program: programSlug, type: typeFilter, status: statusFilter, sortBy: 'newest' })} active={sortMode === 'newest'} label="Newest" />
        <FilterLink href={buildHref({ q, program: programSlug, type: typeFilter, status: statusFilter, sortBy: 'oldest' })} active={sortMode === 'oldest'} label="Oldest first" />
      </div>

      <IdeaSection title="Newsletter Candidates" ideas={newsletter} programs={programs} suggestedProgramByAlertId={suggestedProgramByAlertId} />
      <IdeaSection title="Blog Ideas" ideas={blog} programs={programs} suggestedProgramByAlertId={suggestedProgramByAlertId} />

      {ideas.length === 0 && (
        <EmptyState title="Nothing here" description="The daily brief adds ideas automatically." />
      )}
    </div>
  )
}

function buildHref(parts: { q?: string; program?: string; type?: string; status?: string; sortBy?: string }): string {
  const search = new URLSearchParams()
  if (parts.q) search.set('q', parts.q)
  if (parts.program) search.set('program', parts.program)
  if (parts.type) search.set('type', parts.type)
  if (parts.status) search.set('status', parts.status)
  if (parts.sortBy) search.set('sortBy', parts.sortBy)
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

function IdeaSection({
  title,
  ideas,
  programs,
  suggestedProgramByAlertId,
}: {
  title: string
  ideas: ContentIdeaRow[]
  programs: Program[]
  suggestedProgramByAlertId: Record<string, string>
}) {
  if (ideas.length === 0) return null
  return (
    <section style={{ marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '0.9375rem' }}>{title}</h2>
        <Badge tone="neutral">{ideas.length}</Badge>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            programs={programs}
            suggestedProgramSlug={
              idea.source_alert_id
                ? suggestedProgramByAlertId[idea.source_alert_id] ?? null
                : null
            }
          />
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
  // A claim is "flagged" only if source comparison failed AND web verification
  // didn't rescue it. Web-verified-correct claims are resolved.
  const flagged = Array.isArray(idea.fact_check_claims)
    ? (
        idea.fact_check_claims as {
          supported?: boolean
          acknowledged?: boolean
          web_verdict?: string | null
        }[]
      ).some(
        (c) =>
          c &&
          c.supported === false &&
          !c.acknowledged &&
          c.web_verdict !== 'likely_correct'
      )
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

function formatIdeaAge(iso: string): string {
  const d = new Date(iso)
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  const rel = days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days}d ago`
  return `${dateStr} · ${rel}`
}

function IdeaCard({
  idea,
  programs,
  suggestedProgramSlug,
}: {
  idea: ContentIdeaRow
  programs: Program[]
  suggestedProgramSlug: string | null
}) {
  const statusDef = STATUS_TONE[idea.status]
  const actions = NEXT_STATUS[idea.status] ?? []
  const rank = rankLabel(idea)
  const score = idea.source_alert?.computed_score
  const pills = verificationPills(idea)
  return (
    <div className="admin-card" style={{ padding: '1rem 1.125rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
        <h3 style={{ fontSize: '1rem', margin: 0, flex: 1, color: 'var(--admin-text)' }}>{idea.title}</h3>
        <Badge tone={statusDef.tone}>{statusDef.label}</Badge>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          color: 'var(--admin-text-muted)',
          marginBottom: '0.5rem',
        }}
        title={`Created ${new Date(idea.created_at).toLocaleString()}`}
      >
        {formatIdeaAge(idea.created_at)}
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

      <SourcesUsed idea={idea} />

      <FailureNotes idea={idea} />

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

      {idea.type === 'blog' && (
        <BlogMetadataForm
          idea={idea}
          programs={programs}
          suggestedProgramSlug={suggestedProgramSlug}
        />
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

      <WorkflowSteps idea={idea} actions={actions} />
    </div>
  )
}

interface FlaggedClaim {
  text?: string
  claim?: string
  supported?: boolean
  severity?: string
  acknowledged?: boolean
  reason?: string
  notes?: string
  // Web-verification fields populated by webVerifyClaims after the first
  // grounding pass. likely_correct / likely_wrong / unverifiable.
  web_verdict?: 'likely_correct' | 'likely_wrong' | 'unverifiable' | null
  web_evidence?: string | null
  web_url?: string | null
}

type IssueSeverity = 'ok' | 'warn' | 'fail'

interface FailureIssue {
  label: string
  severity: IssueSeverity
  claim?: string
  body: string
  webVerdict?: 'likely_correct' | 'likely_wrong' | 'unverifiable' | null
  webUrl?: string | null
}

/**
 * Surfaces the actual error text from voice / originality / fact-check
 * failures inline below the verification pills, so the editor can see
 * what went wrong without hovering tooltips.
 */
function FailureNotes({ idea }: { idea: ContentIdeaRow }) {
  const issues: FailureIssue[] = []

  // Fact-check: list each unsupported claim with its web verdict if present.
  // If web verdict says likely_correct → show as 'ok' (green) so the editor
  // can see at a glance which claims are externally verified.
  if (Array.isArray(idea.fact_check_claims)) {
    const claims = idea.fact_check_claims as FlaggedClaim[]
    const flagged = claims.filter(
      (c) => c && c.supported === false && !c.acknowledged
    )
    for (const c of flagged) {
      const claimText = c.text ?? c.claim ?? '(no claim text)'
      const sev = c.severity ?? 'medium'
      const verdict = c.web_verdict ?? null
      const evidence = c.web_evidence?.trim() || null
      let body: string
      let issueSev: IssueSeverity
      if (verdict === 'likely_correct') {
        body = evidence ? `Web check supports: ${evidence}` : 'Web check supports this claim.'
        issueSev = 'ok'
      } else if (verdict === 'likely_wrong') {
        body = evidence
          ? `Web check contradicts: ${evidence}`
          : 'Web check found contradicting evidence.'
        issueSev = 'fail'
      } else if (verdict === 'unverifiable') {
        body = evidence
          ? `Web check inconclusive: ${evidence}`
          : 'Web check could not find authoritative evidence.'
        issueSev = sev === 'high' ? 'fail' : 'warn'
      } else {
        body = c.reason ?? c.notes ?? 'No source text and web verification did not run.'
        issueSev = sev === 'high' ? 'fail' : 'warn'
      }
      issues.push({
        label: `Fact-check (${sev})`,
        severity: issueSev,
        claim: claimText,
        body,
        webVerdict: verdict,
        webUrl: c.web_url ?? null,
      })
    }
  }

  // Voice: if checked but failed, show the voice notes
  if (idea.voice_checked_at && idea.voice_pass === false) {
    issues.push({
      label: 'Voice check',
      severity: 'fail',
      body: idea.voice_notes ?? 'Voice check failed (no notes recorded).',
    })
  }

  // Originality: if checked but failed, show the originality notes
  if (idea.originality_checked_at && idea.originality_pass === false) {
    issues.push({
      label: 'Originality',
      severity: 'fail',
      body: idea.originality_notes ?? 'Originality check failed (no notes recorded).',
    })
  }

  if (issues.length === 0) return null

  return (
    <div
      style={{
        marginBottom: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
      }}
    >
      {issues.map((iss, idx) => {
        const palette =
          iss.severity === 'fail'
            ? { border: '#fca5a5', bg: '#fef2f2', label: '#b91c1c' }
            : iss.severity === 'ok'
              ? { border: '#86efac', bg: '#f0fdf4', label: '#15803d' }
              : { border: '#fcd34d', bg: '#fffbeb', label: '#92400e' }
        return (
          <div
            key={idx}
            style={{
              padding: '0.5rem 0.625rem',
              borderRadius: 'var(--admin-radius)',
              border: `1px solid ${palette.border}`,
              background: palette.bg,
              fontSize: '0.8125rem',
              lineHeight: 1.45,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 700,
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: palette.label,
                  marginRight: '0.5rem',
                }}
              >
                {iss.label}
              </span>
              {iss.webVerdict && <WebVerdictBadge verdict={iss.webVerdict} />}
            </div>
            {iss.claim && (
              <div style={{ color: 'var(--admin-text)', fontStyle: 'italic' }}>
                “{iss.claim}”
              </div>
            )}
            <div style={{ color: 'var(--admin-text)' }}>{iss.body}</div>
            {iss.webUrl && (
              <a
                href={iss.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.6875rem',
                  color: 'var(--admin-accent)',
                  fontWeight: 600,
                }}
              >
                ↗ View web source
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

function WebVerdictBadge({
  verdict,
}: {
  verdict: 'likely_correct' | 'likely_wrong' | 'unverifiable'
}) {
  const palette =
    verdict === 'likely_correct'
      ? { bg: '#dcfce7', fg: '#15803d', label: '✓ Web: likely correct' }
      : verdict === 'likely_wrong'
        ? { bg: '#fee2e2', fg: '#b91c1c', label: '✗ Web: likely wrong' }
        : { bg: '#f3f4f6', fg: '#4b5563', label: '? Web: inconclusive' }
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        fontFamily: 'var(--font-ui)',
        fontWeight: 700,
        fontSize: '0.625rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        padding: '0.125rem 0.5rem',
        borderRadius: '999px',
      }}
    >
      {palette.label}
    </span>
  )
}

/**
 * Renders the per-idea workflow as a numbered, ordered checklist:
 *   1. Draft   →  2. Fact check  →  3. Rewrite (if flags)  →  4. Voice  →  5. Originality  →  6. Publish
 *
 * Each step shows its done/pending state, the relevant action button, and
 * highlights the "next step" the editor should click. The "⚡ Run all checks"
 * shortcut at the bottom remains for first-pass mass-runs.
 */
function WorkflowSteps({
  idea,
  actions,
}: {
  idea: ContentIdeaRow
  actions: { label: string; to: IdeaStatus; variant?: 'primary' | 'secondary' }[]
}) {
  const hasBody = Boolean(idea.article_body)
  const factChecked = Boolean(idea.fact_checked_at)
  const voiceChecked = Boolean(idea.voice_checked_at)
  const voicePass = idea.voice_pass === true
  const originalityChecked = Boolean(idea.originality_checked_at)
  const originalityPass = idea.originality_pass === true

  const claims = Array.isArray(idea.fact_check_claims)
    ? (idea.fact_check_claims as FlaggedClaim[])
    : []
  const flaggedCount = claims.filter(
    (c) => c.supported === false && !c.acknowledged
  ).length
  const verifiedCount = claims.filter(
    (c) => c.supported === true || c.web_verdict === 'likely_correct'
  ).length

  // Determine which step is "next" (highlight it). Steps are required-in-order.
  let nextStep = 1
  if (hasBody) nextStep = 2
  if (factChecked) nextStep = flaggedCount > 0 ? 3 : 4
  if (factChecked && flaggedCount === 0 && voiceChecked && voicePass) nextStep = 5
  if (
    factChecked &&
    flaggedCount === 0 &&
    voiceChecked &&
    voicePass &&
    originalityChecked &&
    originalityPass
  )
    nextStep = 6

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
        marginTop: '0.5rem',
        paddingTop: '0.625rem',
        borderTop: '1px solid var(--admin-border)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--admin-text-muted)',
          marginBottom: '0.125rem',
        }}
      >
        Workflow
      </div>

      <Step
        n={1}
        label="Draft article"
        done={hasBody}
        active={nextStep === 1}
      >
        <WriteArticleButton ideaId={idea.id} hasBody={hasBody} />
      </Step>

      <Step
        n={2}
        label={
          factChecked
            ? `Fact check  (${verifiedCount} verified · ${flaggedCount} flagged)`
            : 'Fact check'
        }
        done={factChecked}
        active={nextStep === 2}
      >
        <FactCheckButton ideaId={idea.id} hasBody={hasBody} />
      </Step>

      <Step
        n={3}
        label={
          flaggedCount === 0 && factChecked
            ? 'Rewrite from verified facts (skip — no flags)'
            : 'Rewrite from verified facts'
        }
        done={false /* never auto-marked done; this is an intermediate step */}
        active={nextStep === 3}
        muted={factChecked && flaggedCount === 0}
      >
        <RewriteFromVerifiedFactsButton
          ideaId={idea.id}
          factChecked={factChecked}
          verifiedCount={verifiedCount}
          flaggedCount={flaggedCount}
        />
      </Step>

      <Step
        n={4}
        label="Voice check"
        done={voiceChecked && voicePass}
        active={nextStep === 4}
      >
        <BrandCheckButton ideaId={idea.id} hasBody={hasBody} />
      </Step>

      <Step
        n={5}
        label="Originality check"
        done={originalityChecked && originalityPass}
        active={nextStep === 5}
      >
        <CheckOriginalityButton ideaId={idea.id} hasBody={hasBody} />
      </Step>

      <Step n={6} label="Publish" done={idea.status === 'published'} active={nextStep === 6}>
        <span style={{ display: 'inline-flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {actions.map((a) => (
            <form key={a.to} action={updateContentIdeaStatusAction.bind(null, idea.id, a.to)}>
              <button
                type="submit"
                className={`admin-btn admin-btn-sm ${
                  a.variant === 'primary' ? 'admin-btn-primary' : 'admin-btn-secondary'
                }`}
              >
                {a.label}
              </button>
            </form>
          ))}
        </span>
      </Step>

      {/* First-pass shortcut */}
      <div
        style={{
          marginTop: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px dashed var(--admin-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            color: 'var(--admin-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}
        >
          Shortcut
        </span>
        <RunAllChecksButton ideaId={idea.id} />
        <span style={{ fontSize: '0.6875rem', color: 'var(--admin-text-muted)', fontFamily: 'var(--font-ui)' }}>
          (runs draft → fact → voice → originality in one go)
        </span>
      </div>
    </div>
  )
}

function Step({
  n,
  label,
  done,
  active,
  muted,
  children,
}: {
  n: number
  label: string
  done: boolean
  active: boolean
  muted?: boolean
  children: React.ReactNode
}) {
  const numColor = done
    ? '#15803d'
    : active
      ? 'var(--admin-accent)'
      : muted
        ? 'var(--admin-text-muted)'
        : 'var(--admin-text-muted)'
  const numBg = done
    ? '#dcfce7'
    : active
      ? 'var(--admin-accent-soft)'
      : 'var(--admin-surface-alt)'
  const labelOpacity = muted ? 0.5 : 1

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.375rem 0',
        opacity: labelOpacity,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '1.5rem',
          height: '1.5rem',
          borderRadius: '999px',
          background: numBg,
          color: numColor,
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {done ? '✓' : n}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          fontWeight: active ? 600 : 500,
          color: active ? 'var(--admin-text)' : 'var(--admin-text-muted)',
          minWidth: '11rem',
        }}
      >
        {label}
      </span>
      <span style={{ display: 'inline-flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {children}
      </span>
    </div>
  )
}

interface SourceClaim {
  supported?: boolean
  source_excerpt?: string | null
  web_verdict?: string | null
  web_url?: string | null
}

/**
 * Surfaces which sources backed the article's claims after fact-check ran.
 * Always shows "Your program pages" first, with the count of claims grounded
 * directly against your programs table data (those have a source_excerpt).
 * Then the top 3 external domains that web verification cited.
 *
 * If no fact-check has run, render nothing.
 * If your-pages count is 0, that's a SIGNAL — the article's source path
 * is broken (no primary_program_slug, or tagged program is empty).
 */
function SourcesUsed({ idea }: { idea: ContentIdeaRow }) {
  if (!idea.fact_checked_at) return null
  if (!Array.isArray(idea.fact_check_claims)) return null
  const claims = idea.fact_check_claims as SourceClaim[]
  if (claims.length === 0) return null

  // "Your program pages" = claims grounded by source comparison (source_excerpt
  // populated). These came from the programs table, which is the same data
  // rendered on /programs/[slug].
  const yourPagesCount = claims.filter(
    (c) => c.supported === true && !!c.source_excerpt
  ).length

  // External domains cited by web verification, plus a representative URL
  // per host (the first claim's URL for that host) so the pill can link to
  // the actual page that backed the claim.
  type HostInfo = { count: number; firstUrl: string }
  const hostInfo = new Map<string, HostInfo>()
  for (const c of claims) {
    if (!c.web_url) continue
    try {
      const host = new URL(c.web_url).host.replace(/^www\./, '')
      const existing = hostInfo.get(host)
      if (existing) {
        existing.count += 1
      } else {
        hostInfo.set(host, { count: 1, firstUrl: c.web_url })
      }
    } catch {
      /* skip invalid URLs */
    }
  }
  const topExternal = Array.from(hostInfo.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)

  // If neither your pages nor external sources contributed, skip.
  if (yourPagesCount === 0 && topExternal.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.375rem',
        marginBottom: '0.625rem',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.75rem',
      }}
    >
      <span
        style={{
          fontWeight: 700,
          fontSize: '0.6875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--admin-text-muted)',
          marginRight: '0.25rem',
        }}
      >
        Sources used
      </span>

      <SourcePill
        label={
          (idea.card_slugs ?? []).length > 0 && idea.primary_program_slug
            ? '★ Your pages'
            : (idea.card_slugs ?? []).length > 0
              ? '★ Your card pages'
              : '★ Your program pages'
        }
        count={yourPagesCount}
        warn={yourPagesCount === 0}
        href={
          // Prefer the program page if both exist; fall back to the first
          // tagged card page. This is where the editor can eyeball the
          // source data themselves.
          idea.primary_program_slug
            ? `/programs/${idea.primary_program_slug}`
            : (idea.card_slugs ?? []).length > 0
              ? `/cards/${idea.card_slugs![0]}`
              : undefined
        }
        title={
          yourPagesCount === 0
            ? "No claims grounded against your pages. Click to open the source page anyway."
            : `${yourPagesCount} claim${yourPagesCount === 1 ? '' : 's'} grounded against your data — click to open the source page.`
        }
      />

      {topExternal.map(([host, info]) => (
        <SourcePill
          key={host}
          label={host}
          count={info.count}
          href={info.firstUrl}
          external
          title={`Click to open the source web verification cited (${info.count} claim${info.count === 1 ? '' : 's'} from this domain).`}
        />
      ))}

      {yourPagesCount === 0 && (
        <span
          style={{
            fontSize: '0.6875rem',
            color: '#b45309',
            fontStyle: 'italic',
            marginLeft: '0.25rem',
          }}
          title="Your program pages weren't used to ground any claims. Check that primary_program_slug is set AND the program row has content populated."
        >
          ← worth checking
        </span>
      )}
    </div>
  )
}

function SourcePill({
  label,
  count,
  warn,
  href,
  external,
  title,
}: {
  label: string
  count: number
  warn?: boolean
  /** When set, the pill renders as an anchor and is clickable. */
  href?: string
  /** External link — opens in a new tab with rel=noopener. */
  external?: boolean
  /** Tooltip on hover. */
  title?: string
}) {
  // Color logic:
  //   - warn (yellow):    Your program pages with 0 claims — signal that something's
  //                       missing (no primary_program_slug, empty program row, etc.)
  //   - count > 0 (green): the source successfully verified at least one claim,
  //                       regardless of whether it's yours or external
  //   - count = 0 (gray):  shouldn't render at this point, but safe fallback
  const palette = warn
    ? { bg: '#fffbeb', border: '#fcd34d', fg: '#92400e' }
    : count > 0
      ? { bg: '#dcfce7', border: '#86efac', fg: '#15803d' }
      : { bg: 'var(--admin-surface-alt)', border: 'var(--admin-border)', fg: 'var(--admin-text)' }
  // "Your program pages" pill is bold to mark it as primary/preferred source.
  const isYours = label.startsWith('★')
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3125rem',
    padding: '0.1875rem 0.5rem',
    borderRadius: '999px',
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    color: palette.fg,
    fontWeight: isYours ? 700 : 500,
    textDecoration: 'none',
    cursor: href ? 'pointer' : 'default',
    transition: 'opacity 0.12s ease',
  }
  const inner = (
    <>
      <span>{label}</span>
      <span
        style={{
          fontWeight: 700,
          background: 'rgba(0,0,0,0.06)',
          padding: '0 0.375rem',
          borderRadius: '999px',
          fontSize: '0.6875rem',
        }}
      >
        {count}
      </span>
      {href && external && (
        <span aria-hidden style={{ fontSize: '0.625rem', opacity: 0.7 }}>↗</span>
      )}
    </>
  )
  if (href) {
    return (
      <a
        href={href}
        title={title}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        style={baseStyle}
        onMouseEnter={undefined}
      >
        {inner}
      </a>
    )
  }
  return (
    <span style={baseStyle} title={title}>
      {inner}
    </span>
  )
}
