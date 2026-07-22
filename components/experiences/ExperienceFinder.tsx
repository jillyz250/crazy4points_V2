'use client'

import { useMemo, useState } from 'react'

// Interactive finder over the LIVE experience listings (experience_listings),
// distinct from the program directory. Data is a few hundred rows, so all
// filter/sort runs in-memory. Facts + our phrasing only; every card links out
// to the official listing to actually bid/redeem.

export interface FinderListing {
  program_slug: string
  program_label: string
  program_url: string | null
  title: string
  category: string | null
  location: string | null
  format: string | null // 'bid' | 'redeem'
  current_bid: number | null
  points_required: number | null
  close_date: string | null
  close_date_confidence: string | null
  event_date: string | null
  bid_opens_at: string | null
  detail_url: string | null
  first_seen_at: string | null
}

// A short, honest date line for the tile. close_date drives urgency (bidding
// ends); event_date is when the experience happens. Guessed close dates get a
// "~" so we never assert a scraped estimate as fact.
function statusLine(l: FinderListing): { text: string; tone: 'live' | 'soon' | 'done' | 'muted' } | null {
  const now = Date.now()
  const opens = l.bid_opens_at ? Date.parse(l.bid_opens_at) : null
  const close = l.close_date ? Date.parse(l.close_date) : null
  const event = l.event_date ? Date.parse(l.event_date) : null
  const md = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const approx = l.close_date_confidence !== 'marriott-detail' // Haiku-guessed
  // Not-yet-open comes first: it changes what the whole card means. "~" because
  // the open date is derived from a countdown at scrape time and drifts.
  if (opens != null && opens > now) {
    const days = Math.ceil((opens - now) / 86_400_000)
    const when = days <= 1 ? 'soon' : days <= 14 ? `in ${days} days` : `~${md(opens)}`
    return { text: `Bidding opens ${when}`, tone: 'soon' }
  }
  if (close != null && close < now) return { text: 'Bidding closed', tone: 'done' }
  if (close != null) {
    const days = Math.ceil((close - now) / 86_400_000)
    const when = days <= 1 ? 'today' : days <= 7 ? `in ${days} days` : `${approx ? '~' : ''}${md(close)}`
    return { text: `Bidding closes ${when}`, tone: days <= 3 ? 'live' : 'soon' }
  }
  if (event != null && event >= now) return { text: `Experience ${md(event)}`, tone: 'muted' }
  if (event != null) return { text: 'Past event', tone: 'done' }
  return { text: 'Date to be confirmed', tone: 'muted' }
}

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'points_low', label: 'Points: low to high' },
  { key: 'points_high', label: 'Points: high to low' },
  { key: 'ending', label: 'Ending soonest' },
  { key: 'category', label: 'Category' },
  { key: 'location', label: 'Location' },
] as const
type SortKey = (typeof SORTS)[number]['key']

