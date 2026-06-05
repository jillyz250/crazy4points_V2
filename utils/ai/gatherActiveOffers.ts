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

interface AlertRow {
  id: string
  title: string
  slug: string
  summary: string | null
  type: string
  end_date: string | null
}

function fmtDeadline(endDate: string | null): string | null {
  if (!endDate) return null
  const m = endDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const month = MONTHS[parseInt(m[2], 10) - 1]
  const day = parseInt(m[3], 10)
  return month ? `Ends ${month} ${day}` : null
}

function toItem(a: AlertRow): OfferItem {
  return {
    headline: a.title,
    blurb: (a.summary ?? '').replace(/\s+/g, ' ').trim().slice(0, 160),
    link_url: `/alerts/${a.slug}`,
    deadline: fmtDeadline(a.end_date),
    alert_id: a.id,
  }
}

export async function getActiveOffers(supabase: SupabaseClient): Promise<ActiveOffers> {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('alerts')
    .select('id, title, slug, summary, type, end_date')
    .eq('status', 'published')
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('end_date', { ascending: true, nullsFirst: false })

  const rows = (data ?? []) as AlertRow[]
  const pick = (pred: (t: string) => boolean): OfferItem[] =>
    rows.filter((r) => pred(r.type)).slice(0, PER_BUCKET).map(toItem)

  return {
    transfer_bonuses: pick((t) => t === 'transfer_bonus'),
    earning_promos: pick((t) => EARNING_TYPES.has(t)),
    purchase_bonuses: pick((t) => t === 'purchase_bonus'),
  }
}
