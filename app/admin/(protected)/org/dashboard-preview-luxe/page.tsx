import Link from 'next/link'
import {
  loadOrgGame, buildQueue, meterCells, Icon, Ring, todayLong,
  type Emp,
} from '@/components/admin/preview/kit'
import type { Meters } from '@/lib/orgMeters'

export const dynamic = 'force-dynamic'

/**
 * LUXE dashboard MOCKUP (Devon, 2026-09-02) — the definitive concept. NOT live.
 *
 * The brief was luxury: restraint, whitespace, hierarchy, micro-detail. Every
 * pixel intentional. Full Royal Glow — Playfair headings, purple #6B2D8F, and
 * gold #D4AF37 used TWICE as a precious accent (the hero hairline + a member's
 * "excellent" ring), never sprayed around. One calm focal hero; only the 3
 * things that need Jill, with the rest tucked behind a native disclosure; a
 * compact team cast strip; a small Breakroom teaser.
 */

const PURPLE = 'var(--color-primary)'
const GOLD = 'var(--color-accent)'
const DISPLAY = 'var(--font-display)'

// Composite health = how this teammate is doing at a glance (morale, momentum,
// performance). Gold is reserved for the truly excellent — that keeps it precious.
function overall(m: Meters): number {
  return Math.round((m.morale.value + m.momentum.value + m.performance.value) / 3)
}
function healthColor(v: number): string {
  if (v >= 85) return GOLD
  if (v >= 55) return PURPLE
  if (v >= 40) return 'var(--admin-warning)'
  return 'var(--admin-danger)'
}

function CastMember({ e, metersFor }: { e: Emp; metersFor: (e: Emp) => Meters }) {
  const isLeader = e.kind !== 'agent'
  const score = isLeader ? null : overall(metersFor(e))
  const color = score === null ? PURPLE : healthColor(score)
  return (
    <Link href={`/admin/org/${e.slug}`} className="lux-member" title={`${e.name} — ${e.role_title || ''}${score !== null ? ` · health ${score}` : ''}`}>
      {score === null ? (
        <span className="lux-leader-disc">{e.emoji || '👤'}</span>
      ) : (
        <Ring value={score} color={color} size={58} stroke={3} track="var(--admin-surface-alt)" showValue={false}>
          <span style={{ fontSize: '1.5rem', lineHeight: 1, opacity: e.status === 'planned' ? 0.5 : 1 }}>{e.emoji || '👤'}</span>
        </Ring>
      )}
      <span className="lux-member-name">{e.name}</span>
    </Link>
  )
}

