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
  sold_out: boolean
}

// A short, honest date line for the tile. close_date drives urgency (bidding
// ends); event_date is when the experience happens. Guessed close dates get a
// "~" so we never assert a scraped estimate as fact.
function statusLine(l: FinderListing): { text: string; tone: 'live' | 'soon' | 'event' | 'muted' } | null {
  const now = Date.now()
  const opens = l.bid_opens_at ? Date.parse(l.bid_opens_at) : null
  const close = l.close_date ? Date.parse(l.close_date) : null
  const event = l.event_date ? Date.parse(l.event_date) : null
  const md = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const sourced = l.close_date_confidence === 'marriott-detail' // vs Haiku-guessed
  // Not-yet-open comes first: it changes what the whole card means. "~" because
  // the open date is derived from a countdown at scrape time and drifts.
  if (opens != null && opens > now) {
    const days = Math.ceil((opens - now) / 86_400_000)
    const when = days <= 1 ? 'soon' : days <= 14 ? `in ${days} days` : `~${md(opens)}`
    return { text: `Bidding opens ${when}`, tone: 'soon' }
  }
  // A future close date is real urgency. Only assert it as a hard date when the
  // date is sourced; a Haiku guess gets a "~". A PAST close date is NEVER shown
  // as "closed": every listing here is status=active, so a past close is just a
  // wrong guess - fall through to the event date instead of a false "closed".
  if (close != null && close > now) {
    const days = Math.ceil((close - now) / 86_400_000)
    const when = days <= 1 ? 'today' : days <= 7 ? `in ${days} days` : `${sourced ? '' : '~'}${md(close)}`
    return { text: `Bidding closes ${when}`, tone: days <= 3 ? 'live' : 'soon' }
  }
  if (event != null && event >= now) return { text: `Experience ${md(event)}`, tone: 'event' }
  // An active auction with a live bid but no usable dates is genuinely live;
  // anything else we simply don't have a date for.
  if (l.format === 'bid' && l.current_bid != null) return { text: 'Bidding open now', tone: 'live' }
  return { text: 'Date to be confirmed', tone: 'muted' }
}

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'points_low', label: 'Points: low to high' },
  { key: 'points_high', label: 'Points: high to low' },
  { key: 'ending', label: 'Ending soonest' },
  { key: 'category', label: 'Category' },
  // No "Location" sort: a third of listings have no location, so it just piles
  // them into a blank bucket. Location still shows on the tiles that have one.
] as const
type SortKey = (typeof SORTS)[number]['key']

const cap = (s: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

// Collapse the messy category values (music / music & film / entertainment /
// sports / culinary / culture...) into a few buckets, each with its own accent
// so a concert reads differently from a game at a glance. Colors are muted
// jewel tones that live with the Royal Glow palette.
type Bucket = { label: string; color: string }
function categoryBucket(category: string | null): Bucket | null {
  const c = (category ?? '').toLowerCase()
  if (!c) return null
  if (c.includes('sport')) return { label: 'Sports', color: '#2E7D5B' } // emerald
  if (c.includes('music') || c.includes('concert')) return { label: 'Music', color: '#B03D77' } // mulberry
  if (c.includes('culinar') || c.includes('dining') || c.includes('food')) return { label: 'Dining', color: '#B8901F' } // bronze
  if (c.includes('theat') || c.includes('art') || c.includes('cultur')) return { label: 'Culture', color: '#3F5BA8' } // indigo
  if (c.includes('entertain') || c.includes('film')) return { label: 'Entertainment', color: '#6B2D8F' } // purple
  return { label: cap(category), color: '#6E6486' } // muted fallback
}
// New York metro detection on the LOCATION field only (title geo is unreliable:
// "Cubs vs a New York team" is played in Chicago). Mirrors the newsletter's
// isNewYork so the site and the email agree on what counts as NY-area.
const NY_LOCATION = /\bnew york\b|\bnyc\b|manhattan|brooklyn|\bbronx\b|\bqueens\b|flushing|long island|east rutherford|metlife|newark/i
const isNYLocation = (l: FinderListing) => !!l.location && NY_LOCATION.test(l.location)

// US state name -> USPS abbreviation, so "Chicago, Illinois" reads "Chicago, IL".
const US_STATES: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO',
  connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID',
  illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR',
  pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
  tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA',
  'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC',
}
const VAGUE_LOC = /various|multiple location|locations?\s+(globally|worldwide)|^\d+\s+locations?|globally|worldwide|nationwide|tbd|to be (announced|confirmed)/i

