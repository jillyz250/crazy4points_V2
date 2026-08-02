/**
 * runScheduleWatch — watch chunk-dropping airlines for schedule openings.
 *
 * Southwest (and, less formally, Alaska) release their flight schedule in
 * irregular CHUNKS, and Southwest pre-announces the date. Each opening is a
 * high-engagement "book now" moment worth a Facebook post + paid boost. This
 * reads each airline's current booking horizon from a reliable source, diffs it
 * against schedule_watch_state, and on a change drops a dashboard reminder:
 *   - ANNOUNCEMENT: a new next-extension date is published -> heads-up reminder.
 *   - OPENING: the current book-through date jumps forward -> reminder WITH a
 *     ready-to-post Facebook draft (brand voice) and an explicit "boost" step.
 *
 * First run per airline just seeds state (no reminders) so we never fire a
 * spurious "it opened!" on the very first observation. Config-driven: add an
 * airline by appending to AIRLINES.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'
import { generateFacebook } from '@/utils/ai/variants/generateFacebook'

interface WatchAirline {
  slug: string
  name: string
  /** Living page that states the current book-through date + next extension. */
  source_url: string
  /** Where the FB post should point people (goes in the first comment). */
  booking_url: string
}

export const AIRLINES: WatchAirline[] = [
  {
    slug: 'southwest',
    name: 'Southwest',
    source_url: 'https://upgradedpoints.com/news/southwest-extends-flight-schedule/',
    booking_url: 'https://www.southwest.com/air/booking/',
  },
  // Alaska/Atmos: chunk-drops by travel period but less formally announced —
  // add once a reliably-current source page is confirmed.
]

interface Horizon {
  current_through_date: string | null // ISO YYYY-MM-DD
  next_extension_date: string | null
  next_extension_target: string | null
}

export interface AirlineWatchResult {
  slug: string
  ok: boolean
  seeded?: boolean
  opened?: boolean
  announced?: boolean
  through?: string | null
  error?: string
}

async function firecrawlMarkdown(url: string): Promise<string> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return ''
  try {
    const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], waitFor: 4000 }),
      signal: AbortSignal.timeout(70_000),
    })
    const json = await res.json()
    return (json?.data?.markdown as string) ?? ''
  } catch {
    return ''
  }
}

