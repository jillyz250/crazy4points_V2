import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActiveOffers, OfferItem } from './newsletterSlots'

/**
 * Build the newsletter "Live Offers" section from currently-active published
 * alerts. Three buckets, mapped by alert type:
 *   - transfer_bonuses  <- type 'transfer_bonus'
 *   - earning_promos    <- limited_time_offer / status_promo / shopping_portal_bonus / dining_bonus / earn_rate_change / award_sale
 *   - purchase_bonuses  <- type 'purchase_bonus' (buy-points/miles)
 *
 * "Active" = published AND (no end_date OR end_date is today-or-later). Soonest
 * deadlines first; each bucket capped. Detection only - this auto-fills the
 * slot; the editor can trim before sending.
 *
 * Headlines are normalized so each line leads with the program name and the
 * trailing date clause is dropped (the deadline renders as its own tag, so a
 * title ending "... - Ends June 13" would otherwise show the date twice).
 */

const EARNING_TYPES = new Set([
  'limited_time_offer',
  'status_promo',
  'shopping_portal_bonus',
  'dining_bonus',
  'earn_rate_change',
  'award_sale',
])

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PER_BUCKET = 6

// Short, on-brand display names for the programs that lead these lines.
const SHORT_NAME: Record<string, string> = {
  amex: 'Amex',
  chase: 'Chase',
  citi: 'Citi',
  bilt: 'Bilt',
  'wells-fargo': 'Wells Fargo',
  'capital-one': 'Capital One',
  hyatt: 'Hyatt',
  hilton: 'Hilton',
  marriott: 'Marriott',
  wyndham: 'Wyndham',
  ihg: 'IHG',
  iprefer: 'iPrefer',
}

// Strip a trailing "- Ends June 13 / - Book by June 26 / - Register Now..."
// style date clause introduced by a dash. We only strip dash-introduced tails
// so we don't chop a legitimate mid-sentence "through".
const DATE_TAIL =
  /\s*[—–-]\s*(ends?|book by|register|through|thru|expires?|last day|complete|sale ends|live|starts?|valid|by|deadline)\b.*$/i

function deriveShortName(slug: string | null, name: string | null): string {
  if (slug && SHORT_NAME[slug]) return SHORT_NAME[slug]
  const cleaned = (name ?? '')
    .replace(/\b(Membership |One |My |Live )?Rewards\b/gi, '')
    .replace(/\b(Honors|Bonvoy|Privileges|iPrefer|Discovery|Circle|Club)\b/gi, '')
    .replace(/^World of /i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return cleaned || name || ''
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeHeadline(title: string, short: string, fullName: string): string {
  let t = (title ?? '').replace(/\s+/g, ' ').trim()
  t = t.replace(DATE_TAIL, '').trim()
  // Drop a leading "Transfer "/"Convert " verb so the program lands first.
  t = t.replace(/^(transfer|convert)\s+/i, '').trim()
  if (!short) return t
  // Treat the title as already program-led if, after ignoring a leading
  // "World of " (World of Hyatt) and comparing first words, it starts with the
  // program. The first-word check catches naming drift like short "Southwest
  // Rapid" vs a title that opens "Southwest Airlines ...".
  const stripLead = (s: string) => s.toLowerCase().replace(/^world of\s+/, '').trim()
  const firstWord = (s: string) => stripLead(s).split(/[\s:→—–-]+/)[0] ?? ''
  const lc = stripLead(t)
  const shortLc = stripLead(short)
  const leadsWithProgram =
    lc.startsWith(shortLc) ||
    (!!fullName && lc.startsWith(stripLead(fullName))) ||
    (firstWord(short).length > 2 && firstWord(t) === firstWord(short))
  if (leadsWithProgram) return t
  // Prefix the program name. Remove a stray in-title mention of it first so we
  // don't get "Hyatt: Up to 25% Off Hyatt This Summer".
  const deduped = t
    .replace(new RegExp(`\\b${escapeRe(short)}\\b`, 'i'), '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s:,–—-]+/, '')
    .trim()
  return `${short}: ${deduped || t}`
}

interface AlertRow {
  id: string
  title: string
  slug: string
  summary: string | null
  type: string
  end_date: string | null
  primary_program_id: string | null
}

interface ProgramLite {
  short: string
  name: string
}

function fmtDeadline(endDate: string | null): string | null {
  if (!endDate) return null
  const m = endDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const month = MONTHS[parseInt(m[2], 10) - 1]
  const day = parseInt(m[3], 10)
  return month ? `Ends ${month} ${day}` : null
}

function toItem(a: AlertRow, programs: Map<string, ProgramLite>): OfferItem {
  const prog = a.primary_program_id ? programs.get(a.primary_program_id) : undefined
  const headline = normalizeHeadline(a.title, prog?.short ?? '', prog?.name ?? '')
  return {
    headline,
    blurb: (a.summary ?? '').replace(/\s+/g, ' ').trim().slice(0, 160),
    link_url: `/alerts/${a.slug}`,
    deadline: fmtDeadline(a.end_date),
    alert_id: a.id,
  }
}

export async function getActiveOffers(supabase: SupabaseClient): Promise<ActiveOffers> {
  const today = new Date().toISOString().slice(0, 10)

  const [{ data }, { data: progRows }] = await Promise.all([
    supabase
      .from('alerts')
      .select('id, title, slug, summary, type, end_date, primary_program_id')
      .eq('status', 'published')
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('end_date', { ascending: true, nullsFirst: false }),
    supabase.from('programs').select('id, slug, name'),
  ])

  const programs = new Map<string, ProgramLite>()
  for (const p of (progRows ?? []) as Array<{ id: string; slug: string | null; name: string | null }>) {
    programs.set(p.id, { short: deriveShortName(p.slug, p.name), name: p.name ?? '' })
  }

  const rows = (data ?? []) as AlertRow[]
  const pick = (pred: (t: string) => boolean): OfferItem[] =>
    rows.filter((r) => pred(r.type)).slice(0, PER_BUCKET).map((r) => toItem(r, programs))

  return {
    transfer_bonuses: pick((t) => t === 'transfer_bonus'),
    earning_promos: pick((t) => EARNING_TYPES.has(t)),
    purchase_bonuses: pick((t) => t === 'purchase_bonus'),
  }
}
