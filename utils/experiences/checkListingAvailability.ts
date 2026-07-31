/**
 * checkListingAvailability — is a live experience listing actually still bookable?
 *
 * The watch (runExperiencesWatch) only scrapes each program's CATALOG page, so it
 * knows a listing exists but not whether its DETAIL page has sold out. Marriott
 * Bonvoy Moments in particular keep sold-out experiences listed (every package
 * shows "Sold out"), so they surfaced in the finder as bookable dead-ends.
 *
 * This fetches one listing's detail page (Firecrawl, same as the watch) and asks
 * Haiku a single conservative question: is there ANY way left to book/redeem, or
 * is every option sold out? Deliberately biased toward "not sold out" so we never
 * hide a live deal on a bad read — a sold-out row is only dimmed and sorted last,
 * and it's re-checked daily, so a false negative self-corrects.
 *
 * Facts only; we never store or republish source copy.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'

export interface AvailabilityResult {
  /** True only when the detail page shows no bookable/redeemable option left. */
  soldOut: boolean
  /** False when we couldn't fetch/read the page — caller should leave sold_out unchanged. */
  checked: boolean
  reason: string
}

async function firecrawlMarkdown(url: string): Promise<string> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return ''
  try {
    const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      // JS-heavy listing pages need a real render wait (proven in the watch).
      body: JSON.stringify({ url, formats: ['markdown'], waitFor: 8000 }),
      signal: AbortSignal.timeout(75_000),
    })
    const json = await res.json()
    return (json?.data?.markdown as string) ?? ''
  } catch {
    return ''
  }
}

const PROMPT = (md: string) =>
  `You are checking whether a single loyalty "experience" listing is FULLY sold out. Below is the rendered text of the experience's own page.\n\n` +
  `Answer STRICTLY as compact JSON: {"sold_out": boolean, "reason": string (max 12 words)}.\n\n` +
  `Rules:\n` +
  `- sold_out = true ONLY if there is no way left to book, redeem, bid, or register — every package, date, ticket, or option is marked sold out / unavailable / no longer available / registration closed.\n` +
  `- sold_out = false if ANY package, date, or option is still bookable or redeemable.\n` +
  `- sold_out = false if the page is a generic catalog, an error page, a login wall, or you cannot tell.\n` +
  `- Be conservative: when in doubt, sold_out = false. Never flag a listing that still has a bookable option.\n\n` +
  `PAGE TEXT:\n${md.slice(0, 7000)}`

export async function checkListingAvailability(
  anthropic: Anthropic,
  detailUrl: string,
): Promise<AvailabilityResult> {
  const md = await firecrawlMarkdown(detailUrl)
  if (!md || md.trim().length < 40) {
    return { soldOut: false, checked: false, reason: 'no page content' }
  }
  let msg
  try {
    msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{ role: 'user', content: PROMPT(md) }],
    })
  } catch {
    return { soldOut: false, checked: false, reason: 'ai error' }
  }
  try {
    await logUsage(msg, 'experiences-availability:check')
  } catch {
    /* non-fatal */
  }
  const first = msg.content[0]
  const text = first && first.type === 'text' ? first.text : ''
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  try {
    const parsed = JSON.parse(cleaned) as { sold_out?: unknown; reason?: unknown }
    return {
      soldOut: parsed.sold_out === true,
      checked: true,
      reason: typeof parsed.reason === 'string' ? parsed.reason.slice(0, 80) : '',
    }
  } catch {
    // Unparseable read — treat as unchecked so we never flag on garbage.
    return { soldOut: false, checked: false, reason: 'unparseable ai response' }
  }
}

export interface SweepResult {
  scanned: number
  checked: number
  soldOutNow: number
  flippedToSoldOut: number
  flippedToAvailable: number
  failed: number
}

interface SweepRow {
  id: string
  detail_url: string | null
  sold_out: boolean
}

/**
 * Re-check availability for a batch of active redeem/access listings, oldest-
 * checked first, and update sold_out. Bounded per run (LIMIT) with a small
 * concurrency pool so a full catalog sweeps over a few daily runs without
 * blowing the cron's time budget. Auctions (format 'bid') are excluded — they
 * close by close_date, not "sold out".
 */
export async function runAvailabilitySweep(
  supabase: SupabaseClient,
  anthropic: Anthropic,
  opts: { limit?: number; concurrency?: number } = {},
): Promise<SweepResult> {
  const limit = opts.limit ?? 40
  const concurrency = opts.concurrency ?? 6

  const { data, error } = await supabase
    .from('experience_listings')
    .select('id, detail_url, sold_out')
    .eq('status', 'active')
    .not('detail_url', 'is', null)
    .in('format', ['redeem', 'access'])
    .order('availability_checked_at', { ascending: true, nullsFirst: true })
    .limit(limit)
  if (error) throw new Error(`availability sweep query failed: ${error.message}`)

  const rows = (data ?? []) as SweepRow[]
  const result: SweepResult = {
    scanned: rows.length,
    checked: 0,
    soldOutNow: 0,
    flippedToSoldOut: 0,
    flippedToAvailable: 0,
    failed: 0,
  }

  let cursor = 0
  async function worker() {
    while (cursor < rows.length) {
      const row = rows[cursor++]
      const nowIso = new Date().toISOString()
      const res = await checkListingAvailability(anthropic, row.detail_url as string)
      if (!res.checked) {
        result.failed++
        // Still stamp the attempt so a persistently-broken URL doesn't starve the queue.
        await supabase.from('experience_listings').update({ availability_checked_at: nowIso }).eq('id', row.id)
        continue
      }
      result.checked++
      if (res.soldOut) result.soldOutNow++
      if (res.soldOut && !row.sold_out) result.flippedToSoldOut++
      if (!res.soldOut && row.sold_out) result.flippedToAvailable++
      await supabase
        .from('experience_listings')
        .update({ sold_out: res.soldOut, availability_checked_at: nowIso })
        .eq('id', row.id)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, () => worker()))
  return result
}
