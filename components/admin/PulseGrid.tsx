import Link from 'next/link'
import { Icon, type IconName } from '@/components/admin/preview/icons'

/**
 * PULSE — the dashboard's real-time overview (Jill's mockup, 2026-09-06).
 * A 3×2 grid of big, glanceable, CLICKABLE stat cards that replaced the old
 * compact "dh-pulse" strip. Each card is a <Link> to its admin queue, with an
 * icon chip, big value, optional delta pill / NEW badge, and a sub line.
 *
 * Presentational only — all numbers are computed on the (force-dynamic) server
 * and passed in as `cards`, so nothing here is faked. Reused across admin.
 */

export type PulseTone = 'gold' | 'purple' | 'blue' | 'green'

export type PulseCard = {
  href: string
  icon: IconName
  tone: PulseTone
  label: string
  value: string
  valueTone?: 'green' | 'amber'   // colors the big value (Accuracy "Healthy")
  delta?: number                  // signed → up/down pill
  deltaTone?: 'green' | 'gold'    // pill color override (default: semantic by sign)
  badge?: string                  // e.g. "NEW"
  dotColor?: string               // leading status dot on the sub line
  sub?: string                    // sub text
  subEm?: string                  // emphasized tail (e.g. "5 need review")
  cta?: string                    // link-style CTA ("Review recent additions →")
}

function DeltaPill({ delta, tone }: { delta: number; tone?: 'green' | 'gold' }) {
  if (delta === 0) return <span className="pg-pill pg-pill-flat">±0</span>
  const up = delta > 0
  const cls = tone === 'gold' ? 'pg-pill-gold' : up ? 'pg-pill-up' : 'pg-pill-down'
  return (
    <span className={`pg-pill ${cls}`}>
      <Icon name="trending" size={11} style={up ? undefined : { transform: 'scaleY(-1)' }} />
      {up ? '+' : ''}{delta}
    </span>
  )
}

export default function PulseGrid({
  cards,
  asOf,
  refreshHref,
}: {
  cards: PulseCard[]
  asOf?: string
  refreshHref: string
}) {
  return (
    <div className="pg-root">
      <style dangerouslySetInnerHTML={{ __html: PG_CSS }} />
      <div className="pg-shimmer" aria-hidden="true" />

      <div className="pg-head">
        <div className="pg-head-title">
          <span className="pg-mark"><Icon name="pulse" size={20} /></span>
          <span className="pg-word">Pulse</span>
          <span className="pg-eyebrow">Real-time overview</span>
        </div>
        <div className="pg-head-right">
          {asOf && <span className="pg-updated"><span className="pg-live-dot" />{asOf}</span>}
          <Link href={refreshHref} className="pg-refresh" prefetch={false} scroll={false}>
            <Icon name="refresh" size={15} /> Refresh
          </Link>
        </div>
      </div>

      <div className="pg-grid">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`pg-card pg-tone-${c.tone}`}>
            <span className="pg-card-ic"><Icon name={c.icon} size={22} /></span>
            <div className="pg-card-body">
              <span className="pg-card-label">{c.label}</span>
              <div className="pg-card-valrow">
                <span className={`pg-card-val${c.valueTone ? ` pg-val-${c.valueTone}` : ''}`}>
                  {c.valueTone && <span className="pg-val-dot" />}
                  {c.value}
                </span>
                {c.delta != null && <DeltaPill delta={c.delta} tone={c.deltaTone} />}
                {c.badge && <span className="pg-badge">{c.badge}</span>}
              </div>
              {(c.sub || c.cta) && (
                <span className={`pg-card-sub${c.cta ? ' pg-card-cta' : ''}`}>
                  {c.dotColor && <span className="pg-sub-dot" style={{ background: c.dotColor }} />}
                  {c.cta ? (
                    <>{c.cta} <span aria-hidden className="pg-cta-arrow">→</span></>
                  ) : (
                    <>{c.sub}{c.subEm && <> &middot; <em className="pg-sub-em">{c.subEm}</em></>}</>
                  )}
                </span>
              )}
            </div>
            <span className="pg-card-go" aria-hidden="true"><Icon name="arrow" size={16} /></span>
          </Link>
        ))}
      </div>

      <div className="pg-foot">
        <span className="pg-foot-tag">Keeping travel rewards within reach</span>
        <span className="pg-foot-brand"><Icon name="star" size={13} /> Crazy4Points Admin</span>
      </div>
    </div>
  )
}

