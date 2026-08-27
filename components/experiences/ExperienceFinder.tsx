'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { categoryBucket } from '@/lib/experiences/categories'

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
  image_url: string | null
  first_seen_at: string | null
  last_seen_at: string | null
  sold_out: boolean
}

// One card = one experience, which may bundle several duplicate lots/dates.
interface GroupedListing {
  rep: FinderListing // the representative (cheapest) lot — drives the link + details
  count: number // how many lots/dates were collapsed into this card
  fromPoints: number | null // lowest price across the group
  nearestClose: string | null // soonest close across the group
}

// The card currencies whose points can REACH experiences (own listings + transfer
// partners). Order = rough popularity. Powers the "what my points can get me" filter.
const TRANSFER_CARDS: { slug: string; label: string }[] = [
  { slug: 'chase', label: 'Chase' },
  { slug: 'amex', label: 'Amex' },
  { slug: 'capital-one', label: 'Capital One' },
  { slug: 'citi', label: 'Citi' },
  { slug: 'bilt', label: 'Bilt' },
]

// Budget ceilings (points), sized to the real listing spread (median ~40k, most
// under 250k, a handful up to ~795k). Each pill keeps listings at or under the cap.
const BUDGET_TIERS: { cap: number; label: string }[] = [
  { cap: 25_000, label: 'Under 25k' },
  { cap: 50_000, label: 'Under 50k' },
  { cap: 100_000, label: 'Under 100k' },
  { cap: 250_000, label: 'Under 250k' },
]

