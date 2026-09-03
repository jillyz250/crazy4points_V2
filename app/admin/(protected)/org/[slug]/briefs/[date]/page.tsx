import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { Icon, type IconName } from '@/components/admin/preview/kit'

export const dynamic = 'force-dynamic'

const GOLD = 'var(--color-accent)'
const DISPLAY = 'var(--font-display)'

type Emp = { slug: string; name: string; role_title: string | null; emoji: string | null }
type Brief = { employee_slug: string; brief_date: string; body: string | null; data: unknown }

// Date-only 'YYYY-MM-DD' → readable, parsed as LOCAL so it never slips a day.
function fmtDateStr(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y) return ymd
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

// ── tiny value helpers (the brief `data` is free-form jsonb) ──────────────────
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string'

// Section keys that are shown in the header already (or are pure plumbing).
const SKIP_KEYS = new Set(['as_of', 'employee'])
// Rendered last, with their own dedicated presentation.
const SPECIAL_ORDER = ['field_this_week', 'ideas', 'team'] as const
const SPECIAL_KEYS = new Set<string>(SPECIAL_ORDER)

// snake_case / camelCase key → readable "Sentence case" label.
function humanLabel(key: string): string {
  const s = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Best single-line display string for an item (object or scalar).
const TITLE_KEYS = ['headline', 'title', 'topic', 'summary', 'name', 'idea', 'card_name', 'label', 'signal_type']
function titleOf(item: unknown): string {
  if (isStr(item)) return item
  if (isNum(item)) return String(item)
  if (isObj(item)) {
    for (const k of TITLE_KEYS) { const v = item[k]; if (isStr(v) && v.trim()) return v }
    for (const v of Object.values(item)) if (isStr(v) && v.trim()) return v
    return JSON.stringify(item)
  }
  return String(item)
}

const trim = (s: string, n = 160) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s)

// ── generic block renderers ──────────────────────────────────────────────────
function ListBlock({ items, empty = 'None' }: { items: unknown[]; empty?: string }) {
  if (items.length === 0) return <p className="bd-empty">{empty}</p>
  const shown = items.slice(0, 8)
  return (
    <ul className="bd-list">
      {shown.map((it, i) => <li key={i}>{trim(titleOf(it))}</li>)}
      {items.length > shown.length && <li className="bd-more">+{items.length - shown.length} more</li>}
    </ul>
  )
}

// A `{ count, standouts?|sample?, ...scalars }` queue block.
function CountBlock({ obj }: { obj: Record<string, unknown> }) {
  const count = isNum(obj.count) ? obj.count : 0
  const list = (Array.isArray(obj.standouts) ? obj.standouts : Array.isArray(obj.sample) ? obj.sample : []) as unknown[]
  const extras = Object.entries(obj).filter(([k, v]) => k !== 'count' && k !== 'standouts' && k !== 'sample' && (isStr(v) || isNum(v)) && v !== null && v !== '')
  return (
    <div>
      <div className="bd-statline"><span className="bd-stat">{count}</span></div>
      {extras.map(([k, v]) => <p key={k} className="bd-kv"><span className="bd-kv-k">{humanLabel(k)}</span> {String(v)}</p>)}
      {list.length > 0 && <ListBlock items={list} />}
    </div>
  )
}

// A generic object with no `count` (e.g. subscribers, social_calendar) — walk it.
function ObjectBlock({ obj }: { obj: Record<string, unknown> }) {
  const entries = Object.entries(obj)
  return (
    <div className="bd-subgrid">
      {entries.map(([k, v]) => {
        if (isNum(v)) return <div key={k} className="bd-kv-row"><span className="bd-kv-k">{humanLabel(k)}</span><span className="bd-kv-v">{v}</span></div>
        if (isStr(v)) return <p key={k} className="bd-kv"><span className="bd-kv-k">{humanLabel(k)}</span> {v}</p>
        if (Array.isArray(v)) return (
          <div key={k} className="bd-sub">
            <div className="bd-sub-label">{humanLabel(k)}</div>
            <ListBlock items={v} />
          </div>
        )
        if (isObj(v) && isNum(v.count)) return <div key={k} className="bd-kv-row"><span className="bd-kv-k">{humanLabel(k)}</span><span className="bd-kv-v">{v.count as number}</span></div>
        return null
      })}
    </div>
  )
}