export default async function LuxePreview() {
  const game = await loadOrgGame(2)
  const queue = buildQueue()
  const primary = queue.filter((q) => q.urgent)
  const rest = queue.filter((q) => !q.urgent)
  const { owner, chief, heads, lore, emojiBySlug, metersFor } = game
  const cast = [owner, chief, ...heads].filter(Boolean) as Emp[]
  const activeHeads = heads.filter((h) => h.status === 'active').length

  const row = (q: (typeof queue)[number], i: number, dim = false) => (
    <Link key={q.page.id} href={q.page.path} className={`lux-row${dim ? ' lux-row-quiet' : ''}`}>
      <span className="lux-row-ic"><Icon name={q.icon} size={19} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="lux-row-top">
          <span className="lux-row-title">{q.page.title}</span>
          <span className="lux-row-count">{q.count}</span>
        </div>
        <p className="lux-row-blurb">{q.blurb}</p>
      </div>
      <span className="lux-row-go"><Icon name="arrow" size={16} /></span>
    </Link>
  )

  return (
    <div className="lux-root">
      <style dangerouslySetInnerHTML={{ __html: LUX_CSS }} />
      <div className="lux-wrap">
        {/* Quiet mockup line + compare */}
        <div className="lux-topbar">
          <span className="lux-tag"><span className="lux-tag-dot" /> Mockup · Luxe</span>
          <nav className="lux-compare">
            <a href="/admin/org/dashboard-preview-playful">Playful</a>
            <a href="/admin/org/dashboard-preview-sleek">Sleek</a>
            <a href="/admin" className="lux-compare-live">Live dashboard</a>
          </nav>
        </div>

        {/* ── Hero: the single focal point ── */}
        <header className="lux-hero">
          <div className="lux-date"><Icon name="spark" size={13} style={{ color: GOLD }} /> {todayLong()}</div>
          <h1 className="lux-hero-title">Good morning, Jill</h1>
          <p className="lux-hero-sub">
            {primary.length} things need you today. Everything else, the team has handled.
          </p>
        </header>

        {/* ── Today: only what needs her ── */}
        <section className="lux-section">
          <div className="lux-sec-head">
            <h2 className="lux-sec-title">Today</h2>
            <span className="lux-sec-meta">Needs you</span>
          </div>
          <div className="lux-card lux-queue">
            {primary.map((q, i) => row(q, i))}
            {rest.length > 0 && (
              <details className="lux-more">
                <summary>
                  <span className="lux-more-label">{rest.length} more in the queue</span>
                  <Icon name="arrow" size={14} className="lux-more-chev" />
                </summary>
                <div className="lux-more-body">
                  {rest.map((q, i) => row(q, i, true))}
                </div>
              </details>
            )}
          </div>
        </section>

        {/* ── The team: a compact, elegant cast ── */}
        <section className="lux-section">
          <div className="lux-sec-head">
            <h2 className="lux-sec-title">The team</h2>
            <span className="lux-sec-meta">{activeHeads} active · rings show health</span>
          </div>
          <div className="lux-card lux-cast">
            {cast.map((e) => <CastMember key={e.id} e={e} metersFor={metersFor} />)}
          </div>
        </section>

        {/* ── Breakroom: a small teaser ── */}
        <section className="lux-section lux-section-last">
          <div className="lux-sec-head">
            <h2 className="lux-sec-title">The Breakroom</h2>
            <Link href="/admin/org" className="lux-sec-link">Open <Icon name="arrow" size={13} /></Link>
          </div>
          <div className="lux-card lux-break">
            {lore.length === 0 ? (
              <p className="lux-break-empty"><Icon name="coffee" size={16} /> Quiet in here today.</p>
            ) : lore.slice(0, 2).map((l, i) => (
              <div key={l.id} className={`lux-break-item${i > 0 ? ' lux-break-item-b' : ''}`}>
                <span className="lux-break-avatars">{(l.involves || []).map((s) => emojiBySlug[s]).filter(Boolean).slice(0, 3).map((em, idx) => (
                  <span key={idx} className="lux-break-av">{em}</span>
                ))}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="lux-break-head">{l.headline}</div>
                  {l.body && <p className="lux-break-body">{l.body}</p>}
                </div>
                <span className="lux-break-date">{l.lore_date}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

const LUX_CSS = `
.admin .lux-wrap { max-width:840px; margin:0 auto; padding:0 4px; }
.admin .lux-topbar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:2.4rem; }
.admin .lux-tag { display:inline-flex; align-items:center; gap:7px; font-size:var(--admin-text-xs); font-weight:600; color:var(--admin-text-subtle); text-transform:uppercase; letter-spacing:.08em; }
.admin .lux-tag-dot { width:6px; height:6px; border-radius:50%; background:${GOLD}; }
.admin .lux-compare { display:flex; align-items:center; gap:4px; }
.admin .lux-compare a { font-size:var(--admin-text-xs); font-weight:600; color:var(--admin-text-muted); text-decoration:none; padding:5px 11px; border-radius:9999px; transition:background .14s ease, color .14s ease; }
.admin .lux-compare a:hover { background:var(--admin-surface-alt); color:var(--admin-text); text-decoration:none; }
.admin .lux-compare-live { color:var(--color-primary) !important; }

/* Hero — dominant and calm, lots of air */
.admin .lux-hero {
  position:relative; text-align:center; padding:4rem 2rem 3.6rem; margin-bottom:3.4rem;
  border-radius:24px; border:1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border));
  background:
    radial-gradient(90% 120% at 50% -20%, color-mix(in srgb, var(--color-primary) 7%, #fff), #fff 70%);
  box-shadow:0 1px 2px rgba(107,45,143,.04), 0 26px 60px -28px rgba(107,45,143,.22);
  overflow:hidden;
}
.admin .lux-hero::before { content:''; position:absolute; top:0; left:15%; right:15%; height:2px; border-radius:2px;
  background:linear-gradient(90deg, transparent, ${GOLD}, transparent); opacity:.9; }
.admin .lux-date { display:inline-flex; align-items:center; gap:7px; font-size:var(--admin-text-xs); font-weight:700;
  text-transform:uppercase; letter-spacing:.16em; color:var(--admin-text-subtle); }
.admin .lux-hero-title { font-family:${DISPLAY}; font-size:3.15rem; font-weight:800; letter-spacing:-.015em;
  color:var(--color-primary); margin:1rem 0 0; line-height:1.02; }
.admin .lux-hero-sub { margin:1.15rem auto 0; font-size:1.12rem; line-height:1.55; color:var(--admin-text-secondary); max-width:40ch; }

/* Sections — real whitespace between them */
.admin .lux-section { margin-bottom:3.4rem; }
.admin .lux-section-last { margin-bottom:4rem; }
.admin .lux-sec-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:1.15rem; padding:0 4px; }
.admin .lux-sec-title { font-family:${DISPLAY}; font-size:1.5rem; font-weight:700; letter-spacing:-.01em; color:var(--admin-text); margin:0; }
.admin .lux-sec-meta { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.08em; color:var(--admin-text-subtle); font-weight:700; }
.admin .lux-sec-link { display:inline-flex; align-items:center; gap:5px; font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-primary); text-decoration:none; }
.admin .lux-sec-link:hover { gap:8px; text-decoration:none; }

/* Card — hairline border, soft layered elevation */
.admin .lux-card {
  background:var(--admin-surface);
  border:1px solid color-mix(in srgb, var(--color-primary) 9%, var(--admin-border));
  border-radius:18px;
  box-shadow:0 1px 2px rgba(107,45,143,.035), 0 18px 40px -30px rgba(107,45,143,.28);
}

/* Queue rows */
.admin .lux-queue { padding:6px; }
.admin .lux-row { display:flex; align-items:center; gap:16px; padding:17px 18px; border-radius:13px; text-decoration:none; transition:background .14s ease; }
.admin .lux-row + .lux-row { border-top:1px solid var(--admin-border); border-radius:0; }
.admin .lux-row:hover { background:color-mix(in srgb, var(--color-primary) 4%, #fff); text-decoration:none; }
.admin .lux-row-ic { display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:11px; flex-shrink:0;
  background:color-mix(in srgb, var(--color-primary) 8%, #fff); color:var(--color-primary);
  border:1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border)); }
.admin .lux-row-top { display:flex; align-items:baseline; gap:10px; }
.admin .lux-row-title { font-size:1.02rem; font-weight:700; color:var(--admin-text); letter-spacing:-.005em; }
.admin .lux-row-count { font-size:var(--admin-text-xs); font-weight:700; color:var(--admin-text-subtle); font-variant-numeric:tabular-nums; }
.admin .lux-row-blurb { margin:3px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); line-height:1.5; }
.admin .lux-row-go { color:var(--admin-text-subtle); opacity:0; transform:translateX(-5px); transition:opacity .14s ease, transform .14s ease; flex-shrink:0; }
.admin .lux-row:hover .lux-row-go { opacity:1; transform:translateX(0); color:var(--color-primary); }
.admin .lux-row-quiet .lux-row-title { font-weight:600; color:var(--admin-text-secondary); }

/* "+N more" native disclosure */
.admin .lux-more { border-top:1px solid var(--admin-border); }
.admin .lux-more > summary { list-style:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px;
  padding:14px; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-muted); transition:color .14s ease; }
.admin .lux-more > summary::-webkit-details-marker { display:none; }
.admin .lux-more > summary:hover { color:var(--color-primary); }
.admin .lux-more-chev { transition:transform .2s ease; }
.admin .lux-more[open] .lux-more-chev { transform:rotate(90deg); }
.admin .lux-more[open] > summary { color:var(--color-primary); }
.admin .lux-more-body { padding-top:2px; }
.admin .lux-more-body .lux-row:first-child { border-top:1px solid var(--admin-border); border-radius:0; }

/* Team — compact cast strip, avatar inside a health ring */
.admin .lux-cast { display:flex; flex-wrap:wrap; gap:1.6rem 1.5rem; justify-content:center; padding:2rem 1.5rem; }
.admin .lux-member { display:flex; flex-direction:column; align-items:center; gap:9px; width:74px; text-decoration:none; transition:transform .16s ease; }
.admin .lux-member:hover { transform:translateY(-3px); text-decoration:none; }
.admin .lux-leader-disc { width:58px; height:58px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; border-radius:50%;
  background:radial-gradient(circle at 30% 25%, #fff, var(--admin-accent-soft)); border:1px solid color-mix(in srgb, var(--color-primary) 22%, var(--admin-border));
  box-shadow:0 4px 12px -4px rgba(107,45,143,.25); }
.admin .lux-member-name { font-size:var(--admin-text-xs); font-weight:600; color:var(--admin-text); text-align:center; letter-spacing:.01em; }

/* Breakroom teaser */
.admin .lux-break { padding:6px 6px; }
.admin .lux-break-item { display:flex; align-items:flex-start; gap:14px; padding:16px 16px; }
.admin .lux-break-item-b { border-top:1px solid var(--admin-border); }
.admin .lux-break-avatars { display:flex; flex-shrink:0; padding-top:1px; }
.admin .lux-break-av { width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-size:1rem; border-radius:50%;
  background:#fff; border:1px solid var(--admin-border); margin-left:-8px; box-shadow:0 2px 5px rgba(107,45,143,.08); }
.admin .lux-break-av:first-child { margin-left:0; }
.admin .lux-break-head { font-family:${DISPLAY}; font-size:1.05rem; font-weight:600; color:var(--color-primary); line-height:1.25; }
.admin .lux-break-body { margin:3px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); line-height:1.5;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.admin .lux-break-date { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); font-variant-numeric:tabular-nums; flex-shrink:0; padding-top:2px; }
.admin .lux-break-empty { display:flex; align-items:center; gap:8px; padding:20px; margin:0; color:var(--admin-text-muted); font-size:var(--admin-text-sm); }

@media (max-width:640px) {
  .admin .lux-hero-title { font-size:2.3rem; }
  .admin .lux-break-date { display:none; }
}
`
