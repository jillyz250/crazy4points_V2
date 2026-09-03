import Link from 'next/link'
import Image from 'next/image'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { computeMeters } from '@/lib/orgMeters'
import { Icon, Ring, meterCells, type IconName } from '@/components/admin/preview/kit'
import { ADMIN_PAGES, type TaskCategory, type AdminPage } from '@/lib/admin/registry'
import type { DecisionRow, DecisionStatus } from '@/lib/admin/logDecision'
import AssignedTasks from '@/components/admin/dashboard/AssignedTasks'
import QuickNote from '@/components/admin/dashboard/QuickNote'
import IdeasBox from '@/components/admin/dashboard/IdeasBox'
import { sortOpenTasks, type EmployeeTask, type TaskPriority, type TaskStatus } from './tasks'
import { IDEA_SELECT, type EmployeeIdea } from './ideas'
import fieldFeedsJson from '@/lib/field-feeds.json'

export const dynamic = 'force-dynamic'

const GOLD = 'var(--color-accent)'
const DISPLAY = 'var(--font-display)'

type Platform = { platform: string; status: string; notes?: string }
type Emp = {
  id: string
  slug: string
  name: string
  role_title: string | null
  kind: 'owner' | 'chief' | 'agent'
  emoji: string | null
  image_url: string | null
  status: string
  persona: string | null
  mission: string | null
  rules: string[] | null
  responsibilities: string[] | null
  skills: string[] | null
  allowed_scopes: string[] | null
  platforms: Platform[] | null
  reports_to_id: string | null
  last_regenerated_at: string | null
  quick_note: string | null
}
type Log = { id: string; type: string; note: string; actor: string | null; created_at: string }
// Hero "Top task" card — one shape for both sources (employee_tasks / jill_tasks).
type HeroTask = { title: string; href: string; priority: TaskPriority | null; status: TaskStatus | null; due_at: string | null }
// lib/field-feeds.json — trade sources each head reads to stay current.
// Each source is a little front page: name = masthead, tagline = subhead.
type FieldSource = { name: string; tagline?: string; url: string }
type FieldFeed = { beat: string; sources: FieldSource[] }
const FIELD_FEEDS = fieldFeedsJson as Record<string, FieldFeed>

// Stable pseudo "Vol. / Issue / Page" numbers per publication name — derived,
// never randomized, so a masthead reads the same on every render.
function pubNumbers(name: string): { vol: number; issue: number; p1: number; p2: number } {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (Math.imul(h, 31) + name.charCodeAt(i)) >>> 0
  return { vol: (h % 40) + 1, issue: (h % 900) + 100, p1: (h % 8) + 2, p2: ((h >>> 3) % 8) + 2 }
}

const arr = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : [])

// Program-catalog filter views (/admin/programs?type=…) are the SAME page behind
// a filter — collapse the four into ONE "Program pages" entry so a head's tools
// read as one tool, not four near-duplicates. Every filtered view stays reachable.
const PROGRAM_FILTER_IDS = ['programs', 'programs-currencies', 'programs-hotels', 'programs-otas']
const PROGRAM_VIEW_LABEL: Record<string, string> = {
  programs: 'All', 'programs-currencies': 'Currencies', 'programs-hotels': 'Hotels', 'programs-otas': 'OTAs',
}
type OwnedItem =
  | { kind: 'page'; page: AdminPage }
  | { kind: 'programs'; base: AdminPage; views: AdminPage[] }
const itemCat = (it: OwnedItem): TaskCategory => (it.kind === 'programs' ? it.base.taskCategory : it.page.taskCategory)

// Active, owned pages → items grouped by task category, with the program-filter
// views folded into one entry. Used by BOTH the hero quick-list and the workspace.
function buildOwned(slug: string): { count: number; groups: { cat: TaskCategory; items: OwnedItem[] }[] } {
  const pages = ADMIN_PAGES.filter((p) => p.owner === slug && p.status === 'active' && !p.mergedInto)
  const items: OwnedItem[] = []
  let programsDone = false
  for (const p of pages) {
    if (PROGRAM_FILTER_IDS.includes(p.id)) {
      if (programsDone) continue
      programsDone = true
      const views = PROGRAM_FILTER_IDS.map((id) => pages.find((x) => x.id === id)).filter((x): x is AdminPage => !!x)
      items.push({ kind: 'programs', base: views.find((v) => v.id === 'programs') ?? views[0], views })
    } else {
      items.push({ kind: 'page', page: p })
    }
  }
  const groups: { cat: TaskCategory; items: OwnedItem[] }[] = []
  for (const it of items) {
    const cat = itemCat(it)
    const g = groups.find((x) => x.cat === cat)
    if (g) g.items.push(it)
    else groups.push({ cat, items: [it] })
  }
  return { count: items.length, groups }
}

// Category → Lucide-style icon (workspace grouping).
const CAT_ICON: Record<TaskCategory, IconName> = {
  Ops: 'compass', Content: 'pencil', Social: 'megaphone', Growth: 'trending',
  Sources: 'globe', Accuracy: 'shield', Reference: 'database', Reliability: 'activity', Design: 'palette',
  Finance: 'briefcase',
}
// Per-page icon where a distinct one reads clearer; else the category icon.
const PAGE_ICON: Record<string, IconName> = {
  triage: 'inbox', drafts: 'pencil', newsletter: 'mail', briefs: 'fileText', topics: 'tag',
  'question-radar': 'activity', roadmap: 'compass', experiences: 'star', sweepstakes: 'award', takes: 'bell',
  creatives: 'image', 'social-calendar': 'calendar', subscribers: 'users', analytics: 'trending', 'short-links': 'link',
  sources: 'globe', scrapes: 'globe', 'change-signals': 'activity', 'card-bonus-signals': 'creditCard',
  accuracy: 'shield',
  agents: 'shield', 'fact-checks': 'check', 'verification-findings': 'check', 'data-integrity': 'shield', 'program-drift': 'activity',
  programs: 'award', 'programs-currencies': 'database', 'programs-hotels': 'database', 'programs-otas': 'database',
  issuers: 'briefcase', cards: 'creditCard', 'partner-redemptions': 'award', tokens: 'tag',
  extractions: 'database', 'card-extractions': 'creditCard', 'refresh-queue': 'activity', 'manual-overrides': 'pencil',
  glossary: 'book', dashboard: 'compass', org: 'users', 'ai-usage': 'gauge', decisions: 'flag',
  expenses: 'creditCard', breakroom: 'coffee',
}
const pageIcon = (p: AdminPage): IconName => PAGE_ICON[p.id] ?? CAT_ICON[p.taskCategory]

const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const statusColor = (s: string) =>
  s === 'active' ? 'var(--admin-success)' : s === 'paused' ? 'var(--admin-warning)' : s === 'retired' ? 'var(--admin-danger)' : 'var(--admin-text-subtle)'