function GenericValue({ value }: { value: unknown }) {
  if (isStr(value)) return <p className="bd-note">{value}</p>
  if (isNum(value)) return <div className="bd-statline"><span className="bd-stat">{value}</span></div>
  if (Array.isArray(value)) return <ListBlock items={value} />
  if (isObj(value)) return isNum(value.count) ? <CountBlock obj={value} /> : <ObjectBlock obj={value} />
  return null
}

function Section({ label, icon, children }: { label: string; icon: IconName; children: React.ReactNode }) {
  return (
    <section className="bd-card">
      <h2 className="bd-h2"><Icon name={icon} size={14} /> {label}</h2>
      {children}
    </section>
  )
}

// Field-news headlines (array of { headline, summary, relevance, source_name, source_url }).
function FieldNews({ items }: { items: unknown[] }) {
  const list = items.filter(isObj)
  if (list.length === 0) return <p className="bd-empty">Nothing on the beat this week.</p>
  return (
    <ul className="bd-news">
      {list.map((n, i) => {
        const url = isStr(n.source_url) ? n.source_url : null
        const headline = isStr(n.headline) ? n.headline : titleOf(n)
        return (
          <li key={i} className="bd-news-item">
            {isStr(n.relevance) && n.relevance === 'high' && <span className="bd-flag">High</span>}
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="bd-news-hl">{headline}</a>
            ) : (
              <span className="bd-news-hl">{headline}</span>
            )}
            {isStr(n.summary) && <p className="bd-news-sum">{n.summary}</p>}
            {isStr(n.source_name) && <span className="bd-news-src">{n.source_name}</span>}
          </li>
        )
      })}
    </ul>
  )
}

