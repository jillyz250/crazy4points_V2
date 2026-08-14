/**
 * Marquee experience shaping for the inspire-first /experiences page.
 *
 * Turns raw experience_listings rows into the three visual tiers Jill's redesign
 * calls for, losing NO listing along the way:
 *   - FEATURE → a full image card (the dreamy ones), grouped by experience so a
 *     multi-date auction (e.g. Per Se on 3 nights) is ONE card listing its dates.
 *   - MORE    → a compact one-line link (quirky/long-tail: flight simulator,
 *     city tours, fitness workshops). Still reachable, just not a hero card.
 *   - HIDE    → the handful that aren't really experiences (a bare venue name, a
 *     corporate 5K, "TEASER" placeholders that aren't bookable yet).
 * New listings default to FEATURE unless a signal or the small documented
 * override lists below demote them — so the page stays complete as data grows.
 *
 * Region (US vs non-US) is read from the free-text `location` field.
 */

export type MarqueeListing = {
  id: string
  title: string
  category: string | null
  location: string | null
  format: string | null
  program_slug: string | null
  source_platform: string | null
  points_required: number | null
  current_bid: number | null
  minimum_bid: number | null
  event_date: string | null
  close_date: string | null
  detail_url: string | null
  image_url: string | null
}

/** One experience card = a group of one-or-more bookable packages/dates. */
export type ExperienceGroup = {
  key: string
  title: string
  category: string | null
  location: string | null
  region: 'US' | 'INTL'
  program_slug: string | null
  source_platform: string | null
  image_url: string | null
  format: string | null
  /** cheapest points across packages, if any package is points-priced */
  fromPoints: number | null
  /** true if any package is an auction (bid) */
  isAuction: boolean
  packages: {
    detail_url: string | null
    event_date: string | null
    close_date: string | null
    points_required: number | null
    current_bid: number | null
    minimum_bid: number | null
    label: string | null
  }[]
}

// ---- curation override lists (lowercase substring match; documented + editable) ----
// Not really experiences — hide entirely.
const HIDE = ['madison square garden', 'corporate challenge']
// Real but long-tail/quirky — show as compact one-line links, not hero cards.
const MORE = [
  'flight simulator',
  "archer's",
  'cranky dorkfest',
  'brooklyn bridge bike',
  'miami beach iconic',
  'fort lauderdale city',
  'south florida grand tour',
  'pullman xchange',
  'hyrox',
]

// US state codes + names + explicit US markers for region detection.
const US_STATES =
  /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/
const US_WORDS =
  /united states|,\s*usa\b|\bhawaii\b|\balaska\b|\bcalifornia\b|\bflorida\b|\barizona\b|\bnew york\b|\btexas\b|\bcolorado\b|\bmassachusetts\b/i

export function classifyRegion(location: string | null | undefined): 'US' | 'INTL' {
  const loc = (location ?? '').trim()
  if (!loc) return 'US' // undated/placeless default; rare, keeps them visible in the main block
  if (US_WORDS.test(loc)) return 'US'
  // A US state code appears as a standalone token, usually after a comma.
  if (US_STATES.test(loc)) return 'US'
  return 'INTL'
}

export type Tier = 'feature' | 'more' | 'hide'
export function tierOf(title: string): Tier {
  const t = title.trim().toLowerCase()
  if (/^teaser/.test(t)) return 'hide'
  if (HIDE.some((h) => t.includes(h))) return 'hide'
  if (MORE.some((m) => t.includes(m))) return 'more'
  return 'feature'
}