type LogKind = { icon: IconName; label: string; fg: string; bg: string }
const LOG_KIND: Record<string, LogKind> = {
  improvement: { icon: 'star', label: 'Win', fg: 'var(--admin-success)', bg: 'var(--admin-success-soft)' },
  shortcoming: { icon: 'alert', label: 'Needs work', fg: 'var(--admin-warning)', bg: 'var(--admin-warning-soft)' },
  review: { icon: 'check', label: 'Review', fg: 'var(--admin-info)', bg: 'var(--admin-info-soft)' },
}
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// Top Task card presenters (hero) — priority chip class + human status label.
const TASK_PRI_CLASS: Record<string, string> = { P1: 'ep-tt-p1', P2: 'ep-tt-p2', P3: 'ep-tt-p3' }
const TASK_STATUS_LABEL: Record<string, string> = { todo: 'To do', in_progress: 'In progress', blocked: 'Blocked', done: 'Done' }

// Decision Log presenters (per-head "Recent decisions" section).
const DECISION_STATUS: Record<DecisionStatus, { label: string; fg: string; bg: string }> = {
  pending: { label: 'Pending', fg: 'var(--admin-warning)', bg: 'var(--admin-warning-soft)' },
  approved: { label: 'Approved', fg: 'var(--admin-success)', bg: 'var(--admin-success-soft)' },
  rejected: { label: 'Rejected', fg: 'var(--admin-danger)', bg: 'var(--admin-danger-soft)' },
  executed: { label: 'Executed', fg: 'var(--admin-info)', bg: 'var(--admin-info-soft)' },
  undone: { label: 'Undone', fg: 'var(--admin-text-muted)', bg: 'var(--admin-surface-alt)' },
}
const decisionActionLabel = (a: string) =>
  ({ dismiss: 'Dismiss', skip: 'Skip', bulk_skip: 'Bulk skip', resolve: 'Resolve', snooze: 'Snooze', publish: 'Publish', edit: 'Edit', feature: 'Feature', send: 'Send', feedback: 'Feedback', other: 'Action' } as Record<string, string>)[a] ?? a.replace(/_/g, ' ')
