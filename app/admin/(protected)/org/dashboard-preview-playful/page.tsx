import Link from 'next/link'
import { Badge } from '@/components/admin/ui/Badge'
import {
  loadOrgGame, buildQueue, meterCells, Icon, Ring, CompareBar, todayLong,
  type Emp,
} from '@/components/admin/preview/kit'
import type { Meters } from '@/lib/orgMeters'

export const dynamic = 'force-dynamic'

/**
 * PLAYFUL dashboard MOCKUP (Devon, 2026-09-02) — NOT the live dashboard.
 * Vibe: alive, warm, unmistakably crazy4points. Royal Glow purple + gold,
 * Playfair display headings, the team + lore as the star, gentle motion.
 */

const PURPLE = 'var(--color-primary)'
const GOLD = 'var(--color-accent)'
const DISPLAY = 'var(--font-display)'

// Per-queue color identity (soft bg + strong fg).
const TINT: Record<string, { fg: string; bg: string }> = {
  triage: { fg: 'var(--admin-info)', bg: 'var(--admin-info-soft)' },
  drafts: { fg: 'var(--admin-accent)', bg: 'var(--admin-accent-soft)' },
  'data-integrity': { fg: 'var(--admin-danger)', bg: 'var(--admin-danger-soft)' },
  errors: { fg: 'var(--admin-warning)', bg: 'var(--admin-warning-soft)' },
  'fact-checks': { fg: 'var(--admin-success)', bg: 'var(--admin-success-soft)' },
  newsletter: { fg: '#9a7b1e', bg: 'rgba(212,175,55,.16)' },
}