/** Strip a trailing " - <Month> <day>, <year>" (or partial) date/package suffix. */
function baseTitle(title: string): string {
  return title
    .replace(/\s*[-–—]\s*(january|february|march|april|may|june|july|august|september|october|november|december|sept?|oct|nov|dec|jan|feb|mar|apr|jun|jul|aug)\b.*$/i, '')
    .replace(/\s+(with|includes)\s+round\s+trip.*$/i, '')
    .replace(/\s+for\s+two\b.*$/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .trim()
}

function groupKey(l: MarqueeListing): string {
  return `${l.program_slug ?? l.source_platform ?? ''}::${baseTitle(l.title).toLowerCase()}`
}

/** A short human date label for a package, from event_date or close_date. */
function pkgLabel(l: MarqueeListing): string | null {
  const src = l.event_date || l.close_date
  if (!src) return null
  // event_date is sometimes a full ISO date, sometimes free text ("September 17,
  // 2026", "September"). Parse anything with a day number to a tidy "Sep 17".
  if (/\d/.test(src)) {
    const d = new Date(src)
    if (!isNaN(d.getTime()) && /\d{1,2}/.test(src.replace(/\d{4}/, ''))) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    }
  }
  return src.length > 18 ? null : src
}

export function groupExperiences(listings: MarqueeListing[]): ExperienceGroup[] {
  const groups = new Map<string, ExperienceGroup>()
  const seenUrls = new Set<string>()

  for (const l of listings) {
    // collapse a true duplicate (same detail_url scraped twice)
    if (l.detail_url) {
      if (seenUrls.has(l.detail_url)) continue
      seenUrls.add(l.detail_url)
    }
    const key = groupKey(l)
    let g = groups.get(key)
    if (!g) {
      g = {
        key,
        title: baseTitle(l.title),
        category: l.category,
        location: l.location,
        region: classifyRegion(l.location),
        program_slug: l.program_slug,
        source_platform: l.source_platform,
        image_url: l.image_url,
        format: l.format,
        fromPoints: null,
        isAuction: false,
        packages: [],
      }
      groups.set(key, g)
    }
    // prefer any package that has an image if the group leader lacked one
    if (!g.image_url && l.image_url) g.image_url = l.image_url
    if (l.points_required != null) g.fromPoints = g.fromPoints == null ? l.points_required : Math.min(g.fromPoints, l.points_required)
    if (l.current_bid != null || l.minimum_bid != null || l.format === 'bid') g.isAuction = true
    g.packages.push({
      detail_url: l.detail_url,
      event_date: l.event_date,
      close_date: l.close_date,
      points_required: l.points_required,
      current_bid: l.current_bid,
      minimum_bid: l.minimum_bid,
      label: pkgLabel(l),
    })
  }

  // sort packages by date within a group
  for (const g of groups.values()) {
    g.packages.sort((a, b) => String(a.event_date ?? a.close_date ?? '').localeCompare(String(b.event_date ?? b.close_date ?? '')))
  }
  return [...groups.values()]
}

export type MarqueeSections = {
  us: ExperienceGroup[]
  intl: ExperienceGroup[]
  more: MarqueeListing[]
}

export function buildMarqueeSections(listings: MarqueeListing[]): MarqueeSections {
  const feature: MarqueeListing[] = []
  const more: MarqueeListing[] = []
  const seenMoreUrls = new Set<string>()
  for (const l of listings) {
    const tier = tierOf(l.title)
    if (tier === 'hide') continue
    if (tier === 'more') {
      // collapse true duplicates (same detail_url scraped twice)
      if (l.detail_url) {
        if (seenMoreUrls.has(l.detail_url)) continue
        seenMoreUrls.add(l.detail_url)
      }
      more.push(l)
    } else feature.push(l)
  }
  const grouped = groupExperiences(feature)
  // image-first, then points-priced, then auctions, for a strong visual lead
  const rank = (g: ExperienceGroup) => (g.image_url ? 0 : 1) * 10 + (g.fromPoints != null ? 0 : g.isAuction ? 1 : 2)
  grouped.sort((a, b) => rank(a) - rank(b))
  return {
    us: grouped.filter((g) => g.region === 'US'),
    intl: grouped.filter((g) => g.region === 'INTL'),
    more,
  }
}