function timeAgo(iso: string): string {
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function EmployeePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createAdminClient()
  const { data } = await db.from('employees').select('*').eq('slug', slug).maybeSingle()
  const e = data as Emp | null
  if (!e) notFound()

  const isOwner = e.kind === 'owner'
  const [{ data: logsData }, { data: mgr }, { data: teamData }, { data: decisionsData }, { data: tasksData }, { data: ideasData }, { data: jillTasksData }] = await Promise.all([
    db.from('employee_logs').select('id, type, note, actor, created_at').eq('employee_id', e.id).order('created_at', { ascending: false }).limit(12),
    e.reports_to_id
      ? db.from('employees').select('name, slug, role_title, emoji').eq('id', e.reports_to_id).maybeSingle()
      : Promise.resolve({ data: null }),
    db.from('employees').select('id, slug, name, role_title, emoji, status').eq('reports_to_id', e.id).order('name', { ascending: true }),
    db.from('decision_log').select('*').eq('employee_slug', slug).order('created_at', { ascending: false }).limit(8),
    db.from('employee_tasks').select('*').eq('employee_slug', slug).order('created_at', { ascending: false }).limit(100),
    db.from('employee_ideas').select(IDEA_SELECT).eq('employee_slug', slug).order('created_at', { ascending: false }).limit(100),
    // The OWNER (Jill) keeps her real to-dos in jill_tasks (her "My Tasks" on
    // /admin), not employee_tasks — so the Top-Task card reads that list for her.
    isOwner
      ? db.from('jill_tasks').select('id, title, link, created_at').eq('done', false).order('created_at', { ascending: false }).limit(100)
      : Promise.resolve({ data: null }),
  ])
  const logs = (logsData ?? []) as Log[]
  const decisions = (decisionsData ?? []) as DecisionRow[]
  const tasks = (tasksData ?? []) as EmployeeTask[]
  const ideas = (ideasData ?? []) as EmployeeIdea[]
  const newIdeaCount = ideas.filter((i) => i.status === 'new').length
  // Illustration slot: Jill's cute 3D "ideas box" render, if it's been dropped in
  // at public/team/ideas-box.png — else the header falls back to the lightbulb.
  const hasIdeaArt = existsSync(join(process.cwd(), 'public', 'team', 'ideas-box.png'))
  const openTasks = tasks.filter((t) => t.status !== 'done')
  const openTaskCount = openTasks.length
  // The one thing to look at first: highest-priority open task (P1→P2→P3→oldest).
  const topTask = sortOpenTasks(openTasks)[0] ?? null

  // Unified hero "Top task" view model. Heads/specialists read employee_tasks
  // (with priority/status/due). The owner reads jill_tasks — no priority/status,
  // links to /admin where My Tasks lives (or the task's own link).
  const jillTasks = (jillTasksData ?? []) as { id: string; title: string; link: string | null; created_at: string }[]
  const heroTask: HeroTask | null = isOwner
    ? (jillTasks[0]
        ? { title: jillTasks[0].title, href: jillTasks[0].link || '/admin', priority: null, status: null, due_at: null }
        : null)
    : (topTask
        ? { title: topTask.title, href: `/admin/org/${slug}#tasks`, priority: topTask.priority, status: topTask.status, due_at: topTask.due_at }
        : null)
  const heroOpenCount = isOwner ? jillTasks.length : openTaskCount
  const manager = mgr as { name: string; slug: string; role_title: string | null; emoji: string | null } | null
  const team = (teamData ?? []) as { id: string; slug: string; name: string; role_title: string | null; emoji: string | null; status: string }[]
  const feeds = FIELD_FEEDS[slug] ?? null

  const isAgent = e.kind === 'agent'
  const meters = isAgent ? meterCells(computeMeters(e as unknown as { slug: string; kind: 'agent'; status: string; responsibilities?: string[] | null }, logs)) : null

  // Owned pages from the registry, grouped by task category, with the four
  // Programs filter-views folded into one "Program pages" entry. Pages merged
  // into a hub (Accuracy tabs) already collapse into the ONE hub entry.
  const { groups: ownedGroups } = buildOwned(slug)

  return (
    <div className="ep-root">
      <style dangerouslySetInnerHTML={{ __html: EP_CSS }} />
      <div className="ep-wrap">
        <Link href="/admin/org" className="ep-back"><Icon name="arrowLeft" size={15} /> The team</Link>

        {/* ── Hero: compact identity + clickable owned tools; long copy folds into About ── */}
        <header className="ep-hero">
          <div className="ep-hero-top">
            <div className="ep-hero-figure">
              <div className="ep-portrait-wrap">
                {e.image_url ? (
                  <div className="ep-portrait">
                    <Image src={e.image_url} alt={e.name} fill sizes="128px" style={{ objectFit: 'cover' }} priority />
                  </div>
                ) : (
                  <div className="ep-portrait ep-portrait-fallback">{e.emoji || '👤'}</div>
                )}
              </div>
              {/* Compact vitals — sit directly under the portrait as one status card */}
              {meters && (
                <div className="ep-vitals-mini" aria-label={`${e.name.split(' ')[0]}'s vitals`}>
                  {meters.map((c) => (
                    <Link
                      key={c.key}
                      href={`/admin/org/${slug}/vitals/${c.key}`}
                      className="ep-vmini"
                      title={`${c.label}: ${c.value} — ${describeMeter(c.key, c.value)}. See why →`}
                      aria-label={`${c.label} ${c.value} — see why`}
                    >
                      <Ring value={c.value} color={c.color} size={38} stroke={4} track="var(--admin-surface-alt)" valueColor="var(--admin-text)" />
                      <span className="ep-vmini-label">{c.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="ep-hero-id">
              <div className="ep-status"><span className="ep-status-dot" style={{ background: statusColor(e.status) }} /> {statusLabel(e.status)}</div>
              <h1 className="ep-name">{e.name}</h1>
              <div className="ep-role">{e.role_title || ''}</div>
              {e.mission && <p className="ep-mission">{e.mission}</p>}
              <div className="ep-meta">
                {manager && (
                  <Link href={`/admin/org/${manager.slug}`} className="ep-meta-chip">
                    <Icon name="users" size={13} /> Reports to {manager.name}
                  </Link>
                )}
                {isAgent && (
                  <span className="ep-meta-chip ep-meta-chip-static">
                    <Icon name="clock" size={13} />
                    {e.last_regenerated_at ? `Agent file · ${fmtDate(e.last_regenerated_at)}` : 'Agent file · not generated'}
                  </span>
                )}
              </div>

              {/* Task-forward row: the #1 open task + Jill's private note. Full width
                  of the identity column now that the owned-tools list lives only in
                  the workspace section below (one home per tool). */}
              <div className="ep-focus">
                <div className={`ep-toptask${heroTask ? ` ${heroTask.priority ? (TASK_PRI_CLASS[heroTask.priority] ?? 'ep-tt-p2') : 'ep-tt-p2'}` : ' ep-toptask-empty'}`}>
                  <div className="ep-tt-head">
                    <span className="ep-tt-kicker"><Icon name="flag" size={12} /> Top task</span>
                    {heroTask?.priority && <span className={`ep-tt-pri ${TASK_PRI_CLASS[heroTask.priority] ?? 'ep-tt-p2'}`}>{heroTask.priority}</span>}
                  </div>
                  {heroTask ? (
                    <>
                      <Link href={heroTask.href} className="ep-tt-title">{heroTask.title}</Link>
                      <div className="ep-tt-meta">
                        {heroTask.status && <span className={`ep-tt-status ep-tt-status-${heroTask.status}`}>{TASK_STATUS_LABEL[heroTask.status] ?? heroTask.status}</span>}
                        {heroTask.due_at && <span className="ep-tt-due"><Icon name="clock" size={12} /> Due {fmtDate(heroTask.due_at)}</span>}
                        {heroOpenCount > 1 && <span className="ep-tt-more">+{heroOpenCount - 1} more open</span>}
                      </div>
                    </>
                  ) : (
                    <div className="ep-tt-none"><Icon name="check" size={15} /> No open tasks</div>
                  )}
                </div>
                <QuickNote slug={slug} employeeName={e.name} initialNote={e.quick_note} />
              </div>
            </div>
          </div>
          {(e.mission || e.persona) && (
            <details className="ep-about">
              <summary className="ep-about-toggle">
                <Icon name="book" size={14} />
                <span>About {e.name.split(' ')[0]}</span>
                <Icon name="arrow" size={13} />
              </summary>
              <div className="ep-about-body">
                {e.mission && <p className="ep-about-mission">{e.mission}</p>}
                {e.persona && <p className="ep-about-persona">{e.persona}</p>}
              </div>
            </details>
          )}
        </header>

        {/* ── Assigned Tasks: this head's open work items (most action-relevant) ── */}
        <section className="ep-section" id="tasks">
          <div className="ep-sec-head">
            <h2 className="ep-sec-title">Assigned tasks</h2>
            <span className="ep-sec-meta">{openTaskCount} open</span>
          </div>
          <div className="ep-card ep-tasks">
            <AssignedTasks employeeSlug={slug} employeeName={e.name} initialTasks={tasks} />
          </div>
        </section>

        {/* ── Reads every morning: this head's trade sources (lib/field-feeds.json) ── */}
        {feeds && feeds.sources.length > 0 && (
          <section className="ep-section">
            <div className="ep-sec-head">
              <h2 className="ep-sec-title">Reads every morning</h2>
              <span className="ep-sec-meta">Stays current on the beat</span>
            </div>
            <div className="ep-card ep-papers">
              {feeds.sources.map((s) => {
                const n = pubNumbers(s.name)
                return (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ep-paper"
                    aria-label={`${s.name}${s.tagline ? ` — ${s.tagline}` : ''} (opens in new tab)`}
                  >
                    <span className="ep-paper-face">
                      <span className="ep-paper-kicker" aria-hidden="true">
                        <span className="ep-paper-kicker-line" />
                        <span className="ep-paper-kicker-star">&#9733;</span>
                        <span className="ep-paper-kicker-line" />
                      </span>
                      <span className="ep-paper-masthead">{s.name}</span>
                      <span className="ep-paper-rule-gold" aria-hidden="true" />
                      {s.tagline && <span className="ep-paper-subhead">{s.tagline}</span>}
                      <span className="ep-paper-rule-bar" aria-hidden="true" />
                      <span className="ep-paper-meta" aria-hidden="true">
                        <span>Morning Edition</span>
                        <span>Vol.&nbsp;{n.vol} · No.&nbsp;{n.issue}</span>
                      </span>
                      <span className="ep-paper-hr" aria-hidden="true" />
                      <span className="ep-paper-cols" aria-hidden="true">
                        <span className="ep-paper-col">
                          <span className="ep-paper-hl" />
                          <span className="ep-paper-hl short" />
                          <span className="ep-paper-ln" />
                          <span className="ep-paper-ln" />
                          <span className="ep-paper-ln short" />
                          <span className="ep-paper-page">Page&nbsp;{n.p1}</span>
                        </span>
                        <span className="ep-paper-colrule" />
                        <span className="ep-paper-col">
                          <span className="ep-paper-hl" />
                          <span className="ep-paper-hl short" />
                          <span className="ep-paper-ln" />
                          <span className="ep-paper-ln short" />
                          <span className="ep-paper-ln" />
                          <span className="ep-paper-page">Page&nbsp;{n.p2}</span>
                        </span>
                      </span>
                      <span className="ep-paper-fold" aria-hidden="true" />
                      <span className="ep-paper-read">
                        <Icon name="arrow" size={13} /> READ
                      </span>
                      <span className="ep-paper-corner" aria-hidden="true" />
                    </span>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Team: this person's direct reports (specialists / heads) ── */}
        {team.length > 0 && (
          <section className="ep-section">
            <div className="ep-sec-head">
              <h2 className="ep-sec-title">{e.name.split(' ')[0]}&rsquo;s team</h2>
              <span className="ep-sec-meta">{team.length} direct report{team.length === 1 ? '' : 's'}</span>
            </div>
            <div className="ep-team">
              {team.map((m) => (
                <Link key={m.id} href={`/admin/org/${m.slug}`} className="ep-card ep-teammate" title={m.role_title || m.name}>
                  <span className="ep-teammate-av">{m.emoji || m.name.charAt(0).toUpperCase()}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ep-teammate-name">{m.name}</div>
                    <div className="ep-teammate-role">{m.role_title || ''}</div>
                  </div>
                  <span className="ep-teammate-go"><Icon name="arrow" size={14} /></span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── What they own (the workspace) ── */}
        {ownedGroups.length > 0 && (
          <section className="ep-section">
            <div className="ep-sec-head">
              <h2 className="ep-sec-title">{e.name.split(' ')[0]}&rsquo;s workspace</h2>
              <span className="ep-sec-meta">Everything {e.name.split(' ')[0]} owns</span>
            </div>
            <div className="ep-workspace">
              {ownedGroups.map((g) => (
                <div key={g.cat} className="ep-wsgroup">
                  <div className="ep-wsgroup-head"><Icon name={CAT_ICON[g.cat]} size={15} /> {g.cat} <span className="ep-wsgroup-count">{g.items.length}</span></div>
                  <div className="ep-wsgrid">
                    {g.items.map((it) =>
                      it.kind === 'programs' ? (
                        <div key="program-pages" className="ep-card ep-tool ep-tool-prog">
                          <span className="ep-tool-ic"><Icon name="award" size={19} /></span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="ep-tool-title">Program pages</div>
                            <div className="ep-tool-desc">The loyalty program catalog — one page, filtered by type.</div>
                            <div className="ep-prog-views">
                              {it.views.map((v) => (
                                <Link key={v.id} href={v.path} className="ep-prog-view" title={v.description}>
                                  {PROGRAM_VIEW_LABEL[v.id] ?? v.title}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Link key={it.page.id} href={it.page.path} className="ep-card ep-tool" title={`Owned by ${e.name} — ${it.page.description}`}>
                          <span className="ep-tool-ic"><Icon name={pageIcon(it.page)} size={19} /></span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="ep-tool-title">{it.page.title}</div>
                            <div className="ep-tool-desc">{it.page.description}</div>
                          </div>
                          <span className="ep-tool-go"><Icon name="arrow" size={15} /></span>
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Ideas box: this person's proactive suggestions for their own area ── */}
        <section className="ep-section" id="ideas">
          <div className="ep-sec-head ep-ideas-head">
            <div className="ep-ideas-title">
              {hasIdeaArt ? (
                <span className="ep-ideas-art">
                  <Image src="/team/ideas-box.png" alt="" width={52} height={52} style={{ objectFit: 'cover' }} />
                </span>
              ) : (
                <span className="ep-ideas-ic"><Icon name="lightbulb" size={22} /></span>
              )}
              <div className="ep-ideas-heading">
                <h2 className="ep-sec-title">Ideas box</h2>
                <span className="ep-ideas-sub">{e.name.split(' ')[0]}&rsquo;s ideas to make {isOwner ? 'the product' : 'their area'} better</span>
              </div>
            </div>
            {newIdeaCount > 0 && <span className="ep-sec-meta">{newIdeaCount} new</span>}
          </div>
          <div className="ep-card ep-ideas-card">
            <IdeasBox employeeSlug={slug} employeeName={e.name} initialIdeas={ideas} />
          </div>
        </section>

        {/* ── Recent tasks + Charter (two columns) ── */}
        <div className="ep-cols">
          <section className="ep-section" style={{ margin: 0 }}>
            <div className="ep-sec-head"><h2 className="ep-sec-title">Recent work</h2></div>
            <div className="ep-card ep-log">
              {logs.length === 0 ? (
                <p className="ep-empty"><Icon name="clock" size={16} /> No entries yet.</p>
              ) : logs.map((l) => {
                const k = LOG_KIND[l.type] ?? { icon: 'check' as IconName, label: l.type, fg: 'var(--admin-text-muted)', bg: 'var(--admin-surface-alt)' }
                return (
                  <div key={l.id} className="ep-log-item">
                    <span className="ep-log-ic" style={{ color: k.fg, background: k.bg }}><Icon name={k.icon} size={15} /></span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="ep-log-top">
                        <span className="ep-log-kind" style={{ color: k.fg }}>{k.label}</span>
                        <span className="ep-log-date">{l.actor ? `${l.actor} · ` : ''}{fmtDate(l.created_at)}</span>
                      </div>
                      <p className="ep-log-note">{l.note}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="ep-section" style={{ margin: 0 }}>
            <details className="ep-dossier">
              <summary className="ep-dossier-toggle">
                <Icon name="fileText" size={14} />
                <span>Dossier</span>
                <Icon name="arrow" size={13} />
              </summary>
              <div className="ep-card ep-charter ep-dossier-body">
                {arr(e.responsibilities).length > 0 && (
                  <div className="ep-charter-block">
                    <div className="ep-charter-label"><Icon name="briefcase" size={13} /> Responsibilities</div>
                    <ul className="ep-list">{arr(e.responsibilities).map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                )}
                {arr(e.rules).length > 0 && (
                  <div className="ep-charter-block">
                    <div className="ep-charter-label"><Icon name="shield" size={13} /> Rules</div>
                    <ul className="ep-list">{arr(e.rules).map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                )}
                {arr(e.skills).length > 0 && (
                  <div className="ep-charter-block">
                    <div className="ep-charter-label"><Icon name="star" size={13} /> Skills</div>
                    <div className="ep-chips">{arr(e.skills).map((s) => <span key={s} className="ep-chip">{s}</span>)}</div>
                  </div>
                )}
                {arr(e.allowed_scopes).length > 0 && (
                  <div className="ep-charter-block">
                    <div className="ep-charter-label"><Icon name="link" size={13} /> Allowed scopes</div>
                    <div className="ep-chips">{arr(e.allowed_scopes).map((s) => <span key={s} className="ep-chip ep-chip-quiet">{s}</span>)}</div>
                  </div>
                )}
                {arr(e.platforms).length > 0 && (
                  <div className="ep-charter-block">
                    <div className="ep-charter-label"><Icon name="globe" size={13} /> Platforms</div>
                    <div className="ep-chips">{arr<Platform>(e.platforms).map((p, i) => <span key={i} className="ep-chip ep-chip-quiet">{p.platform}</span>)}</div>
                  </div>
                )}
                {arr(e.responsibilities).length === 0 && arr(e.rules).length === 0 && arr(e.skills).length === 0 && (
                  <p className="ep-empty">Dossier not specified yet.</p>
                )}
              </div>
            </details>
          </section>
        </div>

        {/* ── Recent decisions (Decision Log) ── */}
        {decisions.length > 0 && (
          <section className="ep-section">
            <div className="ep-sec-head">
              <h2 className="ep-sec-title">Recent decisions</h2>
              <Link href="/admin/decisions" className="ep-sec-link">All decisions <Icon name="arrow" size={13} /></Link>
            </div>
            <div className="ep-card ep-dl">
              {decisions.map((d) => {
                const st = DECISION_STATUS[d.status]
                return (
                  <div key={d.id} className="ep-dl-item">
                    <span className="ep-dl-action">
                      {decisionActionLabel(d.action)}{d.item_count > 1 ? ` ×${d.item_count}` : ''}
                    </span>
                    {d.target_label && <span className="ep-dl-target">{d.target_label}</span>}
                    <span className="ep-dl-pill" style={{ color: st.fg, background: st.bg }}>{st.label}</span>
                    <span className="ep-dl-time">{timeAgo(d.created_at)}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function describeMeter(key: string, v: number): string {
  if (key === 'workload') return v >= 85 ? 'Maxed' : v >= 60 ? 'Heavy' : v >= 30 ? 'Steady' : 'Light'
  if (key === 'morale') return v >= 80 ? 'Great' : v >= 60 ? 'Good' : v >= 40 ? 'Meh' : 'Low'
  if (key === 'momentum') return v >= 60 ? 'Shipping' : v >= 30 ? 'Warming up' : 'Idle'
  return v >= 80 ? 'Strong' : v >= 50 ? 'Solid' : 'Needs work'
}

const EP_CSS = `
.admin .ep-wrap { max-width:1000px; margin:0 auto; padding:0 4px; }
.admin .ep-back { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-muted); text-decoration:none; margin-bottom:1.6rem; transition:gap .14s ease, color .14s ease; }
.admin .ep-back:hover { gap:9px; color:var(--color-primary); text-decoration:none; }

/* Hero — compact identity band */
.admin .ep-hero {
  display:flex; flex-direction:column; padding:1.5rem 1.6rem; margin-bottom:2.6rem;
  border-radius:20px; position:relative; overflow:hidden;
  border:1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border));
  background:radial-gradient(90% 130% at 100% 0%, color-mix(in srgb, var(--color-primary) 7%, #fff), #fff 68%);
  box-shadow:0 1px 2px rgba(107,45,143,.04), 0 22px 50px -32px rgba(107,45,143,.26);
}
.admin .ep-hero::before { content:''; position:absolute; top:0; left:1.6rem; right:1.6rem; height:2px; border-radius:2px; background:linear-gradient(90deg, transparent, ${GOLD}, transparent); opacity:.85; }
.admin .ep-hero-top { display:flex; gap:1.25rem; align-items:flex-start; }
/* Left column status card — portrait on top, compact vitals right beneath */
.admin .ep-hero-figure { flex-shrink:0; display:flex; flex-direction:column; align-items:center; gap:.7rem; }
.admin .ep-portrait-wrap { flex-shrink:0; padding:3px; border-radius:16px; background:linear-gradient(150deg, ${GOLD}, color-mix(in srgb, ${GOLD} 25%, #fff)); box-shadow:0 8px 20px -12px rgba(107,45,143,.4); }
/* Compact 2×2 vitals under the 128px portrait — a glance, not the focus */
.admin .ep-vitals-mini { display:grid; grid-template-columns:repeat(2, 1fr); gap:9px 6px; width:100%; padding:2px 0; }
.admin .ep-vmini { display:flex; flex-direction:column; align-items:center; gap:4px; min-width:0; }
.admin .ep-vmini-label { font-size:.58rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:var(--admin-text-muted); line-height:1; text-align:center; max-width:100%; overflow:hidden; text-overflow:ellipsis; }
.admin .ep-portrait { position:relative; width:128px; height:128px; border-radius:14px; overflow:hidden; background:var(--admin-accent-soft); }
.admin .ep-portrait-fallback { display:flex; align-items:center; justify-content:center; font-size:3rem; background:radial-gradient(circle at 30% 25%, #fff, var(--admin-accent-soft)); }
.admin .ep-hero-id { min-width:0; flex:1; }
.admin .ep-status { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--admin-text-muted); }
.admin .ep-status-dot { width:8px; height:8px; border-radius:50%; }
.admin .ep-name { font-family:${DISPLAY}; font-size:2.05rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); margin:.25rem 0 0; line-height:1.05; }
.admin .ep-role { font-size:1rem; color:var(--admin-text-secondary); margin-top:.15rem; font-weight:500; }
.admin .ep-meta { display:flex; flex-wrap:wrap; gap:8px; margin-top:.7rem; }
.admin .ep-meta-chip { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-xs); font-weight:600; color:var(--admin-text-muted); text-decoration:none; padding:5px 11px; border-radius:9999px; background:var(--admin-surface); border:1px solid var(--admin-border); transition:border-color .14s ease, color .14s ease; }
.admin a.ep-meta-chip:hover { border-color:var(--color-primary); color:var(--color-primary); text-decoration:none; }
.admin .ep-meta-chip-static { cursor:default; }

/* Mission line — small, muted; up to 3 lines so it never clips mid-word
   (full copy always available in the "About" toggle below) */
.admin .ep-mission { margin:.6rem 0 0; font-size:var(--admin-text-sm); line-height:1.5; color:var(--admin-text-muted); max-width:78ch; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }

/* Vitals mini — clickable ring links to the "why" detail page */
.admin a.ep-vmini { text-decoration:none; border-radius:12px; padding:4px 2px; transition:background .14s ease, transform .14s ease; }
.admin a.ep-vmini:hover { background:color-mix(in srgb, var(--color-primary) 6%, #fff); transform:translateY(-1px); text-decoration:none; }
.admin a.ep-vmini:hover .ep-vmini-label { color:var(--color-primary); }
.admin a.ep-vmini:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }

/* Task-forward focus row: Top task card (1.4fr) + Notes sticky (1fr) */
.admin .ep-focus { display:grid; grid-template-columns:1.4fr 1fr; gap:12px; margin-top:1.1rem; align-items:stretch; }
.admin .ep-toptask {
  min-width:0; display:flex; flex-direction:column; gap:7px;
  padding:12px 14px; border-radius:14px; border:1px solid var(--admin-border);
  border-left:4px solid var(--admin-text-subtle); background:var(--admin-surface);
  box-shadow:0 1px 2px rgba(107,45,143,.03), 0 12px 26px -22px rgba(107,45,143,.35);
}
.admin .ep-toptask.ep-tt-p1 { border-left-color:var(--admin-danger); }
.admin .ep-toptask.ep-tt-p2 { border-left-color:var(--color-primary); }
.admin .ep-toptask.ep-tt-p3 { border-left-color:var(--admin-text-subtle); }
.admin .ep-toptask-empty { border-left-color:var(--admin-success); }
.admin .ep-tt-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.admin .ep-tt-kicker { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.07em; color:var(--admin-text-subtle); }
.admin .ep-tt-kicker svg { color:var(--admin-text-muted); }
.admin .ep-tt-pri { flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; min-width:28px; height:22px; padding:0 8px; border-radius:7px; font-size:var(--admin-text-xs); font-weight:800; letter-spacing:.03em; font-variant-numeric:tabular-nums; }
.admin .ep-tt-pri.ep-tt-p1 { color:var(--admin-danger); background:var(--admin-danger-soft); border:1px solid color-mix(in srgb, var(--admin-danger) 30%, var(--admin-border)); }
.admin .ep-tt-pri.ep-tt-p2 { color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 18%, var(--admin-border)); }
.admin .ep-tt-pri.ep-tt-p3 { color:var(--admin-text-muted); background:var(--admin-surface-alt); border:1px solid var(--admin-border); }
.admin .ep-tt-title { font-size:.98rem; font-weight:700; color:var(--admin-text); line-height:1.35; text-decoration:none; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.admin a.ep-tt-title:hover { color:var(--color-primary); text-decoration:none; }
.admin .ep-tt-meta { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-top:1px; }
.admin .ep-tt-status { font-size:var(--admin-text-xs); font-weight:800; padding:2px 9px; border-radius:9999px; text-transform:uppercase; letter-spacing:.04em; color:var(--admin-text-muted); background:var(--admin-surface-alt); border:1px solid var(--admin-border); }
.admin .ep-tt-status-in_progress { color:var(--admin-info); background:var(--admin-info-soft); border-color:transparent; }
.admin .ep-tt-status-blocked { color:var(--admin-warning); background:var(--admin-warning-soft); border-color:transparent; }
.admin .ep-tt-due { display:inline-flex; align-items:center; gap:5px; font-size:var(--admin-text-xs); font-weight:600; color:var(--admin-text-muted); }
.admin .ep-tt-more { font-size:var(--admin-text-xs); font-weight:600; color:var(--admin-text-subtle); }
.admin .ep-tt-none { display:flex; align-items:center; gap:8px; padding:6px 0 2px; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-muted); }
.admin .ep-tt-none svg { color:var(--admin-success); }

/* Hero: About toggle (native details, folds the long copy out of view) */
.admin .ep-about { margin-top:1.1rem; border-top:1px dashed color-mix(in srgb, var(--color-primary) 14%, var(--admin-border)); padding-top:.9rem; }
.admin .ep-about-toggle { display:inline-flex; align-items:center; gap:7px; cursor:pointer; list-style:none; font-size:var(--admin-text-sm); font-weight:700; color:var(--color-primary); padding:5px 12px; border-radius:9999px; background:color-mix(in srgb, var(--color-primary) 7%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 15%, var(--admin-border)); width:max-content; transition:background .14s ease; }
.admin .ep-about-toggle::-webkit-details-marker { display:none; }
.admin .ep-about-toggle:hover { background:color-mix(in srgb, var(--color-primary) 12%, #fff); }
.admin .ep-about-toggle > svg:last-child { transition:transform .18s ease; }
.admin .ep-about[open] .ep-about-toggle > svg:last-child { transform:rotate(90deg); }
.admin .ep-about-body { margin-top:.9rem; max-width:70ch; padding-left:2px; }
.admin .ep-about-mission { margin:0; font-size:1rem; line-height:1.6; color:var(--admin-text); font-weight:600; }
.admin .ep-about-persona { margin:.75rem 0 0; font-size:var(--admin-text-sm); line-height:1.65; color:var(--admin-text-secondary); }

/* Dossier toggle — sibling of the About toggle: collapsed "Dossier" pill, chevron rotates open */
.admin .ep-dossier-toggle { display:inline-flex; align-items:center; gap:7px; cursor:pointer; list-style:none; font-size:var(--admin-text-sm); font-weight:700; color:var(--color-primary); padding:5px 12px; border-radius:9999px; background:color-mix(in srgb, var(--color-primary) 7%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 15%, var(--admin-border)); width:max-content; transition:background .14s ease; }
.admin .ep-dossier-toggle::-webkit-details-marker { display:none; }
.admin .ep-dossier-toggle:hover { background:color-mix(in srgb, var(--color-primary) 12%, #fff); }
.admin .ep-dossier-toggle > svg:last-child { transition:transform .18s ease; }
.admin .ep-dossier[open] .ep-dossier-toggle > svg:last-child { transform:rotate(90deg); }
.admin .ep-dossier-body { margin-top:.9rem; }

/* Sections */
.admin .ep-section { margin-bottom:2.6rem; }
.admin .ep-sec-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:1rem; padding:0 2px; }
.admin .ep-sec-title { font-family:${DISPLAY}; font-size:1.4rem; font-weight:700; letter-spacing:-.01em; color:var(--admin-text); margin:0; }
.admin .ep-sec-meta { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.08em; color:var(--admin-text-subtle); font-weight:700; }
.admin .ep-sec-link { display:inline-flex; align-items:center; gap:5px; font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-primary); text-decoration:none; }
.admin .ep-sec-link:hover { gap:8px; text-decoration:none; }

/* Card base */
.admin .ep-card { background:var(--admin-surface); border:1px solid color-mix(in srgb, var(--color-primary) 9%, var(--admin-border)); border-radius:18px; box-shadow:0 1px 2px rgba(107,45,143,.035), 0 18px 40px -30px rgba(107,45,143,.26); }

/* Ideas box — charming header with an illustration slot (falls back to the bulb) */
.admin .ep-ideas-head { align-items:center; }
.admin .ep-ideas-title { display:flex; align-items:center; gap:12px; min-width:0; }
.admin .ep-ideas-ic {
  display:flex; align-items:center; justify-content:center; width:44px; height:44px; flex-shrink:0;
  border-radius:13px; color:var(--color-accent);
  background:radial-gradient(120% 120% at 30% 20%, color-mix(in srgb, var(--color-accent) 22%, #fff), color-mix(in srgb, var(--color-accent) 10%, #fff));
  border:1px solid color-mix(in srgb, var(--color-accent) 40%, var(--admin-border));
  box-shadow:0 6px 16px -10px color-mix(in srgb, var(--color-accent) 60%, transparent);
}
.admin .ep-ideas-art {
  display:flex; align-items:center; justify-content:center; width:52px; height:52px; flex-shrink:0;
  border-radius:13px; overflow:hidden; border:1px solid color-mix(in srgb, var(--color-accent) 35%, var(--admin-border));
  box-shadow:0 6px 16px -10px color-mix(in srgb, var(--color-primary) 45%, transparent);
}
.admin .ep-ideas-art img { width:52px; height:52px; object-fit:cover; }
.admin .ep-ideas-heading { min-width:0; }
.admin .ep-ideas-sub { display:block; font-size:var(--admin-text-sm); color:var(--admin-text-muted); margin-top:2px; line-height:1.35; }

/* Assigned tasks */
.admin .ep-tasks { padding:1.25rem 1.4rem; }

/* Ideas box card */
.admin .ep-ideas-card { padding:1.25rem 1.4rem; }

/* Reads every morning — folded 3D "newsroom" trade papers */
.admin .ep-papers { display:flex; flex-wrap:wrap; align-items:flex-start; gap:1.9rem 1.6rem; padding:2rem 1.6rem 2.2rem; perspective:1200px; }

/* Each source = a folded cream front page with real stacked depth */
.admin .ep-paper {
  position:relative; display:block; width:190px; flex:0 0 auto;
  text-decoration:none; color:inherit; border-radius:8px;
  transform-style:preserve-3d;
  transform:rotateY(-9deg) rotateX(3.5deg) rotate(-1.3deg);
  filter:drop-shadow(0 22px 26px rgba(70,48,104,.20)) drop-shadow(0 5px 8px rgba(70,48,104,.14));
  transition:transform .32s cubic-bezier(.2,.75,.3,1), filter .32s ease;
}
.admin .ep-paper:nth-child(even) { transform:rotateY(9deg) rotateX(3.5deg) rotate(1.3deg); }
.admin .ep-paper:hover, .admin .ep-paper:focus-visible {
  transform:rotateY(0) rotateX(0) rotate(0) translateY(-9px) scale(1.04);
  filter:drop-shadow(0 34px 40px rgba(70,48,104,.28)) drop-shadow(0 10px 16px rgba(70,48,104,.18));
}
.admin .ep-paper:focus-visible { outline:none; }
.admin .ep-paper:focus-visible .ep-paper-face { box-shadow:0 0 0 3px color-mix(in srgb, var(--color-primary) 55%, transparent), inset 0 1px 0 rgba(255,255,255,.7); }

/* the stack of sheets underneath (a few pages thick, offset down/right) */
.admin .ep-paper::before, .admin .ep-paper::after {
  content:''; position:absolute; inset:0; border-radius:8px; z-index:0;
  border:1px solid rgba(150,120,80,.26);
}
.admin .ep-paper::before { transform:translate(5px,6px); background:linear-gradient(#efe4cb, #e2d2b2); }
.admin .ep-paper::after { transform:translate(2.5px,3px); background:linear-gradient(#f6eeda, #ebdcc1); }

/* the front page — layered cream paper texture */
.admin .ep-paper-face {
  position:relative; z-index:1; display:flex; flex-direction:column; gap:6px;
  padding:13px 13px 12px; border-radius:8px; min-height:242px; overflow:hidden; color:#2a2320;
  background:
    radial-gradient(120% 80% at 50% -12%, rgba(255,255,255,.72), transparent 60%),
    repeating-linear-gradient(0deg, rgba(150,120,80,.045) 0 2px, transparent 2px 4px),
    linear-gradient(158deg, #fffdf6 0%, #f8f1df 55%, #efe6cf 100%);
  border:1px solid rgba(150,120,80,.34);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.8), inset 0 -20px 30px -18px rgba(150,120,80,.24);
}

/* kicker: gold rule — star — gold rule */
.admin .ep-paper-kicker { display:flex; align-items:center; gap:6px; padding:1px 3px 0; }
.admin .ep-paper-kicker-line { flex:1; height:1.5px; background:linear-gradient(90deg, transparent, var(--color-accent) 55%); }
.admin .ep-paper-kicker-line:last-child { background:linear-gradient(90deg, var(--color-accent) 45%, transparent); }
.admin .ep-paper-kicker-star { color:var(--color-accent); font-size:11px; line-height:1; }

/* masthead — readable publication name in the display serif, purple */
.admin .ep-paper-masthead {
  font-family:${DISPLAY}; font-weight:800; color:var(--color-primary);
  font-size:1.16rem; line-height:1.02; letter-spacing:-.015em; text-align:center;
  text-shadow:0 1px 0 rgba(255,255,255,.65); margin-top:1px;
}
.admin .ep-paper-rule-gold { height:1.5px; margin:1px 0; background:linear-gradient(90deg, transparent, var(--color-accent), transparent); }

/* subhead / tagline — small caps */
.admin .ep-paper-subhead {
  font-family:${DISPLAY}; text-align:center; color:color-mix(in srgb, var(--color-primary) 78%, #4a4a4a);
  font-size:.56rem; letter-spacing:.11em; text-transform:uppercase; font-weight:700; line-height:1.25;
}
/* thick primary bar under the subhead */
.admin .ep-paper-rule-bar { height:2.5px; margin-top:2px; border-radius:1px; background:var(--color-primary); opacity:.82; }

/* meta line: edition · vol/issue */
.admin .ep-paper-meta { display:flex; align-items:center; justify-content:space-between; gap:6px;
  font-size:.48rem; letter-spacing:.06em; text-transform:uppercase; font-weight:700; color:rgba(90,70,50,.85); }
.admin .ep-paper-hr { height:1px; background:rgba(120,90,60,.4); }

/* two columns of faux headlines, split by a real column rule */
.admin .ep-paper-cols { display:flex; gap:9px; margin-top:2px; }
.admin .ep-paper-col { flex:1; display:flex; flex-direction:column; gap:3.5px; }
.admin .ep-paper-colrule { width:1px; align-self:stretch; background:rgba(120,90,60,.28); }
.admin .ep-paper-hl { height:4px; border-radius:1.5px; background:color-mix(in srgb, var(--color-primary) 52%, #b7a07c); }
.admin .ep-paper-hl.short { width:66%; }
.admin .ep-paper-ln { height:2px; border-radius:1.5px; background:rgba(90,70,50,.32); }
.admin .ep-paper-ln.short { width:56%; }
.admin .ep-paper-page { margin-top:3px; font-size:.44rem; letter-spacing:.06em; text-transform:uppercase; font-weight:700; color:var(--color-primary); opacity:.72; }

/* fold crease across the middle */
.admin .ep-paper-fold { position:absolute; left:0; right:0; top:57%; height:10px; pointer-events:none;
  background:linear-gradient(180deg, transparent, rgba(120,90,60,.10) 45%, rgba(120,90,60,.15) 50%, rgba(255,255,255,.5) 52%, transparent); }

/* → READ footer, pinned to the bottom */
.admin .ep-paper-read {
  position:relative; z-index:1; margin-top:auto; display:flex; align-items:center; justify-content:center; gap:5px;
  padding-top:7px; border-top:1.5px solid color-mix(in srgb, var(--color-accent) 55%, transparent);
  font-family:${DISPLAY}; font-weight:800; font-size:.82rem; letter-spacing:.04em; color:var(--color-primary);
  transition:gap .2s ease;
}
.admin .ep-paper:hover .ep-paper-read, .admin .ep-paper:focus-visible .ep-paper-read { gap:9px; }
.admin .ep-paper-read > svg { transition:transform .2s ease; }
.admin .ep-paper:hover .ep-paper-read > svg { transform:translateX(3px); }

/* folded / curled top-right corner */
.admin .ep-paper-corner {
  position:absolute; top:0; right:0; width:24px; height:24px; z-index:2;
  background:linear-gradient(225deg, #e7d9bb 0%, #f7f0e0 50%, transparent 50%);
  border-left:1px solid rgba(150,120,80,.3); border-bottom:1px solid rgba(150,120,80,.3);
  border-bottom-left-radius:8px; box-shadow:-1px 1px 3px rgba(120,90,60,.2);
}

@media (prefers-reduced-motion: reduce) {
  .admin .ep-paper, .admin .ep-paper-read, .admin .ep-paper-read > svg { transition:none; }
}

/* Workspace */
.admin .ep-workspace { display:flex; flex-direction:column; gap:1.6rem; }
.admin .ep-wsgroup-head { display:flex; align-items:center; gap:8px; font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.09em; font-weight:700; color:var(--color-primary); margin-bottom:.7rem; padding:0 2px; }
.admin .ep-wsgroup-count { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; padding:0 5px; border-radius:9999px; font-size:.65rem; color:var(--admin-text-muted); background:var(--admin-surface-alt); border:1px solid var(--admin-border); letter-spacing:0; }
.admin .ep-wsgrid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:.8rem; }
/* Collapsed "Program pages" card — one tool, four filter views as sub-links */
.admin .ep-tool-prog { align-items:flex-start; cursor:default; }
.admin .ep-tool-prog:hover { transform:none; box-shadow:0 1px 2px rgba(107,45,143,.035), 0 18px 40px -30px rgba(107,45,143,.26); border-color:color-mix(in srgb, var(--color-primary) 9%, var(--admin-border)); }
.admin .ep-prog-views { display:flex; flex-wrap:wrap; gap:5px; margin-top:9px; }
.admin .ep-prog-view { font-size:var(--admin-text-xs); font-weight:600; padding:3px 10px; border-radius:9999px; text-decoration:none; color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 15%, var(--admin-border)); transition:background .14s ease, border-color .14s ease; }
.admin .ep-prog-view:hover { background:color-mix(in srgb, var(--color-primary) 14%, #fff); border-color:color-mix(in srgb, var(--color-primary) 30%, var(--admin-border)); text-decoration:none; }
.admin .ep-tool { display:flex; align-items:center; gap:14px; padding:15px 16px; text-decoration:none; transition:transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
.admin .ep-tool:hover { transform:translateY(-2px); box-shadow:0 14px 32px -18px rgba(107,45,143,.4); border-color:color-mix(in srgb, var(--color-primary) 30%, var(--admin-border)); text-decoration:none; }
.admin .ep-tool-ic { display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:11px; flex-shrink:0; color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border)); }
.admin .ep-tool-title { font-size:.98rem; font-weight:700; color:var(--admin-text); }
.admin .ep-tool-desc { font-size:var(--admin-text-sm); color:var(--admin-text-muted); margin-top:2px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.admin .ep-tool-go { color:var(--admin-text-subtle); opacity:0; transform:translateX(-4px); transition:opacity .14s ease, transform .14s ease; flex-shrink:0; }
.admin .ep-tool:hover .ep-tool-go { opacity:1; transform:translateX(0); color:var(--color-primary); }

/* Team — light person-badges (no big portraits) */
.admin .ep-team { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:.7rem; }
.admin .ep-teammate { display:flex; align-items:center; gap:12px; padding:12px 14px; text-decoration:none; transition:transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
.admin .ep-teammate:hover { transform:translateY(-2px); box-shadow:0 14px 32px -18px rgba(107,45,143,.4); border-color:color-mix(in srgb, var(--color-primary) 30%, var(--admin-border)); text-decoration:none; }
.admin .ep-teammate-av { display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:50%; flex-shrink:0; font-size:1.15rem; line-height:1; background:var(--admin-accent-soft); border:1px solid color-mix(in srgb, var(--color-accent) 30%, var(--admin-border)); }
.admin .ep-teammate-name { font-size:.92rem; font-weight:700; color:var(--admin-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.admin .ep-teammate-role { font-size:var(--admin-text-xs); color:var(--admin-text-muted); margin-top:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.admin .ep-teammate-go { color:var(--admin-text-subtle); flex-shrink:0; opacity:0; transform:translateX(-4px); transition:opacity .14s ease, transform .14s ease; }
.admin .ep-teammate:hover .ep-teammate-go { opacity:1; transform:translateX(0); color:var(--color-primary); }

/* Two-column: recent work + charter */
.admin .ep-cols { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:2.6rem; align-items:start; }
.admin .ep-log { padding:8px; }
.admin .ep-log-item { display:flex; gap:13px; padding:13px 12px; }
.admin .ep-log-item + .ep-log-item { border-top:1px solid var(--admin-border); }
.admin .ep-log-ic { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:9px; flex-shrink:0; }
.admin .ep-log-top { display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
.admin .ep-log-kind { font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
.admin .ep-log-date { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); flex-shrink:0; }
.admin .ep-log-note { margin:4px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-secondary); line-height:1.5; }
.admin .ep-charter { padding:1.4rem 1.5rem; display:flex; flex-direction:column; gap:1.2rem; }
.admin .ep-charter-block {}
.admin .ep-charter-label { display:flex; align-items:center; gap:7px; font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.08em; font-weight:700; color:var(--admin-text-muted); margin-bottom:.6rem; }
.admin .ep-list { margin:0; padding-left:1.05rem; display:flex; flex-direction:column; gap:.4rem; }
.admin .ep-list li { font-size:var(--admin-text-sm); line-height:1.5; color:var(--admin-text-secondary); }
.admin .ep-list li::marker { color:${GOLD}; }
.admin .ep-chips { display:flex; flex-wrap:wrap; gap:6px; }
.admin .ep-chip { font-size:var(--admin-text-xs); font-weight:600; padding:4px 11px; border-radius:9999px; color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 15%, var(--admin-border)); }
.admin .ep-chip-quiet { color:var(--admin-text-muted); background:var(--admin-surface-alt); border-color:var(--admin-border); }

/* Recent decisions (Decision Log) */
.admin .ep-dl { padding:6px; }
.admin .ep-dl-item { display:flex; align-items:center; gap:10px; padding:11px 13px; flex-wrap:wrap; }
.admin .ep-dl-item + .ep-dl-item { border-top:1px solid var(--admin-border); }
.admin .ep-dl-action { font-size:.88rem; font-weight:700; color:var(--admin-text); flex-shrink:0; }
.admin .ep-dl-target { font-size:var(--admin-text-sm); color:var(--admin-text-secondary); min-width:0; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.admin .ep-dl-pill { font-size:var(--admin-text-xs); font-weight:800; padding:2px 9px; border-radius:9999px; text-transform:uppercase; letter-spacing:.04em; flex-shrink:0; }
.admin .ep-dl-time { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); flex-shrink:0; font-variant-numeric:tabular-nums; margin-left:auto; }

.admin .ep-empty { display:flex; align-items:center; gap:8px; padding:16px; margin:0; color:var(--admin-text-muted); font-size:var(--admin-text-sm); }

@media (max-width:820px) {
  .admin .ep-cols { grid-template-columns:1fr; }
  .admin .ep-hero-top { flex-wrap:wrap; }
}
@media (max-width:640px) {
  /* Stack the Top task + Notes row so neither card gets crushed */
  .admin .ep-focus { grid-template-columns:1fr; }
}
@media (max-width:560px) {
  .admin .ep-hero-top { align-items:flex-start; gap:1rem; }
  .admin .ep-name { font-size:1.75rem; }
  .admin .ep-portrait { width:100px; height:100px; }
  .admin .ep-papers { gap:1.4rem 1.1rem; padding:1.5rem 1.1rem 1.6rem; justify-content:center; }
}
`
