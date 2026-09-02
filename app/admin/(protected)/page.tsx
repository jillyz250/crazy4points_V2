import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/utils/supabase/server'
import { computeMeters } from '@/lib/orgMeters'
import { buildQueue, meterCells, Icon, Ring, todayLong } from '@/components/admin/preview/kit'
import Notepad from '@/components/admin/dashboard/Notepad'
import type { DashboardNote } from '@/app/admin/(protected)/notes-actions'

export const dynamic = 'force-dynamic'

const PURPLE = 'var(--color-primary)'
const GOLD = 'var(--color-accent)'
const DISPLAY = 'var(--font-display)'

type Emp = {
  id: string; slug: string; name: string; role_title: string | null
  kind: 'owner' | 'chief' | 'agent'; emoji: string | null; image_url: string | null
  status: string; responsibilities: string[] | null
}

function overall(m: ReturnType<typeof computeMeters>): number {
  return Math.round((m.morale.value + m.momentum.value + m.performance.value) / 3)
}
const healthColor = (v: number) => (v >= 85 ? GOLD : v >= 55 ? PURPLE : v >= 40 ? 'var(--admin-warning)' : 'var(--admin-danger)')

async function tableCount(table: string, activeOnly = false): Promise<number | null> {
  try {
    const db = createAdminClient()
    const base = db.from(table).select('*', { count: 'exact', head: true })
    const { count } = await (activeOnly ? base.eq('active', true) : base)
    return count ?? null
  } catch { return null }
}

