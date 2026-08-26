'use client'

import { useMemo, useState } from 'react'

export type Bullet = { title: string; body: string }
export type Program = { slug: string; name: string; type: string; bullets: Bullet[] }

// Value themes readers actually shop by. Classification is keyword-based on the
// authored bullet text (title + body) — deliberately ADDITIVE: a bullet can
// carry zero or several themes, and an unmatched bullet is never hidden under
// "All". Imperfect tags only ever narrow, never wrongly drop a spot.
type ThemeKey = 'premium' | 'stopover' | 'lounge' | 'hotel' | 'bonus'

const THEMES: { key: ThemeKey; label: string; test: (t: string, programType: string) => boolean }[] = [
  {
    key: 'premium',
    label: 'Premium cabins',
    test: (t) =>
      /first[ -]class|business[ -]class|\bpolaris\b|q[ -]?suite|club world|apex suite|la premi|the residence|premium cabin|lie[ -]?flat|first cabin|\bfirst\b(?=.*(class|cabin|seat|suite))/.test(
        t,
      ),
  },
  {
    key: 'stopover',
    label: 'Stopovers & routing',
    test: (t) => /stopover|open[ -]?jaw|free stop|layover|round[ -]?the[ -]?world|multi[ -]?city/.test(t),
  },
  { key: 'lounge', label: 'Lounges', test: (t) => /lounge/.test(t) && !/no lounge|without lounge|no .{0,20}lounge/.test(t) },
  {
    key: 'hotel',
    label: 'Hotels & nights',
    test: (t, pt) =>
      pt === 'hotel' ||
      /free night|4th night|fourth night|5th night|fifth night|suite night|category \d|all[ -]?inclusive|resort|villa|overwater|points ?\+ ?cash|cash ?\+ ?points/.test(
        t,
      ),
  },
  {
    key: 'bonus',
    label: 'Bonuses & buy points',
    test: (t) => /transfer bonus|buy[ -]?points|points? sale|bonus mile|\bpromo|% ?(bonus|off)|discount/.test(t),
  },
]

function themesFor(b: Bullet, programType: string): ThemeKey[] {
  const t = `${b.title} ${b.body}`.toLowerCase()
  return THEMES.filter((th) => th.test(t, programType)).map((th) => th.key)
}

type TypeKey = 'all' | 'airline' | 'hotel'
const TYPE_TABS: { key: TypeKey; label: string }[] = [
  { key: 'all', label: 'All programs' },
  { key: 'airline', label: 'Airlines' },
  { key: 'hotel', label: 'Hotels' },
]

export default function SweetSpotsExplorer({
  programs,
  hotSlugs,
}: {
  programs: Program[]
  hotSlugs: string[]
}) {
  const [query, setQuery] = useState('')
  const [typeKey, setTypeKey] = useState<TypeKey>('all')
  const [theme, setTheme] = useState<ThemeKey | 'all'>('all')
  const hot = useMemo(() => new Set(hotSlugs), [hotSlugs])

  // Pre-tag every bullet once.
  const tagged = useMemo(
    () =>
      programs.map((p) => ({
        ...p,
        bullets: p.bullets.map((b) => ({ ...b, themes: themesFor(b, p.type) })),
      })),
    [programs],
  )

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    return tagged
      .filter((p) => {
        if (typeKey === 'airline') return p.type === 'airline'
        if (typeKey === 'hotel') return p.type === 'hotel'
        return true
      })
      .map((p) => {
        // When a theme is active, keep only bullets carrying it — a genuine drill-down.
        let bullets = theme === 'all' ? p.bullets : p.bullets.filter((b) => b.themes.includes(theme))
        // Text search matches the program name OR any bullet; if the match is on
        // a bullet, narrow to matching bullets so the reader sees why it hit.
        if (q) {
          const nameHit = p.name.toLowerCase().includes(q)
          if (!nameHit) bullets = bullets.filter((b) => `${b.title} ${b.body}`.toLowerCase().includes(q))
        }
        return { ...p, bullets }
      })
      .filter((p) => p.bullets.length > 0)
  }, [tagged, typeKey, theme, q])

  const totalSpots = filtered.reduce((n, p) => n + p.bullets.length, 0)

  return (
    <>
      <div className="mt-8 flex flex-col gap-4">
        {/* Search */}
        <label className="relative block max-w-md">
          <span className="sr-only">Search sweet spots</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a program, route, or perk (e.g. Paris, lounge, Hyatt)"
            className="w-full rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-4 py-2.5 font-body text-base text-[var(--color-text-primary)] shadow-[var(--shadow-soft)] outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        {/* Type tabs */}
        <div className="flex flex-wrap gap-2">
          {TYPE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeKey(t.key)}
              className={`rounded-full px-3.5 py-1.5 font-ui text-xs font-semibold transition ${
                typeKey === t.key
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'border border-[var(--color-border-soft)] bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Theme chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTheme('all')}
            className={`rounded-full px-3 py-1 font-ui text-[0.7rem] font-semibold uppercase tracking-wide transition ${
              theme === 'all'
                ? 'bg-[var(--color-accent)] text-[#1A1A1A]'
                : 'border border-[var(--color-border-soft)] bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
            }`}
          >
            All value
          </button>
          {THEMES.map((th) => (
            <button
              key={th.key}
              onClick={() => setTheme(th.key)}
              className={`rounded-full px-3 py-1 font-ui text-[0.7rem] font-semibold uppercase tracking-wide transition ${
                theme === th.key
                  ? 'bg-[var(--color-accent)] text-[#1A1A1A]'
                  : 'border border-[var(--color-border-soft)] bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
              }`}
            >
              {th.label}
            </button>
          ))}
        </div>

        <p className="font-ui text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
          {totalSpots} sweet spot{totalSpots === 1 ? '' : 's'} across {filtered.length} program
          {filtered.length === 1 ? '' : 's'}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 font-body text-[var(--color-text-secondary)]">
          No sweet spots match that. Try clearing the search or a different filter.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <section
              key={p.slug}
              className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-[var(--color-primary)]">
                  <a href={`/programs/${p.slug}`} className="hover:underline">
                    {p.name}
                  </a>
                </h2>
                {hot.has(p.slug) && (
                  <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 font-ui text-[0.6rem] font-bold uppercase tracking-wide text-[#1A1A1A]">
                    Hot now
                  </span>
                )}
              </div>
              <ul className="flex flex-col gap-2.5">
                {p.bullets.map((b, i) => (
                  <li key={i} className="font-body text-sm text-[var(--color-text-secondary)]">
                    {b.title && <span className="font-semibold text-[var(--color-text-primary)]">{b.title}</span>}
                    {b.title && b.body ? ' — ' : ''}
                    {b.body}
                  </li>
                ))}
              </ul>
              <a
                href={`/programs/${p.slug}`}
                className="mt-1 font-ui text-xs font-semibold text-[var(--color-primary)] underline decoration-[var(--color-border-soft)] underline-offset-2 hover:decoration-[var(--color-primary)]"
              >
                Full {p.name} guide &rarr;
              </a>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