const cap = (s: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const pointsOf = (l: FinderListing) => l.current_bid ?? l.points_required ?? null

const notYetOpen = (l: FinderListing) => l.bid_opens_at != null && Date.parse(l.bid_opens_at) > Date.now()

function pointsLabel(l: FinderListing): string {
  if (l.format === 'access') return 'Cardmember access'
  const p = pointsOf(l)
  if (p == null) return l.format === 'bid' ? 'Auction' : 'Points redemption'
  // A not-yet-open auction shows a STARTING bid, not a current one.
  if (l.format === 'bid' && notYetOpen(l)) return `Starting bid ${p.toLocaleString()} points`
  return l.format === 'bid'
    ? `Current bid ${p.toLocaleString()} points`
    : `${p.toLocaleString()} points`
}

function formatLabel(f: string | null): string {
  if (f === 'bid') return 'Auction'
  if (f === 'access') return 'Access'
  if (f === 'redeem') return 'Fixed'
  return ''
}

export default function ExperienceFinder({ listings }: { listings: FinderListing[] }) {
  const [q, setQ] = useState('')
  const [program, setProgram] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('newest')

  const programs = useMemo(() => {
    const m = new Map<string, string>()
    for (const l of listings) if (!m.has(l.program_slug)) m.set(l.program_slug, l.program_label)
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [listings])

  const categories = useMemo(
    () => Array.from(new Set(listings.map((l) => l.category).filter(Boolean) as string[])).sort(),
    [listings],
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let out = listings.filter((l) => {
      if (program !== 'all' && l.program_slug !== program) return false
      if (category !== 'all' && l.category !== category) return false
      if (needle && !`${l.title} ${l.location ?? ''} ${l.program_label}`.toLowerCase().includes(needle)) return false
      return true
    })
    const byPts = (l: FinderListing) => pointsOf(l) ?? Number.POSITIVE_INFINITY
    out = [...out].sort((a, b) => {
      // Not-yet-open listings sink below everything you can act on now, whatever
      // the chosen sort - you cannot bid on them yet.
      const oa = notYetOpen(a) ? 1 : 0
      const ob = notYetOpen(b) ? 1 : 0
      if (oa !== ob) return oa - ob
      switch (sort) {
        case 'points_low':
          return byPts(a) - byPts(b)
        case 'points_high':
          return (pointsOf(b) ?? -1) - (pointsOf(a) ?? -1)
        case 'ending': {
          const av = a.close_date ? Date.parse(a.close_date) : Number.POSITIVE_INFINITY
          const bv = b.close_date ? Date.parse(b.close_date) : Number.POSITIVE_INFINITY
          return av - bv
        }
        case 'category':
          return (a.category ?? '').localeCompare(b.category ?? '')
        case 'location':
          return (a.location ?? '').localeCompare(b.location ?? '')
        case 'newest':
        default:
          return (b.first_seen_at ?? '').localeCompare(a.first_seen_at ?? '')
      }
    })
    return out
  }, [listings, q, program, category, sort])

  // Cardmember-access listings are perks (sign in, no bid), not auctions - they
  // read as broken when mixed in with biddable ones, so they get their own band.
  const biddable = useMemo(() => filtered.filter((l) => l.format !== 'access'), [filtered])
  const access = useMemo(() => filtered.filter((l) => l.format === 'access'), [filtered])

  const pill = (active: boolean) =>
    `rg-tap-target inline-flex items-center rounded-full border px-3.5 py-1.5 font-ui text-sm transition ${
      active
        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
        : 'border-[var(--color-border-soft)] bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
    }`

  return (
    <div>
      {/* Program pills */}
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className={pill(program === 'all')} onClick={() => setProgram('all')}>
          All programs
        </button>
        {programs.map(([slug, label]) => (
          <button key={slug} type="button" className={pill(program === slug)} onClick={() => setProgram(slug)}>
            {label}
          </button>
        ))}
      </div>

      {/* Search + category + sort */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search experiences, artists, cities..."
          className="min-w-[12rem] flex-1 rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-2 font-body text-base"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-2 font-ui text-base"
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {cap(c)}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-2 font-ui text-base"
          aria-label="Sort listings"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-3 font-ui text-sm text-[var(--color-text-secondary)]">
        {filtered.length} experience{filtered.length === 1 ? '' : 's'}
      </p>

      {/* Biddable + redeemable listings */}
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,20rem),1fr))]">
        {biddable.map((l, i) => renderCard(l, `b${i}`))}
      </div>

      {/* Cardmember access - its own band, since these are perks not auctions */}
      {access.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-lg text-[var(--color-primary)]">Cardmember access</h3>
          <p className="mb-3 font-ui text-sm text-[var(--color-text-secondary)]">
            Presale windows and members-only access. No bidding - you sign in on the issuer&apos;s site with an eligible card.
          </p>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,20rem),1fr))]">
            {access.map((l, i) => renderCard(l, `a${i}`))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="rg-sub-section text-center font-body text-[var(--color-text-secondary)]">
          No experiences match those filters right now. Try clearing the search or picking a different program.
        </p>
      )}
    </div>
  )

  function renderCard(l: FinderListing, key: string) {
    const href = l.detail_url ?? l.program_url ?? undefined
    const cta =
      l.format === 'access'
        ? 'Sign in on the official site'
        : l.format === 'bid'
          ? 'View & bid on the official site'
          : 'View & redeem on the official site'
    const card = (
      <>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="rounded-full bg-[var(--color-background-soft)] px-2 py-0.5 font-ui text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
            {l.program_label}
          </span>
          {l.format && (
            <span className="font-ui text-[0.6875rem] uppercase tracking-wide text-[var(--color-text-secondary)]">
              {formatLabel(l.format)}
            </span>
          )}
        </div>
        <p className="font-body font-medium leading-snug text-[var(--color-text-primary)]">{l.title}</p>
        <p className="mt-1 font-ui text-sm text-[var(--color-text-secondary)]">
          {[cap(l.category), l.location].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-2 font-ui text-sm font-semibold text-[var(--color-primary)]">{pointsLabel(l)}</p>
        {(() => {
          const s = statusLine(l)
          if (!s) return null
          const tone =
            s.tone === 'live'
              ? 'text-[var(--color-alert)]'
              : s.tone === 'soon'
                ? 'text-[var(--color-primary)]'
                : s.tone === 'done'
                  ? 'text-[var(--color-text-secondary)] line-through decoration-1'
                  : 'text-[var(--color-text-secondary)]'
          return <p className={`mt-1 font-ui text-xs font-medium ${tone}`}>{s.text}</p>
        })()}
      </>
    )
    return href ? (
      <a
        key={key}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
      >
        {card}
        <span className="mt-2 inline-block font-ui text-sm text-[var(--color-primary)]">{cta} &rarr;</span>
      </a>
    ) : (
      <div key={key} className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
        {card}
      </div>
    )
  }
}
