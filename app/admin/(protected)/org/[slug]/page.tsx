import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { computeMeters } from '@/lib/orgMeters'
import { Icon, Ring, meterCells, type IconName } from '@/components/admin/preview/kit'
import { ADMIN_PAGES, type TaskCategory, type AdminPage } from '@/lib/admin/registry'
import type { DecisionRow, DecisionStatus } from '@/lib/admin/logDecision'

export const dynamic = 'force-dynamic'

const PURPLE = 'var(--color-primary)'
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
}
type Log = { id: string; type: string; note: string; actor: string | null; created_at: string }
type Lore = { id: string; lore_date: string; headline: string; body: string | null; involves: string[] | null }

const arr = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : [])

// Category → Lucide-style icon (workspace grouping).
const CAT_ICON: Record<TaskCategory, IconName> = {
  Ops: 'compass', Content: 'pencil', Social: 'megaphone', Growth: 'trending',
  Sources: 'globe', Accuracy: 'shield', Reference: 'database', Reliability: 'activity', Design: 'palette',
}
// Per-page icon where a distinct one reads clearer; else the category icon.
const PAGE_ICON: Record<string, IconName> = {
  triage: 'inbox', drafts: 'pencil', newsletter: 'mail', briefs: 'fileText', topics: 'tag',
  'question-radar': 'activity', roadmap: 'compass', experiences: 'star', sweepstakes: 'award', takes: 'bell',
  creatives: 'image', 'social-calendar': 'calendar', subscribers: 'users', analytics: 'trending', 'short-links': 'link',
  sources: 'globe', scrapes: 'globe', 'change-signals': 'activity', 'card-bonus-signals': 'creditCard',
  agents: 'shield', 'fact-checks': 'check', 'verification-findings': 'check', 'data-integrity': 'shield', 'program-drift': 'activity',
  programs: 'award', 'programs-currencies': 'database', 'programs-hotels': 'database', 'programs-otas': 'database',
  issuers: 'briefcase', cards: 'creditCard', 'partner-redemptions': 'award', tokens: 'tag',
  extractions: 'database', 'card-extractions': 'creditCard', 'refresh-queue': 'activity', 'manual-overrides': 'pencil',
  glossary: 'book', dashboard: 'compass', org: 'users', 'ai-usage': 'gauge', decisions: 'flag',
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

  const [{ data: logsData }, { data: mgr }, { data: teamData }, { data: loreData }, { data: decisionsData }] = await Promise.all([
    db.from('employee_logs').select('id, type, note, actor, created_at').eq('employee_id', e.id).order('created_at', { ascending: false }).limit(12),
    e.reports_to_id
      ? db.from('employees').select('name, slug, role_title, emoji').eq('id', e.reports_to_id).maybeSingle()
      : Promise.resolve({ data: null }),
    db.from('employees').select('id, slug, name, role_title, emoji, status').eq('reports_to_id', e.id).order('name', { ascending: true }),
    db.from('org_lore').select('id, lore_date, headline, body, involves').order('lore_date', { ascending: false }).order('created_at', { ascending: false }).limit(40),
    db.from('decision_log').select('*').eq('employee_slug', slug).order('created_at', { ascending: false }).limit(8),
  ])
  const logs = (logsData ?? []) as Log[]
  const decisions = (decisionsData ?? []) as DecisionRow[]
  const manager = mgr as { name: string; slug: string; role_title: string | null; emoji: string | null } | null
  const team = (teamData ?? []) as { id: string; slug: string; name: string; role_title: string | null; emoji: string | null; status: string }[]
  const lore = ((loreData ?? []) as Lore[]).filter((l) => arr(l.involves).includes(slug)).slice(0, 3)

  const isAgent = e.kind === 'agent'
  const meters = isAgent ? meterCells(computeMeters(e as unknown as { slug: string; kind: 'agent'; status: string; responsibilities?: string[] | null }, logs)) : null

  // Owned pages from the registry, grouped by task category (registry order).
  const owned = ADMIN_PAGES.filter((p) => p.owner === slug && p.status === 'active')
  const ownedGroups: { cat: TaskCategory; pages: AdminPage[] }[] = []
  for (const p of owned) {
    const last = ownedGroups[ownedGroups.length - 1]
    if (last && last.cat === p.taskCategory) last.pages.push(p)
    else ownedGroups.push({ cat: p.taskCategory, pages: [p] })
  }

  return (
    <div className="ep-root">
      <style dangerouslySetInnerHTML={{ __html: EP_CSS }} />
      <div className="ep-wrap">
        <Link href="/admin/org" className="ep-back"><Icon name="arrowLeft" size={15} /> The team</Link>

        {/* ── Hero ── */}
        <header className="ep-hero">
          <div className="ep-portrait-wrap">
            {e.image_url ? (
              <div className="ep-portrait">
                <Image src={e.image_url} alt={e.name} fill sizes="220px" style={{ objectFit: 'cover' }} priority />
              </div>
            ) : (
              <div className="ep-portrait ep-portrait-fallback">{e.emoji || '👤'}</div>
            )}
          </div>
          <div className="ep-hero-body">
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
              {owned.length > 0 && (
                <span className="ep-meta-chip ep-meta-chip-static"><Icon name="briefcase" size={13} /> Owns {owned.length} {owned.length === 1 ? 'tool' : 'tools'}</span>
              )}
            </div>
          </div>
        </header>

        {/* ── Vitals: ring gauges ── */}
        {meters && (
          <section className="ep-section">
            <div className="ep-sec-head"><h2 className="ep-sec-title">Vitals</h2><span className="ep-sec-meta">Live from activity</span></div>
            <div className="ep-card ep-vitals">
              {meters.map((c) => (
                <div key={c.key} className="ep-vital">
                  <Ring value={c.value} color={c.color} size={46} stroke={4} track="var(--admin-surface-alt)" valueColor="var(--admin-text)" />
                  <div className="ep-vital-meta">
                    <span className="ep-vital-label">{c.label}</span>
                    <span className="ep-vital-sub">{describeMeter(c.key, c.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Persona / lore ── */}
        {e.persona && (
          <section className="ep-section">
            <div className="ep-sec-head"><h2 className="ep-sec-title">Who {e.name} is</h2></div>
            <div className="ep-card ep-persona">
              <span className="ep-persona-mark" aria-hidden="true">&ldquo;</span>
              <p className="ep-persona-text">{e.persona}</p>
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
                  <div className="ep-wsgroup-head"><Icon name={CAT_ICON[g.cat]} size={15} /> {g.cat}</div>
                  <div className="ep-wsgrid">
                    {g.pages.map((p) => (
                      <Link key={p.id} href={p.path} className="ep-card ep-tool" title={`Owned by ${e.name} — ${p.description}`}>
                        <span className="ep-tool-ic"><Icon name={pageIcon(p)} size={19} /></span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="ep-tool-title">{p.title}</div>
                          <div className="ep-tool-desc">{p.description}</div>
                        </div>
                        <span className="ep-tool-go"><Icon name="arrow" size={15} /></span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
            <div className="ep-sec-head"><h2 className="ep-sec-title">Charter</h2></div>
            <div className="ep-card ep-charter">
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
                <p className="ep-empty">Charter not specified yet.</p>
              )}
            </div>
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

        {/* ── Breakroom beats ── */}
        {lore.length > 0 && (
          <section className="ep-section ep-section-last">
            <div className="ep-sec-head">
              <h2 className="ep-sec-title">From the Breakroom</h2>
              <Link href="/admin/org" className="ep-sec-link">All lore <Icon name="arrow" size={13} /></Link>
            </div>
            <div className="ep-card ep-break">
              {lore.map((l, i) => (
                <div key={l.id} className={`ep-break-item${i > 0 ? ' ep-break-b' : ''}`}>
                  <span className="ep-break-ic"><Icon name="coffee" size={15} /></span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ep-break-head">{l.headline}</div>
                    {l.body && <p className="ep-break-body">{l.body}</p>}
                  </div>
                  <span className="ep-break-date">{l.lore_date}</span>
                </div>
              ))}
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

/* Hero */
.admin .ep-hero {
  display:flex; gap:2rem; align-items:center; padding:2rem; margin-bottom:2.6rem;
  border-radius:24px; position:relative; overflow:hidden;
  border:1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border));
  background:radial-gradient(80% 130% at 100% 0%, color-mix(in srgb, var(--color-primary) 8%, #fff), #fff 70%);
  box-shadow:0 1px 2px rgba(107,45,143,.04), 0 26px 60px -30px rgba(107,45,143,.28);
}
.admin .ep-hero::before { content:''; position:absolute; top:0; left:2rem; right:2rem; height:2px; border-radius:2px; background:linear-gradient(90deg, transparent, ${GOLD}, transparent); opacity:.85; }
.admin .ep-portrait-wrap { flex-shrink:0; padding:5px; border-radius:24px; background:linear-gradient(150deg, ${GOLD}, color-mix(in srgb, ${GOLD} 25%, #fff)); box-shadow:0 12px 30px -12px rgba(107,45,143,.4); }
.admin .ep-portrait { position:relative; width:172px; height:172px; border-radius:20px; overflow:hidden; background:var(--admin-accent-soft); }
.admin .ep-portrait-fallback { display:flex; align-items:center; justify-content:center; font-size:5rem; background:radial-gradient(circle at 30% 25%, #fff, var(--admin-accent-soft)); }
.admin .ep-hero-body { min-width:0; flex:1; }
.admin .ep-status { display:inline-flex; align-items:center; gap:7px; font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--admin-text-muted); }
.admin .ep-status-dot { width:8px; height:8px; border-radius:50%; }
.admin .ep-name { font-family:${DISPLAY}; font-size:2.9rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); margin:.5rem 0 0; line-height:1.02; }
.admin .ep-role { font-size:1.05rem; color:var(--admin-text-secondary); margin-top:.25rem; font-weight:500; }
.admin .ep-mission { margin:1rem 0 0; font-size:.98rem; line-height:1.55; color:var(--admin-text-secondary); max-width:56ch; }
.admin .ep-meta { display:flex; flex-wrap:wrap; gap:8px; margin-top:1.2rem; }
.admin .ep-meta-chip { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-xs); font-weight:600; color:var(--admin-text-muted); text-decoration:none; padding:6px 12px; border-radius:9999px; background:var(--admin-surface); border:1px solid var(--admin-border); transition:border-color .14s ease, color .14s ease; }
.admin a.ep-meta-chip:hover { border-color:var(--color-primary); color:var(--color-primary); text-decoration:none; }
.admin .ep-meta-chip-static { cursor:default; }

/* Sections */
.admin .ep-section { margin-bottom:2.6rem; }
.admin .ep-section-last { margin-bottom:3.5rem; }
.admin .ep-sec-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:1rem; padding:0 2px; }
.admin .ep-sec-title { font-family:${DISPLAY}; font-size:1.4rem; font-weight:700; letter-spacing:-.01em; color:var(--admin-text); margin:0; }
.admin .ep-sec-meta { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.08em; color:var(--admin-text-subtle); font-weight:700; }
.admin .ep-sec-link { display:inline-flex; align-items:center; gap:5px; font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-primary); text-decoration:none; }
.admin .ep-sec-link:hover { gap:8px; text-decoration:none; }

/* Card base */
.admin .ep-card { background:var(--admin-surface); border:1px solid color-mix(in srgb, var(--color-primary) 9%, var(--admin-border)); border-radius:18px; box-shadow:0 1px 2px rgba(107,45,143,.035), 0 18px 40px -30px rgba(107,45,143,.26); }

/* Vitals */
.admin .ep-vitals { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:.75rem 1.25rem; padding:1rem 1.4rem; }
.admin .ep-vital { display:flex; align-items:center; gap:10px; }
.admin .ep-vital-meta { display:flex; flex-direction:column; }
.admin .ep-vital-label { font-size:.82rem; font-weight:700; color:var(--admin-text); line-height:1.15; }
.admin .ep-vital-sub { font-size:.72rem; color:var(--admin-text-muted); margin-top:1px; }

/* Persona */
.admin .ep-persona { position:relative; padding:1.9rem 2.1rem 1.9rem 2.4rem; }
.admin .ep-persona::before { content:''; position:absolute; left:0; top:1.9rem; bottom:1.9rem; width:3px; border-radius:3px; background:linear-gradient(${PURPLE}, ${GOLD}); }
.admin .ep-persona-mark { position:absolute; top:.4rem; left:1.4rem; font-family:${DISPLAY}; font-size:3rem; color:color-mix(in srgb, var(--color-primary) 22%, #fff); line-height:1; }
.admin .ep-persona-text { margin:0; font-size:1.05rem; line-height:1.7; color:var(--admin-text-secondary); }

/* Workspace */
.admin .ep-workspace { display:flex; flex-direction:column; gap:1.6rem; }
.admin .ep-wsgroup-head { display:flex; align-items:center; gap:8px; font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.09em; font-weight:700; color:var(--color-primary); margin-bottom:.7rem; padding:0 2px; }
.admin .ep-wsgrid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:.8rem; }
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

/* Breakroom */
.admin .ep-break { padding:8px; }
.admin .ep-break-item { display:flex; gap:14px; align-items:flex-start; padding:15px 14px; }
.admin .ep-break-b { border-top:1px solid var(--admin-border); }
.admin .ep-break-ic { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:9px; flex-shrink:0; color:#9a7b1e; background:rgba(212,175,55,.14); }
.admin .ep-break-head { font-family:${DISPLAY}; font-size:1.05rem; font-weight:600; color:var(--color-primary); line-height:1.25; }
.admin .ep-break-body { margin:3px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.admin .ep-break-date { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); flex-shrink:0; }
.admin .ep-empty { display:flex; align-items:center; gap:8px; padding:16px; margin:0; color:var(--admin-text-muted); font-size:var(--admin-text-sm); }

@media (max-width:820px) {
  .admin .ep-cols { grid-template-columns:1fr; }
}
@media (max-width:600px) {
  .admin .ep-hero { flex-direction:column; text-align:center; align-items:center; }
  .admin .ep-name { font-size:2.2rem; }
  .admin .ep-meta { justify-content:center; }
  .admin .ep-persona-mark { display:none; }
}
`