export default async function AdminDashboard() {
  const db = createAdminClient()
  const [{ data: empData }, { data: logData }, { data: notesData }, alertsCount, programsCount, subsCount] = await Promise.all([
    db.from('employees').select('id, slug, name, role_title, kind, emoji, image_url, status, responsibilities'),
    db.from('employee_logs').select('employee_id, type, created_at'),
    db.from('dashboard_notes').select('id, body, sent_to_takes, created_at, updated_at').order('created_at', { ascending: false }).limit(50),
    tableCount('alerts'),
    tableCount('programs'),
    tableCount('subscribers', true),
  ])
  const emps = (empData ?? []) as Emp[]
  const notes = (notesData ?? []) as DashboardNote[]
  const logsBy: Record<string, { type: string; created_at: string }[]> = {}
  for (const l of (logData ?? []) as { employee_id: string; type: string; created_at: string }[]) (logsBy[l.employee_id] ||= []).push(l)

  const heads = emps
    .filter((e) => e.kind === 'agent')
    .sort((a, b) => (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) || a.name.localeCompare(b.name))

  const queue = buildQueue()
  const primary = queue.filter((q) => q.urgent)
  const rest = queue.filter((q) => !q.urgent)

  const pulse: { label: string; value: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
    { label: 'Alerts live', value: alertsCount != null ? alertsCount.toLocaleString() : '—', icon: 'bell' },
    { label: 'Programs tracked', value: programsCount != null ? programsCount.toLocaleString() : '—', icon: 'database' },
    { label: 'Subscribers', value: subsCount != null ? subsCount.toLocaleString() : '—', icon: 'users' },
    { label: 'Accuracy', value: 'Healthy', icon: 'shield' },
  ]

  const queueRow = (q: (typeof queue)[number], dim = false) => (
    <Link key={q.page.id} href={q.page.path} className={`dh-row${dim ? ' dh-row-quiet' : ''}`}>
      <span className="dh-row-ic"><Icon name={q.icon} size={18} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="dh-row-top">
          <span className="dh-row-title">{q.page.title}</span>
          <span className="dh-row-count">{q.count}</span>
        </div>
        <p className="dh-row-blurb">{q.blurb}</p>
      </div>
      <span className="dh-row-go"><Icon name="arrow" size={15} /></span>
    </Link>
  )

  return (
    <div className="dh-root">
      <style dangerouslySetInnerHTML={{ __html: DH_CSS }} />
      <div className="dh-wrap">
        {/* ── Global health band ── */}
        <div className="dh-pulse">
          <span className="dh-pulse-tag"><Icon name="pulse" size={15} /> Pulse</span>
          <div className="dh-pulse-stats">
            {pulse.map((p) => (
              <span key={p.label} className="dh-stat">
                <span className="dh-stat-ic"><Icon name={p.icon} size={14} /></span>
                <span className="dh-stat-val">{p.value}</span>
                <span className="dh-stat-label">{p.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Jill hero ── */}
        <header className="dh-hero">
          <div className="dh-jill-frame">
            <span className="dh-jill">
              <Image src="/images/jill_photo.jpg" alt="Jill" fill sizes="96px" style={{ objectFit: 'cover' }} priority />
            </span>
          </div>
          <div className="dh-hero-body">
            <div className="dh-date">{todayLong()}</div>
            <h1 className="dh-hello">Good morning, Jill</h1>
            <div className="dh-whoami">Jill &middot; Founder &amp; CEO</div>
          </div>
        </header>

        {/* ── What needs me + Notepad ── */}
        <div className="dh-cols">
          <section>
            <div className="dh-sec-head"><h2 className="dh-sec-title">What needs me</h2><span className="dh-sec-meta">{primary.length} today</span></div>
            <div className="dh-card dh-queue">
              {primary.map((q) => queueRow(q))}
              {rest.length > 0 && (
                <details className="dh-more">
                  <summary><span>{rest.length} more in the queue</span><Icon name="arrow" size={14} className="dh-more-chev" /></summary>
                  <div>{rest.map((q) => queueRow(q, true))}</div>
                </details>
              )}
            </div>
          </section>

          <section>
            <div className="dh-sec-head"><h2 className="dh-sec-title">Notepad</h2><Link href="/admin/notepad" className="dh-sec-link">Open <Icon name="arrow" size={13} /></Link></div>
            <div className="dh-card dh-notepad">
              <Notepad initialNotes={notes} compact />
            </div>
          </section>
        </div>

        {/* ── The team ── */}
        <section className="dh-section">
          <div className="dh-sec-head"><h2 className="dh-sec-title">The team</h2><Link href="/admin/org" className="dh-sec-link">Org chart <Icon name="arrow" size={13} /></Link></div>
          <div className="dh-card dh-team">
            {heads.map((e) => {
              const score = overall(computeMeters(e as unknown as { slug: string; kind: 'agent'; status: string; responsibilities?: string[] | null }, logsBy[e.id] || []))
              return (
                <Link key={e.id} href={`/admin/org/${e.slug}`} className="dh-member" title={`${e.name} — ${e.role_title || ''} · health ${score}`} style={{ opacity: e.status === 'planned' ? 0.6 : 1 }}>
                  <Ring value={score} color={healthColor(score)} size={64} stroke={3} track="var(--admin-surface-alt)" showValue={false}>
                    {e.image_url ? (
                      <span className="dh-member-av"><Image src={e.image_url} alt={e.name} fill sizes="52px" style={{ objectFit: 'cover' }} /></span>
                    ) : (
                      <span className="dh-member-av dh-member-av-fallback">{e.emoji || '👤'}</span>
                    )}
                  </Ring>
                  <span className="dh-member-name">{e.name}</span>
                  <span className="dh-member-role">{e.role_title || ''}</span>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

const DH_CSS = `
.admin .dh-wrap { max-width:1040px; margin:0 auto; padding:0 4px; }

/* Pulse band */
.admin .dh-pulse { display:flex; align-items:center; gap:1.4rem; flex-wrap:wrap; padding:14px 20px; margin-bottom:2.2rem;
  border-radius:14px; border:1px solid color-mix(in srgb, var(--color-primary) 10%, var(--admin-border));
  background:linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 6%, #fff), #fff 60%);
  box-shadow:0 1px 2px rgba(107,45,143,.04); }
.admin .dh-pulse-tag { display:inline-flex; align-items:center; gap:7px; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:var(--color-primary); flex-shrink:0; }
.admin .dh-pulse-stats { display:flex; align-items:center; gap:1.6rem; flex-wrap:wrap; }
.admin .dh-stat { display:inline-flex; align-items:baseline; gap:7px; }
.admin .dh-stat-ic { color:var(--admin-text-subtle); position:relative; top:2px; }
.admin .dh-stat-val { font-size:1.05rem; font-weight:800; color:var(--admin-text); font-variant-numeric:tabular-nums; letter-spacing:-.01em; }
.admin .dh-stat-label { font-size:var(--admin-text-xs); color:var(--admin-text-muted); text-transform:uppercase; letter-spacing:.05em; font-weight:600; }

/* Jill hero */
.admin .dh-hero { display:flex; align-items:center; gap:1.4rem; margin-bottom:2.6rem; }
.admin .dh-jill-frame { flex-shrink:0; padding:3px; border-radius:50%; background:linear-gradient(150deg, ${GOLD}, color-mix(in srgb, ${GOLD} 30%, #fff)); box-shadow:0 10px 26px -10px rgba(107,45,143,.4); }
.admin .dh-jill { position:relative; display:block; width:88px; height:88px; border-radius:50%; overflow:hidden; background:var(--admin-accent-soft); border:2px solid #fff; }
.admin .dh-date { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.14em; color:var(--admin-text-subtle); font-weight:700; }
.admin .dh-hello { font-family:${DISPLAY}; font-size:2.6rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); margin:.35rem 0 0; line-height:1.02; }
.admin .dh-whoami { font-size:1rem; color:var(--admin-text-secondary); margin-top:.3rem; font-weight:500; }

/* Sections */
.admin .dh-section { margin-bottom:3rem; }
.admin .dh-cols { display:grid; grid-template-columns:1.15fr .85fr; gap:1.5rem; margin-bottom:3rem; align-items:start; }
.admin .dh-sec-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:1rem; padding:0 2px; }
.admin .dh-sec-title { font-family:${DISPLAY}; font-size:1.4rem; font-weight:700; letter-spacing:-.01em; color:var(--admin-text); margin:0; }
.admin .dh-sec-meta { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.08em; color:var(--admin-text-subtle); font-weight:700; }
.admin .dh-sec-link { display:inline-flex; align-items:center; gap:5px; font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-primary); text-decoration:none; }
.admin .dh-sec-link:hover { gap:8px; text-decoration:none; }

/* Card */
.admin .dh-card { background:var(--admin-surface); border:1px solid color-mix(in srgb, var(--color-primary) 9%, var(--admin-border)); border-radius:18px; box-shadow:0 1px 2px rgba(107,45,143,.035), 0 18px 40px -30px rgba(107,45,143,.26); }

/* Queue */
.admin .dh-queue { padding:6px; }
.admin .dh-row { display:flex; align-items:center; gap:15px; padding:15px 16px; border-radius:13px; text-decoration:none; transition:background .14s ease; }
.admin .dh-row + .dh-row { border-top:1px solid var(--admin-border); border-radius:0; }
.admin .dh-row:hover { background:color-mix(in srgb, var(--color-primary) 4%, #fff); text-decoration:none; }
.admin .dh-row-ic { display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:11px; flex-shrink:0; color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border)); }
.admin .dh-row-top { display:flex; align-items:baseline; gap:10px; }
.admin .dh-row-title { font-size:1rem; font-weight:700; color:var(--admin-text); }
.admin .dh-row-count { font-size:var(--admin-text-xs); font-weight:700; color:var(--admin-text-subtle); font-variant-numeric:tabular-nums; }
.admin .dh-row-blurb { margin:3px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); line-height:1.5; }
.admin .dh-row-go { color:var(--admin-text-subtle); opacity:0; transform:translateX(-5px); transition:opacity .14s ease, transform .14s ease; flex-shrink:0; }
.admin .dh-row:hover .dh-row-go { opacity:1; transform:translateX(0); color:var(--color-primary); }
.admin .dh-row-quiet .dh-row-title { font-weight:600; color:var(--admin-text-secondary); }
.admin .dh-more { border-top:1px solid var(--admin-border); }
.admin .dh-more > summary { list-style:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; padding:13px; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-muted); }
.admin .dh-more > summary::-webkit-details-marker { display:none; }
.admin .dh-more > summary:hover { color:var(--color-primary); }
.admin .dh-more-chev { transition:transform .2s ease; }
.admin .dh-more[open] .dh-more-chev { transform:rotate(90deg); }
.admin .dh-more[open] > summary { color:var(--color-primary); }
.admin .dh-more .dh-row:first-child { border-top:1px solid var(--admin-border); border-radius:0; }

/* Notepad host */
.admin .dh-notepad { padding:1.25rem; }

/* Team */
.admin .dh-team { display:flex; flex-wrap:wrap; gap:1.6rem 1.4rem; justify-content:flex-start; padding:2rem 1.8rem; }
.admin .dh-member { display:flex; flex-direction:column; align-items:center; gap:8px; width:96px; text-decoration:none; transition:transform .16s ease; }
.admin .dh-member:hover { transform:translateY(-3px); text-decoration:none; }
.admin .dh-member-av { position:relative; width:52px; height:52px; border-radius:50%; overflow:hidden; display:block; }
.admin .dh-member-av-fallback { display:flex; align-items:center; justify-content:center; font-size:1.5rem; background:radial-gradient(circle at 30% 25%, #fff, var(--admin-accent-soft)); }
.admin .dh-member-name { font-size:var(--admin-text-sm); font-weight:700; color:var(--admin-text); text-align:center; line-height:1.15; }
.admin .dh-member-role { font-size:var(--admin-text-xs); color:var(--admin-text-muted); text-align:center; line-height:1.2; }

@media (max-width:820px) { .admin .dh-cols { grid-template-columns:1fr; } }
`