// Category filter pills. The four named buckets plus a Misc catch-all (culture,
// entertainment, and anything uncategorized) — the set Jill asked for.
const CATEGORY_PILLS: { key: string; label: string; color: string }[] = [
  { key: 'music', label: 'Music', color: '#B03D77' }, // mulberry
  { key: 'sports', label: 'Sports', color: '#2E7D5B' }, // emerald
  { key: 'dining', label: 'Culinary', color: '#B8901F' }, // bronze
  { key: 'travel', label: 'Travel', color: '#17868A' }, // teal
  { key: 'misc', label: 'Misc', color: '#6E6486' }, // muted
]
// Map a listing to its category-pill key (anything outside the 4 named → 'misc').
function catPillKey(l: FinderListing): string {
  const k = categoryBucket(l.category)?.key
  return k && ['music', 'sports', 'dining', 'travel'].includes(k) ? k : 'misc'
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


// Category buckets are shared with the homepage (lib/experiences/categories.ts)
// so a "Music" tile reads the same everywhere.
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

// "Updated 3h ago" freshness line — reassures the reader the price/date is
// current (we re-scrape daily). Uses last_seen_at (last time the watcher saw it).
function updatedAgo(iso: string | null): string | null {
  if (!iso) return null
  const h = Math.floor((Date.now() - Date.parse(iso)) / 3_600_000)
  if (Number.isNaN(h) || h < 0) return null
  if (h < 1) return 'Updated just now'
  if (h < 24) return `Updated ${h}h ago`
  return `Updated ${Math.floor(h / 24)}d ago`
}

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

interface BonusInfo {
  card: string
  pct: number | null
  end: string | null
  slug: string | null
}

export default function ExperienceFinder({
  listings,
  cardReach,
  bestBonus,
}: {
  listings: FinderListing[]
  cardReach: Record<string, string[]>
  bestBonus: Record<string, BonusInfo>
}) {
  const [q, setQ] = useState('')
  const [program, setProgram] = useState<string>('all')
  // Category filter as multi-select bucket pills (Music/Sports/Culinary/Travel/Misc).
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [sort, setSort] = useState<SortKey>('newest')
  // Sold-out experiences are hidden by DEFAULT — there's nothing left to book, so
  // they shouldn't be the first thing a browser sees. Toggle to reveal them.
  const [hideSoldOut, setHideSoldOut] = useState(true)
  const [nyOnly, setNyOnly] = useState(false)
  const toggleCat = (key: string) =>
    setSelectedCats((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  // Which point currencies the reader HOLDS — multi-select (they can have Amex
  // AND Citi AND Chase). A listing matches if ANY held currency reaches it
  // (its own program + that currency's transfer partners). Empty = show all.
  const [heldCards, setHeldCards] = useState<string[]>([])
  // Budget ceiling in points (null = any). Preset tiers as pills, matching the
  // real spread (median ~40k, max ~795k) — see BUDGET_TIERS.
  const [budget, setBudget] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'buynow' | 'soon'>('all')
  const [bonusOnly, setBonusOnly] = useState(false)
  const toggleHeld = (slug: string) =>
    setHeldCards((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))

  const soldOutCount = useMemo(() => listings.filter((l) => l.sold_out).length, [listings])
  const nyCount = useMemo(() => listings.filter(isNYLocation).length, [listings])
  const bonusCount = useMemo(() => listings.filter((l) => bestBonus[l.program_slug]).length, [listings, bestBonus])

  const programs = useMemo(() => {
    const m = new Map<string, string>()
    for (const l of listings) if (!m.has(l.program_slug)) m.set(l.program_slug, l.program_label)
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [listings])

  // Count listings per category pill so we can show a count and hide empty pills.
  const catCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const l of listings) m[catPillKey(l)] = (m[catPillKey(l)] ?? 0) + 1
    return m
  }, [listings])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let out = listings.filter((l) => {
      if (program !== 'all' && l.program_slug !== program) return false
      if (selectedCats.length > 0 && !selectedCats.includes(catPillKey(l))) return false
      if (hideSoldOut && l.sold_out) return false
      if (nyOnly && !isNYLocation(l)) return false
      // Points-held filter (multi-select): keep the listing if ANY held currency
      // reaches it — its own program OR that currency's transfer partners.
      if (heldCards.length > 0) {
        const reachable = heldCards.some(
          (card) => l.program_slug === card || (cardReach[card] ?? []).includes(l.program_slug),
        )
        if (!reachable) return false
      }
      // Budget ceiling (points). Unpriced listings are excluded when a cap is set.
      if (budget != null) {
        const p = pointsOf(l)
        if (p == null || p > budget) return false
      }
      // Status: live auction / buy-now / coming soon.
      if (statusFilter === 'soon' && !notYetOpen(l)) return false
      if (statusFilter === 'live' && (l.format !== 'bid' || notYetOpen(l))) return false
      if (statusFilter === 'buynow' && l.format !== 'redeem') return false
      if (bonusOnly && !bestBonus[l.program_slug]) return false
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
  }, [listings, q, program, selectedCats, sort, hideSoldOut, nyOnly, heldCards, budget, statusFilter, bonusOnly, cardReach, bestBonus])

  // Collapse duplicate listings of the SAME experience (Wyndham lists one party
  // as 10 separate auction lots; Marriott lists a show on several dates) into ONE
  // card. Key = program + normalized title. The card shows the count + the lowest
  // price ("10 auctions · from 7,500 points") and links to the cheapest lot.
  const grouped = useMemo(() => {
    const map = new Map<string, FinderListing[]>()
    for (const l of filtered) {
      const key = `${l.program_slug}::${l.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}`
      const arr = map.get(key)
      if (arr) arr.push(l)
      else map.set(key, [l])
    }
    const out: GroupedListing[] = []
    for (const arr of map.values()) {
      // representative = the cheapest lot (what the reader would actually book)
      const rep = [...arr].sort((a, b) => (pointsOf(a) ?? Infinity) - (pointsOf(b) ?? Infinity))[0]
      const prices = arr.map(pointsOf).filter((x): x is number => x != null)
      const closes = arr
        .map((a) => (a.close_date ? Date.parse(a.close_date) : null))
        .filter((x): x is number => x != null)
      out.push({
        rep,
        count: arr.length,
        fromPoints: prices.length ? Math.min(...prices) : null,
        nearestClose: closes.length ? new Date(Math.min(...closes)).toISOString() : rep.close_date,
      })
    }
    return out
  }, [filtered])

  // Cardmember-access listings are perks (sign in, no bid), not auctions - they
  // read as broken when mixed in with biddable ones, so they get their own band.
  const biddable = useMemo(() => grouped.filter((g) => g.rep.format !== 'access'), [grouped])
  const access = useMemo(() => grouped.filter((g) => g.rep.format === 'access'), [grouped])

  // Dimensional pills: a soft drop shadow + a lift on hover so they feel tactile,
  // not flat. Active = filled purple, raised.
  const pill = (active: boolean) =>
    `rg-tap-target inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 font-ui text-sm font-semibold shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
      active
        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-md'
        : 'border-[var(--color-border-soft)] bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
    }`

  // Category pills wear their OWN category color — a tinted fill + colored border
  // + a dot when idle, a solid color fill with a matching glow when active. This
  // is what makes the filter bar colorful instead of a row of grey ovals.
  const catPillProps = (color: string, active: boolean): { className: string; style: CSSProperties } => ({
    className:
      'rg-tap-target inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 font-ui text-sm font-semibold shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md',
    style: active
      ? { background: color, borderColor: color, color: '#fff', boxShadow: `0 6px 16px -3px ${color}80` }
      : { background: `${color}14`, borderColor: `${color}80`, color, boxShadow: `0 2px 6px ${color}22` },
  })

  return (
    <div>
      {/* PRIMARY filter — which points you hold (multi-select, check all that apply).
          This is the question most readers actually have, so it leads. */}
      <div className="mb-4 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-4">
        <p className="mb-2 font-ui text-sm font-semibold text-[var(--color-primary)]">
          Which points do you have?{' '}
          <span className="font-normal text-[var(--color-text-secondary)]">Check all that apply</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {TRANSFER_CARDS.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={pill(heldCards.includes(c.slug))}
              aria-pressed={heldCards.includes(c.slug)}
              onClick={() => toggleHeld(c.slug)}
            >
              {c.label}
            </button>
          ))}
          {heldCards.length > 0 && (
            <button
              type="button"
              onClick={() => setHeldCards([])}
              className="font-ui text-sm text-[var(--color-text-secondary)] underline hover:text-[var(--color-primary)]"
            >
              Clear
            </button>
          )}
        </div>
        {/* Category pills (multi-select) */}
        <p className="mb-2 mt-4 font-ui text-sm font-semibold text-[var(--color-primary)]">Category</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_PILLS.filter((c) => (catCounts[c.key] ?? 0) > 0).map((c) => {
            const active = selectedCats.includes(c.key)
            const p = catPillProps(c.color, active)
            return (
              <button key={c.key} type="button" className={p.className} style={p.style} aria-pressed={active} onClick={() => toggleCat(c.key)}>
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: active ? '#fff' : c.color }}
                  aria-hidden
                />
                {c.label}
              </button>
            )
          })}
          {selectedCats.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCats([])}
              className="font-ui text-sm text-[var(--color-text-secondary)] underline hover:text-[var(--color-primary)]"
            >
              Clear
            </button>
          )}
        </div>
        {/* Budget tier pills */}
        <p className="mb-2 mt-4 font-ui text-sm font-semibold text-[var(--color-primary)]">Your budget</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={pill(budget === null)} onClick={() => setBudget(null)}>
            Any
          </button>
          {BUDGET_TIERS.map((t) => (
            <button
              key={t.cap}
              type="button"
              className={pill(budget === t.cap)}
              aria-pressed={budget === t.cap}
              onClick={() => setBudget(t.cap)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + program + sort */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search experiences, artists, cities..."
          className="min-w-[12rem] flex-1 rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-2 font-body text-base"
        />
        <select
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-2 font-ui text-base"
          aria-label="Filter by program"
        >
          <option value="all">All programs</option>
          {programs.map(([slug, label]) => (
            <option key={slug} value={slug}>
              {label}
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-2 font-ui text-base"
          aria-label="Filter by status"
        >
          <option value="all">Any status</option>
          <option value="live">Live auctions</option>
          <option value="buynow">Buy now</option>
          <option value="soon">Coming soon</option>
        </select>
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
        {bonusCount > 0 && (
          <button
            type="button"
            className={pill(bonusOnly)}
            aria-pressed={bonusOnly}
            onClick={() => setBonusOnly((v) => !v)}
          >
            {bonusOnly ? 'Transfer bonus only' : `Active transfer bonus (${bonusCount})`}
          </button>
        )}
      </div>

      {(() => {
        const statusLabels: Record<'live' | 'buynow' | 'soon', string> = {
          live: 'Live auctions', buynow: 'Buy now', soon: 'Coming soon',
        }
        const chips: { label: string; clear: () => void }[] = []
        for (const slug of heldCards) {
          const label = TRANSFER_CARDS.find((c) => c.slug === slug)?.label ?? slug
          chips.push({ label: `${label} points`, clear: () => toggleHeld(slug) })
        }
        if (budget != null)
          chips.push({ label: `Under ${(budget / 1000).toLocaleString()}k points`, clear: () => setBudget(null) })
        if (statusFilter !== 'all') chips.push({ label: statusLabels[statusFilter], clear: () => setStatusFilter('all') })
        if (program !== 'all') chips.push({ label: programs.find(([s]) => s === program)?.[1] ?? program, clear: () => setProgram('all') })
        for (const key of selectedCats) {
          const label = CATEGORY_PILLS.find((c) => c.key === key)?.label ?? key
          chips.push({ label, clear: () => toggleCat(key) })
        }
        if (nyOnly) chips.push({ label: 'New York only', clear: () => setNyOnly(false) })
        if (hideSoldOut) chips.push({ label: 'Sold out hidden', clear: () => setHideSoldOut(false) })
        if (bonusOnly) chips.push({ label: 'Active transfer bonus', clear: () => setBonusOnly(false) })
        if (q.trim()) chips.push({ label: `“${q}”`, clear: () => setQ('') })
        if (!chips.length) return null
        return (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {chips.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={c.clear}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-background-soft)] px-2.5 py-1 font-ui text-xs text-[var(--color-primary)] hover:bg-[var(--color-border-soft)]"
              >
                {c.label} <span aria-hidden>&times;</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setHeldCards([]); setStatusFilter('all'); setBudget(null); setProgram('all')
                setSelectedCats([]); setNyOnly(false); setHideSoldOut(true); setBonusOnly(false); setQ('')
              }}
              className="font-ui text-xs text-[var(--color-text-secondary)] underline hover:text-[var(--color-primary)]"
            >
              Clear all
            </button>
          </div>
        )
      })()}

      <p className="mb-3 font-ui text-sm text-[var(--color-text-secondary)]">
        {grouped.length} experience{grouped.length === 1 ? '' : 's'}
      </p>

      {/* Biddable + redeemable listings */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,20rem),1fr))]">
        {biddable.map((g, i) => renderCard(g, `b${i}`))}
      </div>

      {/* Cardmember access - its own band, since these are perks not auctions */}
      {access.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-lg text-[var(--color-primary)]">Cardmember access</h3>
          <p className="mb-3 font-ui text-sm text-[var(--color-text-secondary)]">
            Presale windows and members-only access. No bidding - you sign in on the issuer&apos;s site with an eligible card.
          </p>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,20rem),1fr))]">
            {access.map((g, i) => renderCard(g, `a${i}`))}
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

  function renderCard(g: GroupedListing, key: string) {
    const l = g.rep
    const href = l.detail_url ?? l.program_url ?? undefined
    const bucket = categoryBucket(l.category)
    const bonus = bestBonus[l.program_slug]
    const cta = l.sold_out
      ? 'Sold out. Check the official site'
      : l.format === 'access'
        ? 'Sign in on the official site'
        : l.format === 'bid'
          ? 'View & bid on the official site'
          : 'View & redeem on the official site'
    // Price line: a grouped card shows the count + the lowest price across lots.
    const priceText =
      g.count > 1 && g.fromPoints != null
        ? `${g.count} ${l.format === 'bid' ? 'auctions' : 'dates'} · from ${g.fromPoints.toLocaleString()} points`
        : pointsLabel(l)
    const card = (
      <>
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {bonus && (
            <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 font-ui text-[0.6875rem] font-bold uppercase tracking-wide text-[#1A1A1A]">
              {bonus.card}
              {bonus.pct != null ? ` +${bonus.pct}%` : ''} transfer bonus
            </span>
          )}
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
        <p className="mt-2 font-ui text-sm font-semibold text-[var(--color-primary)]">{priceText}</p>
        {(() => {
          const s = statusLine({ ...l, close_date: g.nearestClose })
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
        {updatedAgo(l.last_seen_at) && (
          <p className="mt-1.5 font-ui text-[0.625rem] uppercase tracking-wide text-[var(--color-text-secondary)] opacity-70">
            {updatedAgo(l.last_seen_at)}
          </p>
        )}
      </>
    )
    // Sold-out cards stay clickable (a waitlist may open) but read as spent:
    // dimmed, muted CTA, no hover lift.
    const dim = l.sold_out ? ' opacity-60' : ''
    // Category tint: a 4px colored left edge + a faint fill of the same jewel
    // tone, so a concert (mulberry) reads differently from a game (emerald) at a
    // glance — without loud borders. `${color}14` ≈ 8% alpha fill. Falls back to
    // the neutral card when a listing has no category.
    const tint: CSSProperties = bucket
      ? { borderLeftWidth: '4px', borderLeftColor: bucket.color, backgroundColor: `${bucket.color}14` }
      : {}
    // Image-led tile when the listing has a photo, so the browse grid is as rich
    // as the featured hero — a beautiful listing no longer looks plain just
    // because it isn't "featured". Imageless ones keep the compact text tile.
    const imageHeader = l.image_url ? (
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-background-soft)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={l.image_url}
          alt={l.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    ) : null
    const wrapClass = `overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] shadow-[var(--shadow-soft)] transition hover:border-[var(--color-primary)]${l.sold_out ? '' : ' hover:-translate-y-0.5'}${dim}`
    // Monetization: for a reader who doesn't hold this program's points, a soft
    // referral CTA into the Card Explorer, pre-filtered to cards that reach it.
    // A SEPARATE link below the experience link (never nested inside the <a>).
    const cardCta = l.program_slug ? (
      <a
        href={`/cards?program=${encodeURIComponent(l.program_slug)}`}
        className="flex items-center gap-1 border-t border-[var(--color-border-soft)] px-4 py-2.5 font-ui text-[0.72rem] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-soft)] hover:text-[var(--color-primary)]"
      >
        Don&apos;t have {l.program_label}? Find a card that earns it &rarr;
      </a>
    ) : null
    // The experience itself (image + content) stays clickable to the official
    // listing; the card CTA is a sibling link so the two never nest.
    const body = (
      <>
        {imageHeader}
        <div className="p-4">
          {card}
          {href && (
            <span className={`mt-2 inline-block font-ui text-sm ${l.sold_out ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-primary)]'}`}>{cta} &rarr;</span>
          )}
        </div>
      </>
    )
    return (
      <div key={key} style={tint} className={wrapClass}>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="block">
            {body}
          </a>
        ) : (
          body
        )}
        {cardCta}
      </div>
    )
  }
}