// Team roll-up — each direct report + their ideas.
function TeamRollup({ items }: { items: unknown[] }) {
  const list = items.filter(isObj)
  if (list.length === 0) return <p className="bd-empty">No direct reports.</p>
  return (
    <div className="bd-team">
      {list.map((m, i) => {
        const ideas = (Array.isArray(m.ideas) ? m.ideas : []) as unknown[]
        return (
          <div key={i} className="bd-team-row">
            <div className="bd-team-top">
              <span className="bd-team-name">{isStr(m.name) ? m.name : titleOf(m)}</span>
              {isStr(m.role) && <span className="bd-team-role">{m.role}</span>}
            </div>
            {ideas.length > 0 ? (
              <ul className="bd-list bd-team-ideas">{ideas.slice(0, 5).map((idea, j) => <li key={j}>{trim(titleOf(idea))}</li>)}</ul>
            ) : (
              <span className="bd-team-noideas">No new ideas</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── narrated body (markdown / plain) → a clean typographic read ──────────────
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  // Only **bold** is handled — everything else stays as plain text.
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((seg, i) =>
    seg.startsWith('**') && seg.endsWith('**')
      ? <strong key={`${keyBase}-${i}`}>{seg.slice(2, -2)}</strong>
      : <span key={`${keyBase}-${i}`}>{seg}</span>,
  )
}

function NarratedBody({ body }: { body: string }) {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let para: string[] = []
  let bullets: string[] = []
  const flushPara = () => {
    if (para.length) { blocks.push(<p key={`p${blocks.length}`} className="bd-body-p">{renderInline(para.join(' '), `p${blocks.length}`)}</p>); para = [] }
  }
  const flushBullets = () => {
    if (bullets.length) {
      blocks.push(<ul key={`u${blocks.length}`} className="bd-body-ul">{bullets.map((b, i) => <li key={i}>{renderInline(b, `u${blocks.length}-${i}`)}</li>)}</ul>)
      bullets = []
    }
  }
  for (const raw of lines) {
    const line = raw.trim()
    if (line === '') { flushBullets(); flushPara(); continue }
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) { flushBullets(); flushPara(); blocks.push(<h3 key={`h${blocks.length}`} className="bd-body-h">{renderInline(h[2], `h${blocks.length}`)}</h3>); continue }
    const b = line.match(/^[-*]\s+(.*)$/)
    if (b) { flushPara(); bullets.push(b[1]); continue }
    flushBullets(); para.push(line)
  }
  flushBullets(); flushPara()
  return <div className="bd-body">{blocks}</div>
}

// Icon per known section (falls back to a neutral one).
const SECTION_ICON: Record<string, IconName> = {
  posture_note: 'shield', analytics_note: 'trending', subscribers: 'users',
  social_calendar: 'calendar', unresolved_errors: 'alert', refresh_queue: 'activity',
  intel_to_triage: 'inbox', change_signals: 'activity', card_bonus_signals: 'creditCard',
  program_drift_unresolved: 'activity', drafts_awaiting_review: 'pencil', faqs_possibly_stale: 'book',
  card_prose_review_due: 'creditCard', experiences_to_review: 'star', sweepstakes_to_review: 'award',
  closings_within_5d: 'clock', open_social_reminders: 'bell',
}
const sectionIcon = (key: string): IconName => SECTION_ICON[key] ?? 'note'

export default async function BriefDetailPage({ params }: { params: Promise<{ slug: string; date: string }> }) {
  const { slug, date } = await params
  const db = createAdminClient()

  const [{ data: empData }, { data: briefData }] = await Promise.all([
    db.from('employees').select('slug, name, role_title, emoji').eq('slug', slug).maybeSingle(),
    db.from('employee_briefs').select('employee_slug, brief_date, body, data').eq('employee_slug', slug).eq('brief_date', date).maybeSingle(),
  ])
  const e = empData as Emp | null
  const brief = briefData as Brief | null
  if (!e || !brief) notFound()

  const first = e.name.split(' ')[0]
  const data = isObj(brief.data) ? brief.data : {}

  // Split the free-form data into: string notes (the lead), generic sections,
  // and the three specials (field news / ideas / team) rendered last.
  const entries = Object.entries(data).filter(([k]) => !SKIP_KEYS.has(k) && !SPECIAL_KEYS.has(k))
  const notes = entries.filter(([, v]) => isStr(v))
  const generics = entries.filter(([, v]) => !isStr(v))
  const fieldNews = Array.isArray(data.field_this_week) ? (data.field_this_week as unknown[]) : null
  const ideas = Array.isArray(data.ideas) ? (data.ideas as unknown[]) : null
  const team = Array.isArray(data.team) ? (data.team as unknown[]) : null

  return (
    <div className="bd-root">
      <style dangerouslySetInnerHTML={{ __html: BD_CSS }} />
      <div className="bd-wrap">
        <Link href={`/admin/org/${slug}`} className="bd-back">
          <Icon name="arrowLeft" size={15} /> {first}
        </Link>

        {/* ── Header: whose brief, and for what day ── */}
        <header className="bd-hero">
          <span className="bd-kicker"><Icon name="fileText" size={13} /> Daily brief</span>
          <h1 className="bd-title">{e.name}</h1>
          {e.role_title && <div className="bd-role">{e.role_title}</div>}
          <div className="bd-date">{fmtDateStr(brief.brief_date)}</div>
        </header>

        {brief.body ? (
          <NarratedBody body={brief.body} />
        ) : (
          <>
            {/* Lead: any narrative note (posture / analytics) */}
            {notes.map(([k, v]) => (
              <Section key={k} label={humanLabel(k)} icon={sectionIcon(k)}>
                <p className="bd-note">{v as string}</p>
              </Section>
            ))}

            {/* Queues, counts, and structured sections */}
            {generics.map(([k, v]) => (
              <Section key={k} label={humanLabel(k)} icon={sectionIcon(k)}>
                <GenericValue value={v} />
              </Section>
            ))}

            {/* Field news */}
            {fieldNews && (
              <Section label="Field this week" icon="globe">
                <FieldNews items={fieldNews} />
              </Section>
            )}

            {/* This head's own ideas */}
            {ideas && (
              <Section label="Ideas" icon="lightbulb">
                <ListBlock items={ideas} empty="No ideas logged." />
              </Section>
            )}

            {/* Team roll-up */}
            {team && (
              <Section label={`${first}'s team`} icon="users">
                <TeamRollup items={team} />
              </Section>
            )}

            {notes.length === 0 && generics.length === 0 && !fieldNews && !ideas && !team && (
              <div className="bd-card"><p className="bd-empty">This brief has no content yet.</p></div>
            )}
          </>
        )}

        <Link href={`/admin/org/${slug}`} className="bd-done">
          <Icon name="arrowLeft" size={14} /> Back to {first}
        </Link>
      </div>
    </div>
  )
}

const BD_CSS = `
.admin .bd-wrap { max-width:720px; margin:0 auto; padding:0 4px; }
.admin .bd-back { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-muted); text-decoration:none; margin-bottom:1.4rem; transition:gap .14s ease, color .14s ease; }
.admin .bd-back:hover { gap:9px; color:var(--color-primary); text-decoration:none; }

/* Header */
.admin .bd-hero {
  padding:1.5rem 1.6rem; margin-bottom:1.4rem; border-radius:20px; position:relative; overflow:hidden;
  border:1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border));
  background:radial-gradient(90% 130% at 100% 0%, color-mix(in srgb, var(--color-primary) 7%, #fff), #fff 68%);
  box-shadow:0 1px 2px rgba(107,45,143,.04), 0 22px 50px -34px rgba(107,45,143,.26);
}
.admin .bd-hero::before { content:''; position:absolute; top:0; left:1.6rem; right:1.6rem; height:2px; border-radius:2px; background:linear-gradient(90deg, transparent, ${GOLD}, transparent); opacity:.85; }
.admin .bd-kicker { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.09em; color:var(--admin-text-subtle); }
.admin .bd-kicker svg { color:var(--color-accent); }
.admin .bd-title { font-family:${DISPLAY}; font-size:2rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); margin:.3rem 0 0; line-height:1.05; }
.admin .bd-role { font-size:1rem; color:var(--admin-text-secondary); margin-top:.15rem; font-weight:500; }
.admin .bd-date { margin-top:.6rem; font-size:var(--admin-text-sm); font-weight:700; color:var(--admin-text-muted); }

/* Section card */
.admin .bd-card { padding:1.15rem 1.35rem; margin-bottom:1.1rem; border-radius:16px; border:1px solid var(--admin-border); background:var(--admin-surface); box-shadow:0 1px 2px rgba(107,45,143,.03); }
.admin .bd-h2 { display:flex; align-items:center; gap:8px; font-family:${DISPLAY}; font-size:1.05rem; font-weight:700; color:var(--color-primary); margin:0 0 .7rem; }
.admin .bd-h2 svg { color:var(--admin-text-subtle); }

/* Narrative note / paragraph */
.admin .bd-note { margin:0; font-size:var(--admin-text-sm); line-height:1.65; color:var(--admin-text-secondary); }

/* Big count */
.admin .bd-statline { display:flex; align-items:baseline; gap:8px; }
.admin .bd-stat { font-family:${DISPLAY}; font-size:2rem; font-weight:800; line-height:1; color:var(--color-primary); font-variant-numeric:tabular-nums; }

/* key/value note lines */
.admin .bd-kv { margin:.5rem 0 0; font-size:var(--admin-text-sm); line-height:1.55; color:var(--admin-text-secondary); }
.admin .bd-kv-k { font-weight:700; color:var(--admin-text); }
.admin .bd-kv-row { display:flex; align-items:baseline; justify-content:space-between; gap:12px; padding:.5rem 0; border-bottom:1px solid var(--admin-border); }
.admin .bd-kv-row:last-child { border-bottom:none; }
.admin .bd-kv-v { font-weight:800; color:var(--color-primary); font-variant-numeric:tabular-nums; flex-shrink:0; }
.admin .bd-subgrid { display:flex; flex-direction:column; }
.admin .bd-sub { padding:.6rem 0; border-bottom:1px solid var(--admin-border); }
.admin .bd-sub:last-child { border-bottom:none; }
.admin .bd-sub-label { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.07em; font-weight:700; color:var(--admin-text-muted); margin-bottom:.4rem; }

/* Plain list */
.admin .bd-list { margin:.6rem 0 0; padding-left:1.05rem; display:flex; flex-direction:column; gap:.4rem; }
.admin .bd-list li { font-size:var(--admin-text-sm); line-height:1.5; color:var(--admin-text-secondary); }
.admin .bd-list li::marker { color:${GOLD}; }
.admin .bd-more { list-style:none; margin-left:-1.05rem; font-size:var(--admin-text-xs); font-weight:600; color:var(--admin-text-subtle); }

.admin .bd-empty { margin:0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); }

/* Field news */
.admin .bd-news { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.9rem; }
.admin .bd-news-item { padding-left:.9rem; border-left:2px solid color-mix(in srgb, var(--color-primary) 20%, var(--admin-border)); }
.admin .bd-flag { display:inline-block; font-size:.62rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:var(--admin-warning); background:var(--admin-warning-soft); padding:1px 7px; border-radius:9999px; margin-bottom:4px; }
.admin .bd-news-hl { display:block; font-size:.95rem; font-weight:700; color:var(--admin-text); line-height:1.4; text-decoration:none; }
.admin a.bd-news-hl:hover { color:var(--color-primary); text-decoration:none; }
.admin .bd-news-sum { margin:.3rem 0 .25rem; font-size:var(--admin-text-sm); line-height:1.55; color:var(--admin-text-muted); }
.admin .bd-news-src { font-size:var(--admin-text-xs); font-weight:600; color:var(--admin-text-subtle); }

/* Team roll-up */
.admin .bd-team { display:flex; flex-direction:column; gap:.9rem; }
.admin .bd-team-row { padding:.85rem 1rem; border-radius:12px; background:var(--admin-surface-alt); border:1px solid var(--admin-border); }
.admin .bd-team-top { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
.admin .bd-team-name { font-size:.95rem; font-weight:800; color:var(--admin-text); }
.admin .bd-team-role { font-size:var(--admin-text-xs); color:var(--admin-text-muted); }
.admin .bd-team-ideas { margin-top:.5rem; }
.admin .bd-team-noideas { display:inline-block; margin-top:.4rem; font-size:var(--admin-text-xs); color:var(--admin-text-subtle); font-style:italic; }

/* Narrated body */
.admin .bd-body { padding:1.3rem 1.5rem; border-radius:16px; border:1px solid var(--admin-border); background:var(--admin-surface); box-shadow:0 1px 2px rgba(107,45,143,.03); }
.admin .bd-body-h { font-family:${DISPLAY}; font-size:1.15rem; font-weight:700; color:var(--color-primary); margin:1.3rem 0 .5rem; }
.admin .bd-body-h:first-child { margin-top:0; }
.admin .bd-body-p { margin:0 0 .9rem; font-size:1rem; line-height:1.7; color:var(--admin-text-secondary); }
.admin .bd-body-p:last-child { margin-bottom:0; }
.admin .bd-body-ul { margin:0 0 .9rem; padding-left:1.2rem; display:flex; flex-direction:column; gap:.45rem; }
.admin .bd-body-ul li { font-size:1rem; line-height:1.6; color:var(--admin-text-secondary); }
.admin .bd-body-ul li::marker { color:${GOLD}; }

.admin .bd-done { display:inline-flex; align-items:center; gap:7px; margin-top:.5rem; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-muted); text-decoration:none; transition:gap .14s ease, color .14s ease; }
.admin .bd-done:hover { gap:10px; color:var(--color-primary); text-decoration:none; }

@media (max-width:560px) {
  .admin .bd-title { font-size:1.7rem; }
  .admin .bd-hero, .admin .bd-body { padding-left:1.15rem; padding-right:1.15rem; }
}
`
