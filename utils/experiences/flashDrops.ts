import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

/**
 * Flash-drop email alerts.
 *
 * United's "100 Mile Drop", Marriott Moments' "1-Point Drop", and any flash sale
 * are near-free, limited-quantity, ~24h drops. The scraper catches them; this
 * emails Jill so she can post/grab them while live. Design (per Jill):
 *  - Fire on ANYTHING flash-type: <=100 miles/points, or a flash/drop/limited-time
 *    title (covers United Exclusives + Marriott Moments).
 *  - COMBINE every pending drop into ONE email (never "pick the best").
 *  - Hard cap of ONE email per hour, so a bug or poisoned listing can't blast the
 *    inbox. Anything not yet emailed rides the next hourly send.
 *  - Deduped via experience_listings.flash_alert_sent_at so each drop sends once.
 * Called once per watcher run (across all programs), after the scrape.
 */

const MAX_POINTS = Number(process.env.FLASH_DROP_MAX_POINTS ?? 100)
const DROP_TITLE = /\bflash\b|\bdrop\b|\b1[\s-]?point\b|limited[\s-]?time|last[\s-]?chance|24[\s-]?hour/i
const RATE_LIMIT_MS = 60 * 60 * 1000 // one email per hour, max

type FlashRow = {
  id: string
  title: string | null
  program_slug: string | null
  source_platform: string | null
  location: string | null
  points_required: number | null
  current_bid: number | null
  minimum_bid: number | null
  quantity_available: number | null
  close_date: string | null
  detail_url: string | null
}

function priceOf(l: FlashRow): number | null {
  const vals = [l.points_required, l.current_bid, l.minimum_bid].filter((v): v is number => v != null)
  return vals.length ? Math.min(...vals) : null
}

/**
 * Email Jill about every not-yet-alerted flash drop, combined into one message,
 * at most once per hour. Returns the number of drops included (0 if none or if
 * rate-limited). Safe to call every run.
 */
export async function alertFlashDrops(supabase: SupabaseClient): Promise<number> {
  const nowIso = new Date().toISOString()
  const { data } = await supabase
    .from('experience_listings')
    .select('id, title, program_slug, source_platform, location, points_required, current_bid, minimum_bid, quantity_available, close_date, detail_url')
    .eq('status', 'active')
    .is('flash_alert_sent_at', null)
    .or(`close_date.is.null,close_date.gte.${nowIso}`)
    .limit(200)

  const drops = ((data ?? []) as FlashRow[])
    .filter((l) => {
      const p = priceOf(l)
      return (p != null && p <= MAX_POINTS) || DROP_TITLE.test(l.title ?? '')
    })
    .sort((a, b) => (priceOf(a) ?? 9e9) - (priceOf(b) ?? 9e9) || (a.close_date ?? '~').localeCompare(b.close_date ?? '~'))
  if (drops.length === 0) return 0

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return 0 // no email configured (local) — leave for prod, don't mark

  // Rate limit: skip if any flash email went out within the last hour.
  const { data: last } = await supabase
    .from('experience_listings')
    .select('flash_alert_sent_at')
    .not('flash_alert_sent_at', 'is', null)
    .order('flash_alert_sent_at', { ascending: false })
    .limit(1)
  const lastSent = last?.[0]?.flash_alert_sent_at ? Date.parse(last[0].flash_alert_sent_at as string) : 0
  if (Date.now() - lastSent < RATE_LIMIT_MS) return 0

  const cards = drops.map((l) => {
    const price = priceOf(l)
    const unit = /point/i.test(l.title ?? '') ? 'points' : 'miles'
    const priceLabel = price != null ? `${price.toLocaleString()} ${unit}` : 'flash-drop price'
    const closeLabel = l.close_date ? new Date(l.close_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'soon'
    const program = l.source_platform ?? l.program_slug ?? 'a loyalty program'
    return `
      <div style="border:1px solid #E6DEEE;border-radius:10px;padding:14px 16px;margin:0 0 12px">
        <p style="font-size:16px;font-weight:bold;color:#1A1A1A;margin:0 0 8px">${l.title ?? 'Flash drop'}</p>
        <table style="font-size:14px;line-height:1.6">
          <tr><td style="color:#666;padding-right:12px">Price</td><td><b style="color:#6B2D8F">${priceLabel}</b></td></tr>
          <tr><td style="color:#666">Program</td><td>${program}</td></tr>
          ${l.location ? `<tr><td style="color:#666">Where</td><td>${l.location}</td></tr>` : ''}
          ${l.quantity_available != null ? `<tr><td style="color:#666">Left</td><td><b>${l.quantity_available.toLocaleString()}</b> available</td></tr>` : ''}
          <tr><td style="color:#666">Closes</td><td>${closeLabel}</td></tr>
        </table>
        ${l.detail_url ? `<p style="margin:12px 0 0"><a href="${l.detail_url}" style="background:#6B2D8F;color:#fff;padding:9px 16px;border-radius:6px;text-decoration:none;font-weight:bold">View the drop &rarr;</a></p>` : ''}
      </div>`
  })

  const subject = drops.length === 1
    ? `Flash drop: ${drops[0].title?.slice(0, 68) ?? 'ultra-cheap experience'}`
    : `${drops.length} flash drops spotted`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px">
      <p style="font-size:18px;font-weight:bold;color:#6B2D8F;margin:0 0 4px">${drops.length === 1 ? 'Flash drop spotted' : `${drops.length} flash drops spotted`}</p>
      <p style="font-size:15px;margin:0 0 14px">Near-free, limited-quantity ${drops.length === 1 ? 'experience' : 'experiences'} just appeared. These sell out fast.</p>
      ${cards.join('')}
      <p style="font-size:12px;color:#999;margin-top:8px">Auto-detected by the crazy4points experiences watcher. Max one alert per hour.</p>
    </div>`

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>',
    to: process.env.BRIEF_RECIPIENT ?? 'jillzeller6@gmail.com',
    subject,
    html,
  })
  if (error) {
    console.error('[flash-drops] Resend error:', error)
    return 0
  }
  await supabase.from('experience_listings').update({ flash_alert_sent_at: nowIso }).in('id', drops.map((d) => d.id))
  return drops.length
}