// Turn the messy source location into a short, honest badge ("City, ST" /
// "City, Country"). Returns null for blank or non-specific values ("Various
// Venues", "16 locations globally") so vague listings simply get no badge.
function locationBadge(raw: string | null): string | null {
  if (!raw) return null
  if (VAGUE_LOC.test(raw)) return null
  let parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((p) => {
      const pl = p.toLowerCase()
      if (pl === 'united states' || pl === 'usa' || pl === 'us' || pl === 'united states of america') return ''
      if (pl === 'republic of' || pl === 'the') return ''
      if (US_STATES[pl]) return US_STATES[pl]
      if (pl === 'united kingdom' || pl === 'great britain') return 'UK'
      if (pl === 'united arab emirates') return 'UAE'
      return p
    })
    .filter(Boolean)
  // Drop consecutive duplicates ("Bethesda, MD, Maryland" -> "Bethesda, MD").
  parts = parts.filter((p, i) => i === 0 || p.toUpperCase() !== parts[i - 1].toUpperCase())
  // Keep the two most specific parts (city + region), dropping venue prefixes.
  if (parts.length > 2) parts = parts.slice(-2)
  return parts.join(', ') || null
}

const pointsOf = (l: FinderListing) => l.current_bid ?? l.points_required ?? null

const notYetOpen = (l: FinderListing) => l.bid_opens_at != null && Date.parse(l.bid_opens_at) > Date.now()