function TeamCard({ e, metersFor, hero }: { e: Emp; metersFor: (e: Emp) => Meters; hero?: boolean }) {
  const planned = e.status === 'planned'
  const cells = e.kind === 'agent' ? meterCells(metersFor(e)) : null
  return (
    <Link href={`/admin/org/${e.slug}`} className="pf-card pf-teamcard" style={{ opacity: planned ? 0.72 : 1, gridColumn: hero ? '1 / -1' : undefined }}>
      <div className="pf-avatar" style={{ fontSize: hero ? '2.6rem' : '2.1rem' }}>{e.emoji || '👤'}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: DISPLAY, fontSize: hero ? '1.5rem' : '1.15rem', fontWeight: 700, color: PURPLE, lineHeight: 1.1 }}>{e.name}</span>
          <Badge tone={e.status === 'active' ? 'success' : e.status === 'planned' ? 'neutral' : 'warning'}>{e.status}</Badge>
        </div>
        <div style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-muted)', marginTop: 2 }}>{e.role_title || ''}</div>
        {cells && (
          <div style={{ display: 'flex', gap: hero ? 18 : 12, marginTop: 12, flexWrap: 'wrap' }}>
            {cells.map((c) => (
              <div key={c.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${c.label}: ${c.value}`}>
                <Ring value={c.value} color={c.color} size={hero ? 50 : 44} stroke={hero ? 5 : 4}>
                  <span style={{ fontSize: hero ? '1.1rem' : '.95rem' }}>{c.emoji}</span>
                </Ring>
                <span style={{ fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--admin-text-subtle)', fontWeight: 700 }}>{c.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

export default async function PlayfulPreview() {
  const game = await loadOrgGame(4)
  const queue = buildQueue()
  const urgentCount = queue.filter((q) => q.urgent).length
  const { owner, chief, heads, lore, emojiBySlug, metersFor } = game

  return (
    <div className="pf-root">
      <style dangerouslySetInnerHTML={{ __html: PF_CSS }} />
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <CompareBar current="playful" />

        {/* Mockup banner */}
        <div className="pf-banner">
          <Icon name="spark" size={16} />
          <strong>MOCKUP — “Playful” concept.</strong>
          <span style={{ color: 'var(--admin-text-muted)', fontWeight: 500 }}>The live dashboard is untouched. Queue counts are samples; the team + Breakroom are live.</span>
        </div>

        {/* ── Hero ── */}
        <header className="pf-hero">
          <div className="pf-hero-glow" aria-hidden="true" />
          <div style={{ position: 'relative' }}>
            <div className="pf-datepill"><Icon name="sun" size={14} /> {todayLong()}</div>
            <h1 className="pf-hero-title">Good morning, Jill<span className="pf-hero-star"><Icon name="spark" size={30} /></span></h1>
            <p className="pf-hero-sub">
              <strong style={{ color: PURPLE }}>{urgentCount} things need you today.</strong> The team handled the rest while you slept — everything else is calm and glowing.
            </p>
          </div>
        </header>

        {/* ── Today queue ── */}
        <section className="pf-section">
          <div className="pf-sec-head">
            <span className="pf-sec-ic" style={{ background: 'var(--admin-accent-soft)', color: PURPLE }}><Icon name="sun" size={18} /></span>
            <div>
              <h2 className="pf-sec-title">Today</h2>
              <p className="pf-sec-sub">One list, most important first. Clear these and you’re done.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 'var(--admin-space-3)' }}>
            {queue.map((q, i) => {
              const tint = TINT[q.page.id] ?? { fg: PURPLE, bg: 'var(--admin-accent-soft)' }
              return (
                <Link key={q.page.id} href={q.page.path} className={`pf-card pf-row${q.urgent ? ' pf-row-urgent' : ''}`}>
                  <span className="pf-rank">{i + 1}</span>
                  <span className="pf-row-ic" style={{ background: tint.bg, color: tint.fg }}><Icon name={q.icon} size={20} /></span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <span className="pf-row-title">{q.page.title}</span>
                      <span className="pf-count" style={{ color: tint.fg, background: tint.bg }}>{q.count}</span>
                      {q.urgent && <span className="pf-urgent-tag"><Icon name="flag" size={11} /> needs you</span>}
                    </div>
                    <p className="pf-row-blurb">{q.blurb}</p>
                  </div>
                  <span className="pf-action">{q.action}<Icon name="arrow" size={15} /></span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── The team (the star) ── */}
        <section className="pf-section">
          <div className="pf-sec-head">
            <span className="pf-sec-ic" style={{ background: 'rgba(212,175,55,.16)', color: '#9a7b1e' }}><Icon name="users" size={18} /></span>
            <div>
              <h2 className="pf-sec-title">The team</h2>
              <p className="pf-sec-sub">Your AI crew, live. Meters run on real activity — click anyone to open their desk.</p>
            </div>
          </div>

          {/* Jill + Morgan spotlight */}
          <div className="pf-team-grid" style={{ marginBottom: 'var(--admin-space-4)' }}>
            {owner && <TeamCard e={owner} metersFor={metersFor} hero />}
            {chief && <TeamCard e={chief} metersFor={metersFor} />}
          </div>
          {/* Department heads */}
          <div className="pf-team-grid">
            {heads.map((h) => <TeamCard key={h.id} e={h} metersFor={metersFor} />)}
          </div>
        </section>

        {/* ── Breakroom ── */}
        <section className="pf-section" style={{ marginBottom: 'var(--admin-space-6)' }}>
          <div className="pf-sec-head">
            <span className="pf-sec-ic" style={{ background: 'rgba(212,175,55,.16)', color: '#9a7b1e' }}><Icon name="coffee" size={18} /></span>
            <div>
              <h2 className="pf-sec-title">The Breakroom</h2>
              <p className="pf-sec-sub">Office lore. Internal only — never leaves the building.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 'var(--admin-space-3)' }}>
            {lore.length === 0 ? (
              <div className="pf-card" style={{ padding: 'var(--admin-space-4)', color: 'var(--admin-text-muted)' }}>The office has been suspiciously well-behaved. No lore yet.</div>
            ) : lore.map((l) => (
              <div key={l.id} className="pf-card pf-lore">
                <div className="pf-lore-avatars">{(l.involves || []).map((s) => emojiBySlug[s]).filter(Boolean).slice(0, 4).map((em, idx) => (
                  <span key={idx} className="pf-lore-av">{em}</span>
                ))}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <strong style={{ fontFamily: DISPLAY, fontSize: '1.05rem', color: PURPLE }}>{l.headline}</strong>
                    <span className="pf-lore-date">{l.lore_date}</span>
                  </div>
                  {l.body && <p className="pf-row-blurb" style={{ marginTop: 6 }}>{l.body}</p>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'var(--admin-space-3)' }}>
            <Link href="/admin/org" className="pf-morelink">See the full team + Breakroom <Icon name="arrow" size={14} /></Link>
          </div>
        </section>
      </div>
    </div>
  )
}

// Scoped styles (prefix pf-). Selectors lead with .admin to beat the admin base.
const PF_CSS = `
.admin .pf-root { --pf-gold:${GOLD}; --pf-purple:${PURPLE}; }
.admin .pf-banner {
  display:flex; align-items:center; gap:10px; flex-wrap:wrap;
  padding:10px 16px; margin-bottom:var(--admin-space-5); border-radius:var(--admin-radius);
  background:linear-gradient(90deg, var(--admin-accent-soft), rgba(212,175,55,.12));
  border:1px solid var(--admin-border); color:var(--admin-text); font-size:var(--admin-text-sm);
}
.admin .pf-banner strong { color:var(--pf-purple); }
.admin .pf-hero {
  position:relative; overflow:hidden; padding:2.6rem 2.2rem; margin-bottom:var(--admin-space-6);
  border-radius:20px; border:1px solid var(--admin-border);
  background:
    radial-gradient(120% 140% at 100% 0%, rgba(212,175,55,.16), transparent 55%),
    linear-gradient(135deg, var(--admin-accent-soft), var(--admin-surface) 72%);
  box-shadow:0 24px 60px rgba(107,45,143,.13), 0 4px 12px rgba(107,45,143,.06);
}
.admin .pf-hero-glow {
  position:absolute; width:340px; height:340px; right:-90px; top:-140px; border-radius:50%;
  background:radial-gradient(circle, rgba(212,175,55,.30), transparent 65%);
  filter:blur(8px); animation:pf-breathe 7s ease-in-out infinite;
}
.admin .pf-datepill {
  display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:9999px;
  background:#fff; border:1px solid var(--admin-border); color:var(--admin-text-muted);
  font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.06em;
  box-shadow:0 2px 6px rgba(107,45,143,.06);
}
.admin .pf-hero-title {
  font-family:${DISPLAY}; font-size:2.9rem; line-height:1.05; color:var(--pf-purple);
  margin:.7rem 0 0; font-weight:800; letter-spacing:-.01em;
}
.admin .pf-hero-star { display:inline-flex; color:var(--pf-gold); margin-left:.5rem; vertical-align:middle; animation:pf-twinkle 2.6s ease-in-out infinite; }
.admin .pf-hero-sub { margin:.9rem 0 0; font-size:1.05rem; line-height:1.55; color:var(--admin-text-secondary); max-width:52ch; }
.admin .pf-section { margin-bottom:var(--admin-space-6); }
.admin .pf-sec-head { display:flex; align-items:center; gap:12px; margin-bottom:var(--admin-space-4); }
.admin .pf-sec-ic { display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:12px; flex-shrink:0; }
.admin .pf-sec-title { font-family:${DISPLAY}; font-size:1.6rem; color:var(--admin-text); margin:0; line-height:1.1; font-weight:700; }
.admin .pf-sec-sub { margin:2px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-subtle); }
.admin .pf-card {
  display:flex; text-decoration:none; background:var(--admin-surface);
  border:1px solid var(--admin-border); border-radius:16px;
  box-shadow:0 2px 4px rgba(107,45,143,.04); transition:transform .16s ease, box-shadow .16s ease, border-color .16s ease;
}
.admin .pf-card:hover { transform:translateY(-2px); box-shadow:0 14px 34px rgba(107,45,143,.13); border-color:color-mix(in srgb, var(--pf-purple) 30%, var(--admin-border)); text-decoration:none; }
.admin .pf-row { align-items:center; gap:16px; padding:16px 20px; border-left:4px solid transparent; }
.admin .pf-row-urgent { border-left-color:var(--pf-gold); }
.admin .pf-rank { font-size:var(--admin-text-xs); font-weight:800; color:var(--admin-text-subtle); width:16px; text-align:center; font-variant-numeric:tabular-nums; }
.admin .pf-row-ic { display:flex; align-items:center; justify-content:center; width:42px; height:42px; border-radius:12px; flex-shrink:0; }
.admin .pf-row-title { font-size:1.02rem; font-weight:700; color:var(--admin-text); }
.admin .pf-count { font-size:var(--admin-text-xs); font-weight:800; padding:2px 9px; border-radius:9999px; }
.admin .pf-urgent-tag { display:inline-flex; align-items:center; gap:4px; font-size:.66rem; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:#9a7b1e; }
.admin .pf-row-blurb { margin:5px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); line-height:1.5; }
.admin .pf-action {
  display:inline-flex; align-items:center; gap:5px; flex-shrink:0; padding:8px 14px; border-radius:10px;
  background:var(--admin-accent-soft); color:var(--pf-purple); font-weight:700; font-size:var(--admin-text-sm);
  transition:gap .16s ease, background .16s ease;
}
.admin .pf-row:hover .pf-action { gap:9px; background:var(--pf-purple); color:#fff; }
.admin .pf-team-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:var(--admin-space-4); }
.admin .pf-teamcard { align-items:flex-start; gap:16px; padding:20px; border-radius:18px; }
.admin .pf-avatar {
  flex-shrink:0; width:64px; height:64px; display:flex; align-items:center; justify-content:center;
  border-radius:16px; background:linear-gradient(135deg, var(--admin-accent-soft), rgba(212,175,55,.18));
  border:1px solid var(--admin-border); animation:pf-float 5s ease-in-out infinite;
}
.admin .pf-teamcard:nth-child(2n) .pf-avatar { animation-delay:-1.5s; }
.admin .pf-teamcard:nth-child(3n) .pf-avatar { animation-delay:-3s; }
.admin .pf-lore { align-items:flex-start; gap:14px; padding:16px 20px; }
.admin .pf-lore-avatars { display:flex; flex-shrink:0; }
.admin .pf-lore-av {
  width:34px; height:34px; display:flex; align-items:center; justify-content:center; font-size:1.1rem;
  border-radius:50%; background:#fff; border:1px solid var(--admin-border); margin-left:-8px;
  box-shadow:0 2px 4px rgba(107,45,143,.08);
}
.admin .pf-lore-av:first-child { margin-left:0; }
.admin .pf-lore-date { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); font-variant-numeric:tabular-nums; }
.admin .pf-morelink { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-sm); font-weight:700; color:var(--pf-purple); text-decoration:none; }
.admin .pf-morelink:hover { gap:9px; text-decoration:none; }
@keyframes pf-float { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-5px);} }
@keyframes pf-breathe { 0%,100%{ transform:scale(1); opacity:.9;} 50%{ transform:scale(1.12); opacity:1;} }
@keyframes pf-twinkle { 0%,100%{ transform:scale(1) rotate(0); opacity:.85;} 50%{ transform:scale(1.18) rotate(8deg); opacity:1;} }
@media (prefers-reduced-motion: reduce) {
  .admin .pf-avatar, .admin .pf-hero-glow, .admin .pf-hero-star { animation:none; }
}
`