const PURPLE = 'var(--color-primary)'
const DISPLAY = 'var(--font-display)'

const PG_CSS = `
.admin .pg-root { position:relative; overflow:hidden; border-radius:22px; padding:22px 22px 16px;
  border:1px solid color-mix(in srgb, ${PURPLE} 10%, var(--admin-border));
  background:linear-gradient(155deg, color-mix(in srgb, ${PURPLE} 7%, #fff) 0%, #fff 42%, color-mix(in srgb, var(--color-accent) 6%, #fff) 100%);
  box-shadow:0 2px 4px rgba(107,45,143,.05), 0 26px 60px -40px rgba(107,45,143,.4); }
.admin .pg-shimmer { position:absolute; top:-40%; right:-6%; width:46%; height:180%; pointer-events:none; opacity:.7;
  background:linear-gradient(115deg, transparent 40%, rgba(233,199,87,.45) 60%, rgba(255,255,255,.7) 66%, rgba(212,161,58,.35) 72%, transparent 84%);
  filter:blur(6px); transform:rotate(8deg); }

/* header */
.admin .pg-head { position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
.admin .pg-head-title { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
.admin .pg-mark { display:inline-flex; align-self:center; color:${PURPLE}; }
.admin .pg-word { font-family:${DISPLAY}; font-size:1.7rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:${PURPLE}; line-height:1; }
.admin .pg-eyebrow { font-size:var(--admin-text-xs); font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:var(--admin-text-subtle); }
.admin .pg-head-right { display:flex; align-items:center; gap:12px; }
.admin .pg-updated { display:inline-flex; align-items:center; gap:7px; font-size:var(--admin-text-sm); color:var(--admin-text-muted); }
.admin .pg-live-dot { width:8px; height:8px; border-radius:50%; background:var(--color-accent); box-shadow:0 0 0 3px rgba(212,175,55,.2); }
.admin .pg-refresh { display:inline-flex; align-items:center; gap:7px; padding:8px 15px; border-radius:9999px; text-decoration:none;
  font-family:var(--font-ui,inherit); font-size:var(--admin-text-sm); font-weight:800; color:#5a3d00;
  background:linear-gradient(180deg,#f6e2a0,#e3c264); border:1px solid #cda63f; box-shadow:0 1px 2px rgba(120,90,20,.2);
  transition:transform .14s ease, box-shadow .14s ease; }
.admin .pg-refresh:hover { transform:translateY(-1px); box-shadow:0 6px 16px -8px rgba(160,120,20,.6); text-decoration:none; }

/* grid */
.admin .pg-grid { position:relative; z-index:1; display:grid; grid-template-columns:repeat(auto-fit, minmax(258px, 1fr)); gap:14px; }
.admin .pg-card { display:flex; align-items:center; gap:15px; padding:18px 16px 18px 18px; border-radius:16px; text-decoration:none;
  background:rgba(255,255,255,.78); border:1px solid var(--admin-border); box-shadow:0 1px 2px rgba(26,26,26,.03);
  transition:transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
.admin .pg-card:hover { transform:translateY(-2px); text-decoration:none;
  border-color:color-mix(in srgb, ${PURPLE} 24%, var(--admin-border)); box-shadow:0 16px 34px -24px rgba(107,45,143,.5); }
.admin .pg-card-ic { display:flex; align-items:center; justify-content:center; width:52px; height:52px; border-radius:50%; flex-shrink:0; }
.admin .pg-card-body { min-width:0; flex:1; display:flex; flex-direction:column; gap:3px; }
.admin .pg-card-label { font-size:var(--admin-text-xs); font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--admin-text-muted); }
.admin .pg-card-valrow { display:flex; align-items:center; gap:9px; flex-wrap:wrap; }
.admin .pg-card-val { font-family:${DISPLAY}; font-size:2.15rem; font-weight:800; line-height:1; letter-spacing:-.02em; color:var(--admin-text); font-variant-numeric:tabular-nums; }
.admin .pg-val-green { font-size:1.7rem; color:var(--admin-success); display:inline-flex; align-items:center; gap:8px; }
.admin .pg-val-amber { font-size:1.7rem; color:#B8860B; display:inline-flex; align-items:center; gap:8px; }
.admin .pg-val-dot { width:11px; height:11px; border-radius:50%; background:currentColor; }
.admin .pg-card-sub { display:flex; align-items:center; gap:6px; font-size:var(--admin-text-sm); color:var(--admin-text-muted); margin-top:1px; }
.admin .pg-sub-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.admin .pg-sub-em { font-style:normal; font-weight:700; color:#B8860B; }
.admin .pg-card-cta { color:${PURPLE}; font-weight:700; }
.admin .pg-cta-arrow { transition:transform .15s ease; display:inline-block; }
.admin .pg-card:hover .pg-cta-arrow { transform:translateX(3px); }

/* pills + badge */
.admin .pg-pill { display:inline-flex; align-items:center; gap:3px; font-size:var(--admin-text-xs); font-weight:800; padding:2px 8px; border-radius:9999px; font-variant-numeric:tabular-nums; }
.admin .pg-pill-up { color:var(--admin-success); background:var(--admin-success-soft); }
.admin .pg-pill-down { color:var(--admin-danger); background:var(--admin-danger-soft); }
.admin .pg-pill-gold { color:#7a5a10; background:rgba(212,175,55,.18); }
.admin .pg-pill-flat { color:var(--admin-text-muted); background:var(--admin-surface-alt); }
.admin .pg-badge { font-size:var(--admin-text-xs); font-weight:800; letter-spacing:.06em; padding:3px 9px; border-radius:9999px;
  color:${PURPLE}; background:color-mix(in srgb, ${PURPLE} 12%, #fff); }

/* chevron */
.admin .pg-card-go { display:flex; align-items:center; color:var(--admin-text-subtle); flex-shrink:0; transition:transform .15s ease, color .15s ease; }
.admin .pg-card:hover .pg-card-go { transform:translateX(3px); color:${PURPLE}; }

/* tones (icon chip) */
.admin .pg-tone-gold   .pg-card-ic { background:rgba(212,175,55,.15); color:#B8860B; }
.admin .pg-tone-purple .pg-card-ic { background:color-mix(in srgb, ${PURPLE} 10%, #fff); color:${PURPLE}; }
.admin .pg-tone-blue   .pg-card-ic { background:rgba(51,81,138,.12); color:#33518A; }
.admin .pg-tone-green  .pg-card-ic { background:rgba(45,140,90,.14); color:var(--admin-success); }

/* footer */
.admin .pg-foot { position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
  margin-top:16px; padding-top:13px; border-top:1px solid color-mix(in srgb, ${PURPLE} 8%, var(--admin-border)); }
.admin .pg-foot-tag { font-family:${DISPLAY}; font-style:italic; font-size:var(--admin-text-sm); color:var(--admin-text-subtle); letter-spacing:.04em; }
.admin .pg-foot-brand { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-xs); font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--color-accent); }

@media (max-width:640px) {
  .admin .pg-root { padding:16px 14px 12px; border-radius:18px; }
  .admin .pg-word { font-size:1.4rem; }
  .admin .pg-card-val { font-size:1.9rem; }
}
`
