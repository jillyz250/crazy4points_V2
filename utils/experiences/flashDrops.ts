import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

/**
 * Flash-drop email alerts.
 *
 * United's "100 Mile Drop" and Marriott Moments' "1-Point Drop" are near-free,
 * limited-quantity, ~24h flash sales. The scraper now catches them, but Jill
 * shouldn't have to watch a dashboard — the moment one is scraped, this emails
 * her so she can post it (or grab it) while it's live. Deduped via
 * experience_listings.flash_alert_sent_at so each drop is emailed exactly once.
 */

// Trigger on ANYTHING flash-type: a near-free price (<=100 miles/points, tunable
// via FLASH_DROP_MAX_POINTS) OR a title that reads like a flash sale / drop /
// limited-time offer. Covers "100 Mile Drop", "1-Point Drop", "Flash Sale",
// "Limited Time", "Last Chance", etc. across United Exclusives + Marriott Moments.
const MAX_POINTS = Number(process.env.FLASH_DROP_MAX_POINTS ?? 100)
const DROP_TITLE = /\bflash\b|\bdrop\b|\b1[\s-]?point\b|limited[\s-]?time|last[\s-]?chance|24[\s-]?hour/i

type FlashRow = {
  id: string
  title: string | null
  program_slug: string | null
  source_platform: string | null
  location: string | null
  points_required: number | null
  current_bid: number | null
  minimum_bid: number | null
  close_date: string | null
  detail_url: string | null
}

function priceOf(l: FlashRow): number | null {
  const vals = [l.points_required, l.current_bid, l.minimum_bid].filter((v): v is number => v != null)
  return vals.length ? Math.min(...vals) : null
}

/**
 * Find newly-scraped ultra-cheap drops for a program and email Jill about each
 * (once). Safe to call after every program scrape; does nothing when there's
 * nothing new or when Resend isn't configured.
 */
export async function alertFlashDrops(supabase: SupabaseClient, programSlug: string): Promise<number> {
  const nowIso = new Date().toISOString()
  const { data } = await supabase
    .from('experience_listings')
    .select('id, title, program_slug, source_platform, location, points_required, current_bid, minimum_bid, close_date, detail_url')
    .eq('program_slug', programSlug)
    .eq('status', 'active')
    .is('flash_alert_sent_at', null)
    .or(`close_date.is.null,close_date.gte.${nowIso}`)
    .limit(50)

  const candidates = ((data ?? []) as FlashRow[]).filter((l) => {
    const p = priceOf(l)
    return (p != null && p <= MAX_POINTS) || DROP_TITLE.test(l.title ?? '')
  })
  if (candidates.length === 0) return 0

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.BRIEF_RECIPIENT ?? 'jillzeller6@gmail.com'
  const from = process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>'
  if (!apiKey) {
    // No email configured (e.g. local run) — still mark them so we don't spam later.
    await supabase.from('experience_listings').update({ flash_alert_sent_at: nowIso }).in('id', candidates.map((c) => c.id))
    return 0
  }
  const resend = new Resend(apiKey)

  let sent = 0
  for (const l of candidates) {
    const price = priceOf(l)
    const priceLabel = price != null ? `${price.toLocaleString()} ${/point/i.test(l.title ?? '') ? 'points' : 'miles'}` : 'a flash-drop price'
    const closeLabel = l.close_date ? new Date(l.close_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'soon'
    const program = l.source_platform ?? l.program_slug ?? 'a loyalty program'
    const subject = `Flash drop: ${l.title?.slice(0, 70) ?? 'ultra-cheap experience'} — ${priceLabel}`
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px">
        <p style="font-size:18px;font-weight:bold;color:#6B2D8F;margin:0 0 4px">Flash drop spotted</p>
        <p style="font-size:15px;margin:0 0 12px">A near-free experience just appeared on <b>${program}</b>. These sell out fast.</p>
        <table style="font-size:14px;line-height:1.6">
          <tr><td style="color:#666;padding-right:12px">What</td><td><b>${l.title ?? ''}</b></td></tr>
          <tr><td style="color:#666">Price</td><td><b>${priceLabel}</b></td></tr>
          ${l.location ? `<tr><td style="color:#666">Where</td><td>${l.location}</td></tr>` : ''}
          <tr><td style="color:#666">Closes</td><td>${closeLabel}</td></tr>
        </table>
        ${l.detail_url ? `<p style="margin:16px 0"><a href="${l.detail_url}" style="background:#6B2D8F;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold">View the drop &rarr;</a></p>` : ''}
        <p style="font-size:12px;color:#999;margin-top:16px">Auto-detected by the crazy4points experiences watcher. Consider a fast social + newsletter mention.</p>
      </div>`
    try {
      const { error } = await resend.emails.send({ from, to, subject, html })
      if (!error) {
        await supabase.from('experience_listings').update({ flash_alert_sent_at: nowIso }).eq('id', l.id)
        sent++
      } else {
        console.error('[flash-drops] Resend error:', error)
      }
    } catch (err) {
      console.error('[flash-drops] send failed:', err instanceof Error ? err.message : String(err))
    }
  }
  return sent
}