// A listing first seen in the last ~48h gets a NEW flag. Time-based, so it
// clears itself - no "mark as read" to maintain.
const isNew = (l: FinderListing) =>
  l.first_seen_at != null && Date.now() - Date.parse(l.first_seen_at) < 48 * 3_600_000

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
  const [hideSoldOut, setHideSoldOut] = useState(false)
  const [nyOnly, setNyOnly] = useState(false)

  const soldOutCount = useMemo(() => listings.filter((l) => l.sold_out).length, [listings])
  const nyCount = useMemo(() => listings.filter(isNYLocation).length, [listings])

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
      if (hideSoldOut && l.sold_out) return false
      if (nyOnly && !isNYLocation(l)) return false
      if (needle && !`${l.title} ${l.location ?? ''} ${l.program_label}`.toLowerCase().includes(needle)) return false
      return true
    })
    const byPts = (l: FinderListing) => pointsOf(l) ?? Number.POSITIVE_INFINITY
    out = [...out].sort((a, b) => {
      // Sold-out listings sink to the very bottom, below everything actionable,
      // whatever the chosen sort - there's nothing left to book.
      const sa = a.sold_out ? 1 : 0
      const sb = b.sold_out ? 1 : 0
      if (sa !== sb) return sa - sb
      // Not-yet-open listings sink next - you cannot bid on them yet.
      const oa = notYetOpen(a) ? 1 : 0
      const ob = notYetOpen(b) ? 1 : 0
      if (oa !== ob) return oa - ob
      // Then float New York-area experiences up - most of our audience is in the
      // NY metro, so a local experience is the most actionable thing they'll see.
      const na = isNYLocation(a) ? 0 : 1
      const nb = isNYLocation(b) ? 0 : 1
      if (na !== nb) return na - nb
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
        case 'newest':
        default:
          return (b.first_seen_at ?? '').localeCompare(a.first_seen_at ?? '')
      }
    })
    return out
  }, [listings, q, program, category, sort, hideSoldOut, nyOnly])

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
        {nyCount > 0 && (
          <button
            type="button"
            className={pill(nyOnly)}
            aria-pressed={nyOnly}
            onClick={() => setNyOnly((v) => !v)}
          >
            {nyOnly ? 'New York only' : `New York (${nyCount})`}
          </button>
        )}
        {soldOutCount > 0 && (
          <button
            type="button"
            className={pill(hideSoldOut)}
            aria-pressed={hideSoldOut}
            onClick={() => setHideSoldOut((v) => !v)}
          >
            {hideSoldOut ? 'Sold out hidden' : `Hide sold out (${soldOutCount})`}
          </button>
        )}
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
    const bucket = categoryBucket(l.category)
    const cta = l.sold_out
      ? 'Sold out. Check the official site'
      : l.format === 'access'
        ? 'Sign in on the official site'
        : l.format === 'bid'
          ? 'View & bid on the official site'
          : 'View & redeem on the official site'
    const card = (
      <>
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {l.sold_out && (
            <span className="rounded-full bg-[var(--color-alert)] px-2 py-0.5 font-ui text-[0.6875rem] font-bold uppercase tracking-wide text-white">
              Sold out
            </span>
          )}
          {isNew(l) && !l.sold_out && (
            <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 font-ui text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--color-primary)]">
              New
            </span>
          )}
          {bucket && (
            <span
              className="rounded-full px-2 py-0.5 font-ui text-[0.6875rem] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: bucket.color }}
            >
              {bucket.label}
            </span>
          )}
          <span className="font-ui text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
            {l.program_label}
          </span>
          {l.format && (
            <span className="font-ui text-[0.6875rem] uppercase tracking-wide text-[var(--color-text-secondary)]">
              {formatLabel(l.format)}
            </span>
          )}
        </div>
        <p className="font-body font-medium leading-snug text-[var(--color-text-primary)]">{l.title}</p>
        {(() => {
          const loc = locationBadge(l.location)
          if (!loc) return null
          const ny = isNYLocation(l)
          // NY-area gets the gold accent so it pops for our NY-heavy audience;
          // everywhere else is a quiet neutral pill.
          return (
            <div className="mt-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-ui text-[0.6875rem] font-semibold ${
                  ny
                    ? 'bg-[var(--color-accent)] text-[var(--color-primary)]'
                    : 'border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] text-[var(--color-text-secondary)]'
                }`}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
                </svg>
                {loc}
              </span>
            </div>
          )
        })()}
        <p className="mt-2 font-ui text-sm font-semibold text-[var(--color-primary)]">{pointsLabel(l)}</p>
        {(() => {
          const s = statusLine(l)
          if (!s) return null
          // Distinct colors so bidding urgency and the experience date never
          // read the same: red = closing now, purple = bidding activity,
          // indigo = the experience date, grey = unknown. The "!" is required:
          // an unlayered link colour otherwise overrides the utility (Tailwind
          // v4 cascade trap - a fresh element gets the colour, a <p> in the <a>
          // does not).
          const tone =
            s.tone === 'live'
              ? 'text-[var(--color-alert)]!'
              : s.tone === 'soon'
                ? 'text-[var(--color-primary)]!'
                : s.tone === 'event'
                  ? 'text-[#3F5BA8]!'
                  : 'text-[var(--color-text-secondary)]!'
          return <p className={`mt-1 font-ui text-xs font-medium ${tone}`}>{s.text}</p>
        })()}
      </>
    )
    // Sold-out cards stay clickable (a waitlist may open) but read as spent:
    // dimmed, muted CTA, no hover lift.
    const dim = l.sold_out ? ' opacity-60' : ''
    return href ? (
      <a
        key={key}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`block rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)] transition hover:border-[var(--color-primary)]${l.sold_out ? '' : ' hover:-translate-y-0.5'}${dim}`}
      >
        {card}
        <span className={`mt-2 inline-block font-ui text-sm ${l.sold_out ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-primary)]'}`}>{cta} &rarr;</span>
      </a>
    ) : (
      <div key={key} className={`rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]${dim}`}>
        {card}
      </div>
    )
  }
}
