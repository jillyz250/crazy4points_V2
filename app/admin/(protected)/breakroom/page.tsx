import Link from 'next/link'
import Image from 'next/image'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createAdminClient } from '@/utils/supabase/server'
import { Icon } from '@/components/admin/preview/kit'

export const dynamic = 'force-dynamic'

const GOLD = 'var(--color-accent)'
const DISPLAY = 'var(--font-display)'

// org_lore (migration 660): each beat may belong to one character's arc
// (character_slug) and carry a two-way choice Jill picks (choice_a/b + chosen).
// Beats with no character_slug — or that involve several people — are the shared
// office feed. Lore is FLAVOR ONLY: it never touches the work and never ships to
// customers.
type Beat = {
  id: string
  lore_date: string
  headline: string
  body: string | null
  involves: string[] | null
  character_slug: string | null
  choice_a: string | null
  choice_b: string | null
  chosen: string | null
}
type Cast = { slug: string; name: string; emoji: string | null; image_url: string | null; role_title: string | null }

// A couple of legacy `involves` slugs predate the current employee slugs.
const SLUG_ALIAS: Record<string, string> = { kesha: 'kesha-social' }
const resolve = (s: string) => SLUG_ALIAS[s] ?? s

const arr = (v: string[] | null | undefined): string[] => (Array.isArray(v) ? v : [])
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// A little face — portrait if we have one, else the emoji badge.
function Face({ c, size = 30 }: { c: Cast; size?: number }) {
  return c.image_url ? (
    <span className="br-face" style={{ width: size, height: size }}>
      <Image src={c.image_url} alt={c.name} fill sizes={`${size}px`} style={{ objectFit: 'cover' }} />
    </span>
  ) : (
    <span className="br-face br-face-emoji" style={{ width: size, height: size, fontSize: size * 0.5 }}>
      {c.emoji || '👤'}
    </span>
  )
}

