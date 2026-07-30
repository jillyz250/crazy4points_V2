import type { SupabaseClient } from '@supabase/supabase-js'
import type { TopExperienceItem } from './newsletterSlots'

/**
 * Build the newsletter "Money Can't Buy: New Experiences" section from the
 * freshly-scraped experience_listings.
 *
 * Curation (the whole point — a raw dump would be mostly noise):
 *  - POINTS PLAYS ONLY. We keep format 'redeem' (fixed points price) and 'bid'
 *    (points auction). Card-network concert presales (Citi/Amex/Chase
 *    Entertainment) come through as format 'access' with no points and are
 *    dropped — they carry no points angle and rotate constantly.
 *  - FRESH ONLY. first_seen within the last ~10 days, so the weekly newsletter
 *    features what actually dropped recently (with a small buffer).
 *  - STILL LIVE. close_date is null or today-or-later, so we never ship a dead
 *    link. (The editor pulls this at send time, so "today" is send day.)
 *  - REDEEM FIRST, then bid. Redemptions are honest fixed value; bids are
 *    flagged as auctions (is_auction) so the render can carry the caveat.
 *
 * Detection only — this auto-fills the slot; the editor trims/reorders before
 * sending. Capped so the pull is a shortlist, not a firehose.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FRESH_DAYS = 10
const CAP = 6

// Airline programs earn/redeem "miles"; everything else is "points". Keyed by a
// substring of source_platform so naming drift doesn't break the unit.
const MILES_PLATFORMS = ['mileageplus', 'aadvantage', 'skymiles', 'flying blue', 'aeroplan', 'mileage plan']

interface ListingRow {
  title: string | null
  source_platform: string | null
  format: string | null
  points_required: number | null
  current_bid: number | null
  minimum_bid: number | null
  event_date: string | null
  close_date: string | null
  detail_url: string | null
}

function unitFor(platform: string | null): string {
  const p = (platform ?? '').toLowerCase()
  return MILES_PLATFORMS.some((m) => p.includes(m)) ? 'miles' : 'points'
}

/** Parse a leading YYYY-MM-DD out of a (possibly messy / range) date string. */
function fmtDate(value: string | null, prefix = ''): string | null {
  if (!value) return null
  const m = value.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const month = MONTHS[parseInt(m[2], 10) - 1]
  if (!month) return null
  const day = parseInt(m[3], 10)
  return `${prefix}${month} ${day}`
}

function cleanTitle(title: string | null): string {
  return (title ?? '')
    .replace(/[®™]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140)
}

function pointsLabel(row: ListingRow): string | null {
  const unit = unitFor(row.source_platform)
  if (row.format === 'redeem') {
    if (typeof row.points_required === 'number' && row.points_required > 0) {
      return `${row.points_required.toLocaleString('en-US')} ${unit}`
    }
    return null
  }
  // bid
  const n = row.current_bid ?? row.minimum_bid
  if (typeof n === 'number' && n > 0) {
    const verb = row.current_bid ? 'Current bid' : 'Bids from'
    return `${verb} ${n.toLocaleString('en-US')} ${unit}`
  }
  return 'Points auction'
}

function toItem(row: ListingRow): TopExperienceItem {
  const isBid = row.format === 'bid'
  return {
    title: cleanTitle(row.title),
    program_label: (row.source_platform ?? '').trim(),
    format: isBid ? 'bid' : 'redeem',
    points_label: pointsLabel(row),
    deadline: fmtDate(row.close_date, 'Closes '),
    event_label: fmtDate(row.event_date),
    link_url: row.detail_url ?? '',
    is_auction: isBid,
  }
}

export async function getTopExperiences(supabase: SupabaseClient): Promise<TopExperienceItem[]> {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const freshSince = new Date(now.getTime() - FRESH_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('experience_listings')
    .select(
      'title, source_platform, format, points_required, current_bid, minimum_bid, event_date, close_date, detail_url, first_seen_at, status',
    )
    .eq('status', 'active')
    .in('format', ['redeem', 'bid'])
    .gte('first_seen_at', freshSince)
    .or(`close_date.is.null,close_date.gte.${today}`)

  const rows = (data ?? []) as (ListingRow & { first_seen_at: string })[]

  // Keep only genuine points plays (a redeem with a price, or any bid).
  const eligible = rows.filter((r) => {
    if (r.format === 'bid') return true
    return typeof r.points_required === 'number' && r.points_required > 0
  })

  // Collapse same-event listings that differ only by date/price (e.g. the same
  // Ariana Grande suite offered on 15/16/20 August). Key = title with trailing
  // "on <Month> <day>" / "- <Month> <day>" and any date stripped. Keep the
  // cheapest of the group so the section leads with the best value, not three
  // near-duplicate rows.
  const priceOf = (r: ListingRow) =>
    r.points_required ?? r.current_bid ?? r.minimum_bid ?? Number.MAX_SAFE_INTEGER
  const dedupKey = (r: ListingRow) =>
    `${r.source_platform ?? ''}|` +
    (r.title ?? '')
      .toLowerCase()
      .replace(/[®™]/g, '')
      // Strip a trailing " on …" / " - …" date clause that contains a month
      // name (handles both "on 15 August" and "on August 15").
      .replace(/\s+(on|-)\s+[^,]*\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b.*$/i, '')
      .replace(/\d{4}-\d{2}-\d{2}/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  const bestByEvent = new Map<string, ListingRow>()
  for (const r of eligible) {
    const k = dedupKey(r)
    const prev = bestByEvent.get(k)
    if (!prev || priceOf(r) < priceOf(prev)) bestByEvent.set(k, r)
  }
  const deduped = [...bestByEvent.values()]

  // Redeem before bid; within each, soonest close first (nulls last), then
  // cheapest first as a stable tiebreak.
  const rank = (r: ListingRow) => (r.format === 'redeem' ? 0 : 1)
  deduped.sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b)
    const ca = a.close_date ?? '9999-12-31'
    const cb = b.close_date ?? '9999-12-31'
    if (ca !== cb) return ca.localeCompare(cb)
    const pa = a.points_required ?? a.current_bid ?? a.minimum_bid ?? Number.MAX_SAFE_INTEGER
    const pb = b.points_required ?? b.current_bid ?? b.minimum_bid ?? Number.MAX_SAFE_INTEGER
    return pa - pb
  })

  return deduped.slice(0, CAP).map(toItem)
}
