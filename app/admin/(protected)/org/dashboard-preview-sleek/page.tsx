import Link from 'next/link'
import {
  loadOrgGame, buildQueue, meterCells, Icon, Ring, CompareBar, todayLong,
  type Emp,
} from '@/components/admin/preview/kit'
import type { Meters } from '@/lib/orgMeters'

export const dynamic = 'force-dynamic'

/**
 * SLEEK dashboard MOCKUP (Devon, 2026-09-02) — NOT the live dashboard.
 * Vibe: Linear/Vercel. Restraint, generous space, crisp typographic hierarchy,
 * one confident accent (Royal Glow purple), subtle depth. Premium through calm.
 */

const PURPLE = 'var(--color-primary)'
const DISPLAY = 'var(--font-display)'

const statusDot = (s: Emp['status']) =>
  s === 'active' ? 'var(--admin-success)' : s === 'planned' ? 'var(--admin-text-subtle)' : 'var(--admin-warning)'

function MemberCard({ e, metersFor }: { e: Emp; metersFor: (e: Emp) => Meters }) {
  const cells = e.kind === 'agent' ? meterCells(metersFor(e)) : null
  return (
    <Link href={`/admin/org/${e.slug}`} className="sk-card sk-member" style={{ opacity: e.status === 'planned' ? 0.66 : 1 }}>
      <div className="sk-member-head">
        <span className="sk-avatar">{e.emoji || '👤'}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="sk-member-name">{e.name}</div>
          <div className="sk-member-role">{e.role_title || ''}</div>
        </div>
        <span className="sk-status" style={{ background: statusDot(e.status) }} title={e.status} />
      </div>
      {cells && (
        <div className="sk-meter-row">
          {cells.map((c) => (
            <div key={c.key} className="sk-meter" title={`${c.label}: ${c.value}`}>
              <Ring value={c.value} color={PURPLE} track="var(--admin-surface-alt)" size={40} stroke={3} valueColor="var(--admin-text)" />
              <span className="sk-meter-label">{c.label}</span>
            </div>
          ))}
        </div>
      )}
    </Link>
  )
}