async function extractHorizon(anthropic: Anthropic, name: string, md: string): Promise<Horizon | null> {
  const today = new Date().toISOString().slice(0, 10)
  const prompt =
    `Today is ${today}. Below is a page about ${name}'s flight-schedule booking horizon.\n` +
    `Extract STRICT JSON, no prose:\n` +
    `{"current_through_date": ISO YYYY-MM-DD you can CURRENTLY book through (null if unclear),\n` +
    ` "next_extension_date": ISO date the NEXT schedule extension is scheduled to happen (null if not stated),\n` +
    ` "next_extension_target": ISO date that next extension will open booking through (null if not stated)}\n` +
    `Only use dates the page actually states. Never guess.\n\nPAGE:\n${md.slice(0, 9000)}`
  let msg
  try {
    msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch {
    return null
  }
  try {
    await logUsage(msg, 'schedule-watch:extract', { airline: name })
  } catch {
    /* non-fatal */
  }
  const first = msg.content[0]
  const text = first && first.type === 'text' ? first.text : ''
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  try {
    const p = JSON.parse(cleaned) as Record<string, unknown>
    const iso = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
    return {
      current_through_date: iso(p.current_through_date),
      next_extension_date: iso(p.next_extension_date),
      next_extension_target: iso(p.next_extension_target),
    }
  } catch {
    return null
  }
}

function prettyDate(iso: string | null): string {
  if (!iso) return 'a new date'
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return iso
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${MONTHS[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}, ${m[1]}`
}

/** Insert a reminder unless one with the same title already exists (idempotent). */
async function addReminder(
  supabase: SupabaseClient,
  row: { title: string; notes: string; due_date: string; link: string | null },
): Promise<boolean> {
  const { data: existing } = await supabase.from('reminders').select('id').eq('title', row.title).limit(1)
  if (existing?.length) return false
  const { error } = await supabase.from('reminders').insert({ ...row, status: 'open' })
  if (error) throw new Error(`reminder insert failed: ${error.message}`)
  return true
}

async function buildFacebookDraft(a: WatchAirline, throughIso: string): Promise<string> {
  const when = prettyDate(throughIso)
  try {
    const fb = await generateFacebook({
      topic: {
        id: `schedule-open-${a.slug}-${throughIso}`,
        title: `${a.name} just opened its flight schedule through ${when}`,
        summary:
          `${a.name} extended its bookable flight schedule through ${when}. Booking as soon as a schedule opens ` +
          `often locks in the lowest fares and the best award availability, and ${a.name} charges no change or ` +
          `cancel fees, so if the price later drops you can rebook and get the difference back.`,
        fact_ledger: [],
        primary_intent: 'deal',
        programs: [a.slug],
        metadata: null,
      },
    })
    // fb.body already includes the hashtag line; fb.hashtags is only for callers
    // that render them separately. Appending would duplicate them.
    return fb.body.trim()
  } catch (err) {
    return `(Auto-draft failed: ${err instanceof Error ? err.message : String(err)} — write it via the facebook-post skill.)`
  }
}

export async function runScheduleWatch(
  supabase: SupabaseClient,
  anthropic: Anthropic,
): Promise<AirlineWatchResult[]> {
  const results: AirlineWatchResult[] = []
  const nowIso = new Date().toISOString()
  const today = nowIso.slice(0, 10)

  for (const a of AIRLINES) {
    try {
      const md = await firecrawlMarkdown(a.source_url)
      if (!md || md.length < 200) {
        results.push({ slug: a.slug, ok: false, error: 'no source content' })
        continue
      }
      const horizon = await extractHorizon(anthropic, a.name, md)
      if (!horizon || !horizon.current_through_date) {
        results.push({ slug: a.slug, ok: false, error: 'could not extract through-date' })
        continue
      }

      const { data: prev } = await supabase
        .from('schedule_watch_state')
        .select('current_through_date, next_extension_date')
        .eq('airline_slug', a.slug)
        .maybeSingle()

      let seeded = false
      let opened = false
      let announced = false

      if (!prev) {
        // First observation — seed only, never fire (we have no baseline).
        seeded = true
      } else {
        // OPENING: current through-date jumped forward (ISO strings sort chronologically).
        if (prev.current_through_date && horizon.current_through_date > prev.current_through_date) {
          const draft = await buildFacebookDraft(a, horizon.current_through_date)
          const when = prettyDate(horizon.current_through_date)
          opened = await addReminder(supabase, {
            title: `${a.name} opened its schedule through ${when} — post to FB and BOOST`,
            notes:
              `${a.name}'s schedule just extended through ${when} (was ${prettyDate(prev.current_through_date)}). ` +
              `This is the high-engagement moment: post now, then BOOST the post (paid) while people are searching.\n\n` +
              `Put the booking link in the FIRST COMMENT, not the post body: ${a.booking_url}\n\n` +
              `----- READY-TO-POST DRAFT (review before posting) -----\n\n${draft}`,
            due_date: today,
            link: a.booking_url,
          })
        }
        // ANNOUNCEMENT: a new next-extension date was published.
        if (
          horizon.next_extension_date &&
          horizon.next_extension_date !== prev.next_extension_date &&
          horizon.next_extension_date >= today
        ) {
          announced = await addReminder(supabase, {
            title: `${a.name} announced next schedule extension on ${prettyDate(horizon.next_extension_date)}`,
            notes:
              `Heads up: ${a.name} plans to extend its schedule on ${prettyDate(horizon.next_extension_date)}` +
              `${horizon.next_extension_target ? `, opening booking through ${prettyDate(horizon.next_extension_target)}` : ''}. ` +
              `When it actually opens you'll get a post-ready reminder — prep your boost budget.`,
            due_date: horizon.next_extension_date,
            link: a.source_url,
          })
        }
      }

      await supabase.from('schedule_watch_state').upsert(
        {
          airline_slug: a.slug,
          airline_name: a.name,
          source_url: a.source_url,
          current_through_date: horizon.current_through_date,
          next_extension_date: horizon.next_extension_date,
          next_extension_target: horizon.next_extension_target,
          last_checked_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: 'airline_slug' },
      )

      results.push({ slug: a.slug, ok: true, seeded, opened, announced, through: horizon.current_through_date })
    } catch (err) {
      results.push({ slug: a.slug, ok: false, error: err instanceof Error ? err.message : String(err) })
    }
  }
  return results
}