export default async function BreakroomPage() {
  const db = createAdminClient()
  const [{ data: loreData }, { data: empData }] = await Promise.all([
    db.from('org_lore')
      .select('id, lore_date, headline, body, involves, character_slug, choice_a, choice_b, chosen')
      .order('lore_date', { ascending: false })
      .order('created_at', { ascending: false }),
    db.from('employees').select('slug, name, emoji, image_url, role_title'),
  ])
  const beats = (loreData ?? []) as Beat[]
  const emps = (empData ?? []) as Cast[]
  const bySlug = new Map(emps.map((e) => [e.slug, e]))

  // ── Partition ────────────────────────────────────────────────────────────
  // Office feed = shared/company beats: no character_slug, or several people in it.
  const officeFeed = beats.filter((b) => !b.character_slug || arr(b.involves).length > 1)
  // A character's arc = the beats explicitly on their storyline, oldest → newest.
  const arcFor = (slug: string) =>
    beats
      .filter((b) => b.character_slug === slug)
      .sort((a, b) => a.lore_date.localeCompare(b.lore_date) || a.id.localeCompare(b.id))
  // How many beats each person shows up in (arc or office feed) — a life sign.
  const appearances = (slug: string) =>
    beats.filter((b) => b.character_slug === slug || arr(b.involves).map(resolve).includes(slug)).length

  // The cast = everyone who has ever surfaced in the lore (arc OR involves),
  // resolved to a real employee face. Sorted by name so the wall reads calmly.
  const castSlugs = new Set<string>()
  for (const b of beats) {
    if (b.character_slug) castSlugs.add(resolve(b.character_slug))
    for (const s of arr(b.involves)) castSlugs.add(resolve(s))
  }
  const cast = [...castSlugs]
    .map((s) => bySlug.get(s))
    .filter((c): c is Cast => !!c)
    .sort((a, b) => a.name.localeCompare(b.name))

  const facesOf = (involves: string[] | null): Cast[] =>
    arr(involves).map(resolve).map((s) => bySlug.get(s)).filter((c): c is Cast => !!c)

  // If Jill has dropped a breakroom illustration at public/team/breakroom.png the
  // hero shows it; otherwise it falls back to the coffee glyph. Swapping is just
  // adding the file — same pattern the org Ideas box uses for ideas-box.png.
  const hasHeroArt = existsSync(join(process.cwd(), 'public', 'team', 'breakroom.png'))

  return (
    <div className="br-root">
      <style dangerouslySetInnerHTML={{ __html: BR_CSS }} />
      <div className="br-wrap">
        <Link href="/admin/org" className="br-back"><Icon name="arrowLeft" size={15} /> The team</Link>

        {/* ── Hero ── */}
        <header className="br-hero">
          {hasHeroArt ? (
            <span className="br-hero-art">
              <Image src="/team/breakroom.png" alt="" fill sizes="88px" style={{ objectFit: 'cover' }} />
            </span>
          ) : (
            <span className="br-hero-ic"><Icon name="coffee" size={26} /></span>
          )}
          <div className="br-hero-id">
            <h1 className="br-title">The Breakroom</h1>
            <p className="br-sub">Where the office soap opera lives — crushes, rivalries, wins and wobbles, one beat at a time.</p>
            <div className="br-firewall">
              <Icon name="shield" size={13} />
              <span>Flavor only. Internal — it never touches the work and never leaves the building.</span>
            </div>
          </div>
        </header>

        {/* ── The office feed: shared, cross-cutting beats ── */}
        <section className="br-section">
          <div className="br-sec-head">
            <h2 className="br-sec-title">The office feed</h2>
            <span className="br-sec-meta">{officeFeed.length} beat{officeFeed.length === 1 ? '' : 's'} · newest first</span>
          </div>
          {officeFeed.length === 0 ? (
            <div className="br-card br-empty">
              <span className="br-empty-ic"><Icon name="coffee" size={18} /></span>
              <div>
                <div className="br-empty-head">Quiet in here</div>
                <p className="br-empty-sub">The feed fills up at the morning meeting.</p>
              </div>
            </div>
          ) : (
            <div className="br-feed">
              {officeFeed.map((b) => {
                const faces = facesOf(b.involves)
                return (
                  <article key={b.id} className="br-card br-beat">
                    <div className="br-beat-top">
                      <div className="br-faces" aria-hidden="true">
                        {faces.slice(0, 5).map((c) => <Face key={c.slug} c={c} size={30} />)}
                        {faces.length > 5 && <span className="br-faces-more">+{faces.length - 5}</span>}
                      </div>
                      <span className="br-beat-date">{fmtDate(b.lore_date)}</span>
                    </div>
                    <h3 className="br-beat-head">{b.headline}</h3>
                    {b.body && <p className="br-beat-body">{b.body}</p>}
                    {faces.length > 0 && (
                      <div className="br-beat-names">{faces.map((c) => c.name.split(' ')[0]).join(' · ')}</div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Everyone's story: per-character arcs ── */}
        <section className="br-section br-section-last">
          <div className="br-sec-head">
            <h2 className="br-sec-title">Everyone&rsquo;s story</h2>
            <span className="br-sec-meta">{cast.length} character{cast.length === 1 ? '' : 's'} · each arc, start to now</span>
          </div>
          {cast.length === 0 ? (
            <div className="br-card br-empty">
              <span className="br-empty-ic"><Icon name="users" size={18} /></span>
              <div>
                <div className="br-empty-head">No cast yet</div>
                <p className="br-empty-sub">Stories start at the morning meeting.</p>
              </div>
            </div>
          ) : (
            <div className="br-people">
              {cast.map((c) => {
                const arc = arcFor(c.slug)
                const seen = appearances(c.slug)
                return (
                  <div key={c.slug} className="br-card br-person">
                    <Link href={`/admin/org/${c.slug}`} className="br-person-head" title={`Open ${c.name}`}>
                      <Face c={c} size={40} />
                      <div className="br-person-id">
                        <div className="br-person-name">{c.name}</div>
                        <div className="br-person-role">{c.role_title || ''}</div>
                      </div>
                      <Icon name="arrow" size={14} />
                    </Link>

                    {arc.length === 0 ? (
                      <div className="br-arc-empty">
                        <span className="br-arc-empty-head">No story yet — starts at the morning meeting.</span>
                        {seen > 0 && (
                          <span className="br-arc-empty-seen">
                            <Icon name="coffee" size={12} /> In {seen} office-feed beat{seen === 1 ? '' : 's'} so far
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="br-arc">
                        {arc.map((b) => (
                          <div key={b.id} className="br-arc-beat">
                            <div className="br-arc-rail"><span className="br-arc-dot" /></div>
                            <div className="br-arc-content">
                              <div className="br-arc-top">
                                <span className="br-arc-head">{b.headline}</span>
                                <span className="br-arc-date">{fmtDate(b.lore_date)}</span>
                              </div>
                              {b.body && <p className="br-arc-body">{b.body}</p>}
                              {(b.choice_a || b.choice_b) && (
                                <div className="br-choices">
                                  {b.choice_a && (
                                    <div className={`br-choice${b.chosen === 'a' ? ' br-choice-on' : ''}`}>
                                      <span className="br-choice-mark">{b.chosen === 'a' ? <Icon name="check" size={12} /> : 'A'}</span>
                                      <span>{b.choice_a}</span>
                                    </div>
                                  )}
                                  {b.choice_b && (
                                    <div className={`br-choice${b.chosen === 'b' ? ' br-choice-on' : ''}`}>
                                      <span className="br-choice-mark">{b.chosen === 'b' ? <Icon name="check" size={12} /> : 'B'}</span>
                                      <span>{b.choice_b}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const BR_CSS = `
.admin .br-wrap { max-width:1000px; margin:0 auto; padding:0 4px; }
.admin .br-back { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-muted); text-decoration:none; margin-bottom:1.6rem; transition:gap .14s ease, color .14s ease; }
.admin .br-back:hover { gap:9px; color:var(--color-primary); text-decoration:none; }

/* Hero — warm coffee band, a touch more playful than the work pages */
.admin .br-hero {
  display:flex; gap:1.15rem; align-items:flex-start; padding:1.6rem 1.7rem; margin-bottom:2.6rem;
  border-radius:20px; position:relative; overflow:hidden;
  border:1px solid color-mix(in srgb, ${GOLD} 30%, var(--admin-border));
  background:radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, ${GOLD} 14%, #fff), #fff 62%);
  box-shadow:0 1px 2px rgba(107,45,143,.04), 0 22px 50px -32px rgba(212,175,55,.5);
}
.admin .br-hero::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg, ${GOLD}, color-mix(in srgb, ${GOLD} 30%, #fff), ${GOLD}); }
.admin .br-hero-ic { display:flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:15px; flex-shrink:0; color:#8a6d12; background:radial-gradient(circle at 30% 25%, #fff, color-mix(in srgb, ${GOLD} 26%, #fff)); border:1px solid color-mix(in srgb, ${GOLD} 38%, var(--admin-border)); box-shadow:0 8px 20px -12px rgba(212,175,55,.7); }
/* Header illustration — the coffee glyph's bigger sibling. Lights up the moment
   public/team/breakroom.png exists; falls back to .br-hero-ic until then. */
.admin .br-hero-art { position:relative; width:88px; height:88px; border-radius:18px; flex-shrink:0; overflow:hidden; background:radial-gradient(circle at 30% 25%, #fff, color-mix(in srgb, ${GOLD} 20%, #fff)); border:1px solid color-mix(in srgb, ${GOLD} 38%, var(--admin-border)); box-shadow:0 10px 24px -14px rgba(212,175,55,.7); }
.admin .br-hero-id { min-width:0; flex:1; }
.admin .br-title { font-family:${DISPLAY}; font-size:2.1rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); margin:0; line-height:1.05; }
.admin .br-sub { margin:.4rem 0 0; font-size:1.02rem; line-height:1.55; color:var(--admin-text-muted); max-width:56ch; }
.admin .br-firewall { display:inline-flex; align-items:center; gap:7px; margin-top:.9rem; font-size:var(--admin-text-xs); font-weight:600; color:#8a6d12; padding:5px 12px; border-radius:9999px; background:color-mix(in srgb, ${GOLD} 12%, #fff); border:1px solid color-mix(in srgb, ${GOLD} 34%, var(--admin-border)); }

/* Sections */
.admin .br-section { margin-bottom:2.8rem; }
.admin .br-section-last { margin-bottom:3.5rem; }
.admin .br-sec-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:1rem; padding:0 2px; }
.admin .br-sec-title { font-family:${DISPLAY}; font-size:1.5rem; font-weight:700; letter-spacing:-.01em; color:var(--admin-text); margin:0; }
.admin .br-sec-meta { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.08em; color:var(--admin-text-subtle); font-weight:700; text-align:right; }

/* Card base */
.admin .br-card { background:var(--admin-surface); border:1px solid color-mix(in srgb, var(--color-primary) 9%, var(--admin-border)); border-radius:18px; box-shadow:0 1px 2px rgba(107,45,143,.035), 0 18px 40px -30px rgba(107,45,143,.26); }

/* Faces */
.admin .br-face { position:relative; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; overflow:hidden; flex-shrink:0; background:var(--admin-accent-soft); border:2px solid var(--admin-surface); box-shadow:0 0 0 1px color-mix(in srgb, var(--color-primary) 14%, var(--admin-border)); }
.admin .br-face-emoji { line-height:1; background:radial-gradient(circle at 30% 25%, #fff, var(--admin-accent-soft)); }

/* Office feed — masonry-ish responsive grid of beat cards */
.admin .br-feed { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1rem; align-items:start; }
.admin .br-beat { padding:1.15rem 1.25rem; transition:transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
.admin .br-beat:hover { transform:translateY(-2px); box-shadow:0 16px 36px -20px rgba(107,45,143,.4); border-color:color-mix(in srgb, var(--color-primary) 24%, var(--admin-border)); }
.admin .br-beat-top { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:.7rem; }
.admin .br-faces { display:flex; align-items:center; }
.admin .br-faces > .br-face { margin-right:-8px; }
.admin .br-faces-more { display:inline-flex; align-items:center; justify-content:center; height:26px; padding:0 8px; margin-left:2px; border-radius:9999px; font-size:.7rem; font-weight:700; color:var(--admin-text-muted); background:var(--admin-surface-alt); border:1px solid var(--admin-border); }
.admin .br-beat-date { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); flex-shrink:0; font-variant-numeric:tabular-nums; }
.admin .br-beat-head { font-family:${DISPLAY}; font-size:1.12rem; font-weight:600; color:var(--color-primary); line-height:1.28; margin:0; }
.admin .br-beat-body { margin:.5rem 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); line-height:1.6; }
.admin .br-beat-names { margin-top:.75rem; font-size:var(--admin-text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--admin-text-subtle); }

/* People — per-character arc cards */
.admin .br-people { display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:1.1rem; align-items:start; }
.admin .br-person { padding:1.1rem 1.2rem 1.25rem; }
.admin .br-person-head { display:flex; align-items:center; gap:12px; text-decoration:none; padding-bottom:.95rem; margin-bottom:.95rem; border-bottom:1px dashed color-mix(in srgb, var(--color-primary) 14%, var(--admin-border)); }
.admin .br-person-head:hover { text-decoration:none; }
.admin .br-person-head:hover .br-person-name { color:var(--color-primary); }
.admin .br-person-head > svg:last-child { color:var(--admin-text-subtle); flex-shrink:0; transition:transform .14s ease, color .14s ease; }
.admin .br-person-head:hover > svg:last-child { transform:translateX(2px); color:var(--color-primary); }
.admin .br-person-id { min-width:0; flex:1; }
.admin .br-person-name { font-size:1rem; font-weight:700; color:var(--admin-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; transition:color .14s ease; }
.admin .br-person-role { font-size:var(--admin-text-xs); color:var(--admin-text-muted); margin-top:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* Calm empty state per character */
.admin .br-arc-empty { display:flex; flex-direction:column; gap:.55rem; padding:.4rem 0 .2rem; }
.admin .br-arc-empty-head { font-size:var(--admin-text-sm); color:var(--admin-text-muted); font-style:italic; }
.admin .br-arc-empty-seen { display:inline-flex; align-items:center; gap:6px; width:max-content; font-size:var(--admin-text-xs); font-weight:600; color:#8a6d12; padding:4px 10px; border-radius:9999px; background:color-mix(in srgb, ${GOLD} 11%, #fff); border:1px solid color-mix(in srgb, ${GOLD} 30%, var(--admin-border)); }

/* Character arc — gold-dot timeline */
.admin .br-arc-beat { display:flex; gap:12px; }
.admin .br-arc-rail { position:relative; flex-shrink:0; width:12px; display:flex; justify-content:center; }
.admin .br-arc-rail::before { content:''; position:absolute; top:0; bottom:0; width:2px; background:color-mix(in srgb, var(--color-primary) 16%, var(--admin-border)); }
.admin .br-arc-beat:first-child .br-arc-rail::before { top:6px; }
.admin .br-arc-beat:last-child .br-arc-rail::before { bottom:calc(100% - 6px); }
.admin .br-arc-dot { position:relative; z-index:1; margin-top:4px; width:9px; height:9px; border-radius:50%; background:${GOLD}; box-shadow:0 0 0 3px color-mix(in srgb, ${GOLD} 22%, #fff); }
.admin .br-arc-content { min-width:0; flex:1; padding-bottom:1.25rem; }
.admin .br-arc-beat:last-child .br-arc-content { padding-bottom:0; }
.admin .br-arc-top { display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
.admin .br-arc-head { font-family:${DISPLAY}; font-size:1.02rem; font-weight:600; color:var(--color-primary); line-height:1.25; }
.admin .br-arc-date { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); flex-shrink:0; font-variant-numeric:tabular-nums; }
.admin .br-arc-body { margin:.3rem 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); line-height:1.55; }
.admin .br-choices { display:flex; flex-wrap:wrap; gap:7px; margin-top:.65rem; }
.admin .br-choice { display:inline-flex; align-items:center; gap:7px; font-size:var(--admin-text-sm); color:var(--admin-text-muted); padding:5px 11px 5px 7px; border-radius:9999px; background:var(--admin-surface-alt); border:1px solid var(--admin-border); }
.admin .br-choice-mark { display:flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:50%; flex-shrink:0; font-size:.68rem; font-weight:800; color:var(--admin-text-subtle); background:var(--admin-surface); border:1px solid var(--admin-border); }
.admin .br-choice-on { color:var(--admin-text); font-weight:600; background:var(--admin-success-soft); border-color:color-mix(in srgb, var(--admin-success) 35%, var(--admin-border)); }
.admin .br-choice-on .br-choice-mark { color:#fff; background:var(--admin-success); border-color:var(--admin-success); }

/* Empty states */
.admin .br-empty { display:flex; align-items:center; gap:14px; padding:1.4rem 1.5rem; }
.admin .br-empty-ic { display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:11px; flex-shrink:0; color:#8a6d12; background:color-mix(in srgb, ${GOLD} 16%, #fff); }
.admin .br-empty-head { font-family:${DISPLAY}; font-size:1.05rem; font-weight:600; color:var(--admin-text); }
.admin .br-empty-sub { margin:2px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); }

@media (max-width:560px) {
  .admin .br-hero { padding:1.3rem 1.3rem; gap:.9rem; }
  .admin .br-hero-art { width:64px; height:64px; border-radius:14px; }
  .admin .br-title { font-size:1.75rem; }
  .admin .br-feed, .admin .br-people { grid-template-columns:1fr; }
  .admin .br-sec-title { font-size:1.3rem; }
}
`