export default async function SleekPreview() {
  const game = await loadOrgGame(4)
  const queue = buildQueue()
  const urgentCount = queue.filter((q) => q.urgent).length
  const { owner, chief, heads, lore, emojiBySlug, metersFor } = game
  const roster = [owner, chief, ...heads].filter(Boolean) as Emp[]

  return (
    <div className="sk-root">
      <style dangerouslySetInnerHTML={{ __html: SK_CSS }} />
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <CompareBar current="sleek" />

        <div className="sk-banner">
          <span className="sk-dot" /> MOCKUP · “Sleek” concept — the live dashboard is untouched. Queue counts are samples; the team + Breakroom are live.
        </div>

        {/* ── Hero ── */}
        <header className="sk-hero">
          <div className="sk-eyebrow">{todayLong()}</div>
          <h1 className="sk-hero-title">Good morning, Jill</h1>
          <p className="sk-hero-sub">
            <strong style={{ color: 'var(--admin-text)' }}>{urgentCount} things need you today.</strong>
            <span style={{ color: 'var(--admin-text-muted)' }}> The team handled the rest overnight.</span>
          </p>
        </header>

        {/* ── Today queue ── */}
        <section className="sk-section">
          <div className="sk-sec-head">
            <h2 className="sk-sec-title">Today</h2>
            <span className="sk-sec-meta">{queue.length} in queue · {urgentCount} need you</span>
          </div>
          <div className="sk-card sk-queue">
            {queue.map((q, i) => (
              <Link key={q.page.id} href={q.page.path} className="sk-qrow">
                {q.urgent ? <span className="sk-qflag" title="Needs you" /> : <span className="sk-qflag sk-qflag-off" />}
                <span className="sk-qnum">{String(i + 1).padStart(2, '0')}</span>
                <span className="sk-qic"><Icon name={q.icon} size={18} /></span>
                <span className="sk-qtitle">{q.page.title}</span>
                <span className="sk-qblurb">{q.blurb}</span>
                <span className="sk-qcount">{q.count}</span>
                <span className="sk-qarrow"><Icon name="arrow" size={16} /></span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── The team ── */}
        <section className="sk-section">
          <div className="sk-sec-head">
            <h2 className="sk-sec-title">The team</h2>
            <span className="sk-sec-meta">{heads.filter((h) => h.status === 'active').length} active · meters live</span>
          </div>
          <div className="sk-member-grid">
            {roster.map((e) => <MemberCard key={e.id} e={e} metersFor={metersFor} />)}
          </div>
        </section>

        {/* ── Breakroom ── */}
        <section className="sk-section" style={{ marginBottom: 'var(--admin-space-6)' }}>
          <div className="sk-sec-head">
            <h2 className="sk-sec-title">The Breakroom</h2>
            <span className="sk-sec-meta">Internal only</span>
          </div>
          <div className="sk-timeline">
            {lore.length === 0 ? (
              <div className="sk-card" style={{ padding: 'var(--admin-space-4)', color: 'var(--admin-text-muted)', fontSize: 'var(--admin-text-sm)' }}>No lore yet.</div>
            ) : lore.map((l) => (
              <div key={l.id} className="sk-tl-item">
                <span className="sk-tl-node" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="sk-tl-meta">
                    <span className="sk-tl-date">{l.lore_date}</span>
                    <span className="sk-tl-avatars">{(l.involves || []).map((s) => emojiBySlug[s]).filter(Boolean).slice(0, 4).join(' ')}</span>
                  </div>
                  <div className="sk-tl-head">{l.headline}</div>
                  {l.body && <p className="sk-tl-body">{l.body}</p>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'var(--admin-space-4)' }}>
            <Link href="/admin/org" className="sk-morelink">Full team + Breakroom <Icon name="arrow" size={14} /></Link>
          </div>
        </section>
      </div>
    </div>
  )
}

const SK_CSS = `
.admin .sk-banner {
  display:flex; align-items:center; gap:8px; padding:9px 14px; margin-bottom:var(--admin-space-6);
  border-radius:8px; background:var(--admin-surface); border:1px solid var(--admin-border);
  color:var(--admin-text-muted); font-size:var(--admin-text-xs); font-weight:500;
}
.admin .sk-dot, .admin .sk-banner .sk-dot { width:7px; height:7px; border-radius:50%; background:var(--admin-warning); flex-shrink:0; }
.admin .sk-hero { padding:1.2rem 0 1.8rem; margin-bottom:var(--admin-space-5); border-bottom:1px solid var(--admin-border); }
.admin .sk-eyebrow { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.12em; color:var(--admin-text-subtle); font-weight:700; }
.admin .sk-hero-title { font-family:${DISPLAY}; font-size:2.5rem; font-weight:700; letter-spacing:-.02em; color:var(--admin-text); margin:.55rem 0 0; line-height:1.05; }
.admin .sk-hero-sub { margin:.7rem 0 0; font-size:1.05rem; line-height:1.5; }
.admin .sk-section { margin-bottom:var(--admin-space-6); }
.admin .sk-sec-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:var(--admin-space-4); }
.admin .sk-sec-title { font-family:${DISPLAY}; font-size:1.35rem; font-weight:700; color:var(--admin-text); margin:0; letter-spacing:-.01em; }
.admin .sk-sec-meta { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); font-weight:500; }
.admin .sk-card { background:var(--admin-surface); border:1px solid var(--admin-border); border-radius:12px; box-shadow:0 1px 2px rgba(24,24,27,.03); }
.admin .sk-queue { overflow:hidden; }
.admin .sk-qrow {
  display:grid; grid-template-columns:3px 26px 34px minmax(120px,auto) 1fr auto 20px;
  align-items:center; gap:14px; padding:14px 18px 14px 15px; text-decoration:none;
  border-top:1px solid var(--admin-border); transition:background .13s ease;
}
.admin .sk-qrow:first-child { border-top:none; }
.admin .sk-qrow:hover { background:var(--admin-surface-alt); text-decoration:none; }
.admin .sk-qflag { width:3px; height:26px; border-radius:2px; background:var(--color-primary); }
.admin .sk-qflag-off { background:transparent; }
.admin .sk-qnum { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); font-variant-numeric:tabular-nums; font-weight:600; text-align:center; }
.admin .sk-qic { display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:8px; background:var(--admin-surface-alt); color:var(--admin-text-muted); }
.admin .sk-qrow:hover .sk-qic { color:var(--color-primary); }
.admin .sk-qtitle { font-size:var(--admin-text-base); font-weight:600; color:var(--admin-text); white-space:nowrap; }
.admin .sk-qblurb { font-size:var(--admin-text-sm); color:var(--admin-text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.admin .sk-qcount { font-size:var(--admin-text-xs); font-weight:700; color:var(--admin-text-muted); font-variant-numeric:tabular-nums; background:var(--admin-surface-alt); padding:3px 9px; border-radius:6px; white-space:nowrap; }
.admin .sk-qarrow { color:var(--admin-text-subtle); opacity:0; transform:translateX(-4px); transition:opacity .13s ease, transform .13s ease; }
.admin .sk-qrow:hover .sk-qarrow { opacity:1; transform:translateX(0); color:var(--color-primary); }
.admin .sk-member-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:var(--admin-space-3); }
.admin .sk-member { flex-direction:column; padding:16px; gap:14px; transition:transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
.admin .sk-member:hover { transform:translateY(-2px); box-shadow:0 10px 26px rgba(24,24,27,.08); border-color:var(--admin-border-strong); text-decoration:none; }
.admin .sk-member-head { display:flex; align-items:center; gap:11px; width:100%; }
.admin .sk-avatar { width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:1.3rem; border-radius:9px; background:var(--admin-surface-alt); border:1px solid var(--admin-border); flex-shrink:0; }
.admin .sk-member-name { font-size:var(--admin-text-base); font-weight:600; color:var(--admin-text); line-height:1.2; }
.admin .sk-member-role { font-size:var(--admin-text-xs); color:var(--admin-text-muted); margin-top:1px; }
.admin .sk-status { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.admin .sk-meter-row { display:flex; gap:10px; width:100%; padding-top:12px; border-top:1px solid var(--admin-border); }
.admin .sk-meter { display:flex; flex-direction:column; align-items:center; gap:5px; flex:1; }
.admin .sk-meter-label { font-size:.6rem; text-transform:uppercase; letter-spacing:.04em; color:var(--admin-text-subtle); font-weight:700; }
.admin .sk-timeline { display:flex; flex-direction:column; }
.admin .sk-tl-item { display:flex; gap:16px; padding:0 0 18px 4px; position:relative; }
.admin .sk-tl-item:not(:last-child)::before { content:''; position:absolute; left:8px; top:14px; bottom:0; width:1px; background:var(--admin-border); }
.admin .sk-tl-node { width:9px; height:9px; border-radius:50%; background:var(--color-primary); flex-shrink:0; margin-top:5px; z-index:1; box-shadow:0 0 0 3px var(--admin-bg); }
.admin .sk-tl-meta { display:flex; align-items:center; gap:10px; }
.admin .sk-tl-date { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); font-variant-numeric:tabular-nums; }
.admin .sk-tl-avatars { font-size:.95rem; }
.admin .sk-tl-head { font-size:var(--admin-text-base); font-weight:600; color:var(--admin-text); margin-top:3px; }
.admin .sk-tl-body { margin:4px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); line-height:1.5; }
.admin .sk-morelink { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-sm); font-weight:600; color:var(--color-primary); text-decoration:none; }
.admin .sk-morelink:hover { gap:9px; text-decoration:none; }
@media (max-width:640px) {
  .admin .sk-qrow { grid-template-columns:3px 24px 1fr auto; }
  .admin .sk-qic, .admin .sk-qblurb { display:none; }
}
`
