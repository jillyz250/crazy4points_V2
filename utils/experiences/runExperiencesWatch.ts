/**
 * runExperiencesWatch — the monitoring engine for loyalty "experiences" listings.
 *
 * For one program: scrape its experiences page (Firecrawl), parse listings to
 * structured JSON (Haiku), upsert into experience_listings with change detection,
 * mark vanished listings closed, log scraper health to experience_scrape_runs, and
 * refresh the public `experiences` directory row's recent_highlights.
 *
 * Facts only + our own summaries downstream; we never republish source copy/images.
 * Phase 1: Wyndham. Generalizes via EXPERIENCE_PROGRAMS.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'

export interface ExperienceProgram {
  program_slug: string // loyalty program, e.g. 'wyndham'
  directory_slug: string // row slug in the existing `experiences` directory table
  source_platform: string // human label of the hosting platform
  // Pages to scrape and aggregate. Small catalogs use one complete page; big
  // catalogs (Marriott, 298 listings) use curated views — "ending soon" (the
  // bid-relevant closing auctions) + "popular" — rather than mirroring hundreds.
  // `complete: false` means we're scraping a curated subset, so we do NOT
  // auto-close a listing just because it rotated off a page (stale rule instead).
  list_urls: string[]
  complete: boolean
}

export const EXPERIENCE_PROGRAMS: ExperienceProgram[] = [
  {
    program_slug: 'wyndham',
    directory_slug: 'wyndham-rewards-experiences',
    source_platform: 'Wyndham Rewards Experiences',
    list_urls: ['https://wyndhamrewardsexperiences.wyndhamrewards.com/iSynApp/allAuction.action'],
    complete: true,
  },
  {
    program_slug: 'marriott-bonvoy',
    directory_slug: 'marriott-bonvoy-moments',
    source_platform: 'Marriott Bonvoy Moments',
    // 298-item catalog. Scrape ALL current US listings (so the engine's first-seen
    // detection catches brand-new drops, incl. fast-selling buy-now items) plus
    // ending-soon (closing auctions). ~124 US listings; ~6 AI chunks (~$2/mo daily).
    list_urls: [
      'https://moments.marriottbonvoy.com/en-us/region/united-states',
      'https://moments.marriottbonvoy.com/en-us/ending-soon',
    ],
    complete: false,
  },
  {
    program_slug: 'hilton',
    directory_slug: 'hilton-honors-experiences',
    source_platform: 'Hilton Honors Experiences',
    list_urls: ['https://experiences.hiltonhonors.com'],
    complete: true,
  },
  {
    program_slug: 'delta',
    directory_slug: 'delta-skymiles-experiences',
    source_platform: 'Delta SkyMiles Experiences',
    list_urls: ['https://www.skymilesexperiences.com'],
    complete: true,
  },
  // Capital One Entertainment (capitalone.com/entertainment) tested but parses
  // zero clean listings (marketing page, not a catalog) — left out until a
  // scrapeable listing URL is found. Emirates/Bilt/Hyatt: candidates pending a
  // clean per-program listing URL.
]

interface ParsedListing {
  title: string
  points: number | null
  format: 'bid' | 'redeem'
  category: string | null
  location: string | null
  event_date: string | null
  detail_url: string | null
}

export interface WatchResult {
  program_slug: string
  found: number
  new: number
  changed: number
  closed: number
  success: boolean
  error?: string
}

async function firecrawlMarkdown(url: string): Promise<string> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return ''
  const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    // JS-heavy auction site; needs a real wait to render (proven in testing).
    body: JSON.stringify({ url, formats: ['markdown'], waitFor: 8000 }),
    signal: AbortSignal.timeout(75_000),
  })
  const json = await res.json()
  return (json?.data?.markdown as string) ?? ''
}

const CHUNK = 14_000
const MAX_CHUNKS = 8 // safety cap (~112k chars); big catalogs use curated US pages

async function parseChunk(anthropic: Anthropic, chunk: string, program: ExperienceProgram): Promise<ParsedListing[]> {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `Extract every distinct experience listing in this fragment of a ${program.source_platform} page. Return ONLY a JSON array; one object per listing with exactly these keys: {"title":string,"points":int|null (the current bid or redeem points),"format":"bid"|"redeem","category":string|null (music/sports/entertainment/etc),"location":string|null,"event_date":string|null,"detail_url":string|null (the listing's own page URL if present)}. Skip navigation, footer, category headers, and promo banners. If the fragment has no listings, return [].\n\n${chunk}`,
      },
    ],
  })
  try {
    await logUsage(msg, 'experiences-watch:parse', { program: program.program_slug })
  } catch {
    /* non-fatal */
  }
  const first = msg.content[0]
  const text = first && first.type === 'text' ? first.text : '[]'
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  try {
    const arr = JSON.parse(cleaned)
    return Array.isArray(arr) ? (arr as ParsedListing[]) : []
  } catch {
    return []
  }
}

/**
 * Chunk large pages so nothing past the first ~16k is silently dropped, and run
 * the chunk parses in parallel to keep the cron well under its time budget.
 */
async function parseListings(markdown: string, program: ExperienceProgram): Promise<ParsedListing[]> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || !markdown) return []
  const anthropic = new Anthropic({ apiKey: key })
  const slices: string[] = []
  for (let i = 0; i < markdown.length && slices.length < MAX_CHUNKS; i += CHUNK) {
    slices.push(markdown.slice(i, i + CHUNK))
  }
  const results = await Promise.all(slices.map((s) => parseChunk(anthropic, s, program)))
  return results.flat()
}

/** Stable dedup key: a listing id from the detail URL if present, else title+date. */
function listingKey(programSlug: string, l: ParsedListing): string {
  if (l.detail_url) {
    const m = l.detail_url.match(/([0-9]{5,})/)
    if (m) return `${programSlug}:listing:${m[1]}`
  }
  const t = (l.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  const d = (l.event_date || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20)
  return `${programSlug}:${t}:${d}`
}

export async function runExperiencesWatch(
  supabase: SupabaseClient,
  program: ExperienceProgram,
): Promise<WatchResult> {
  const runStart = new Date().toISOString()
  const now = runStart

  // Scrape each configured page in parallel, parse, and aggregate + dedup across
  // them (e.g. Marriott US-region + ending-soon may overlap).
  const perUrl = await Promise.all(
    program.list_urls.map(async (url) => {
      let md = ''
      try {
        md = await firecrawlMarkdown(url)
      } catch {
        md = ''
      }
      const listings = md.length > 0 ? await parseListings(md, program) : []
      return { ok: md.length > 0, listings }
    }),
  )
  const byKey = new Map<string, ParsedListing>()
  for (const r of perUrl) {
    for (const l of r.listings) {
      if (!l || !l.title) continue
      const k = listingKey(program.program_slug, l)
      if (!byKey.has(k)) byKey.set(k, l)
    }
  }
  const httpOk = perUrl.some((r) => r.ok)
  const parsed = [...byKey.values()]
  const success = httpOk && parsed.length > 0

  // Existing active listings for this program.
  const { data: existingRows } = await supabase
    .from('experience_listings')
    .select('id, source_listing_key, current_bid, points_required, status')
    .eq('program_slug', program.program_slug)
  const existing = new Map((existingRows ?? []).map((r) => [r.source_listing_key as string, r]))
  const seen = new Set<string>()

  let newCount = 0
  let changed = 0
  const rows: Record<string, unknown>[] = []
  const pendingChanges: Array<{
    key: string
    change_type: string
    field_name?: string | null
    old_value?: string | null
    new_value?: string | null
  }> = []

  for (const l of parsed) {
    if (!l || !l.title) continue
    const key = listingKey(program.program_slug, l)
    seen.add(key)
    const isBid = l.format === 'bid'
    // first_seen_at omitted on purpose: DB default sets it on insert, and it's
    // left unchanged on update (PostgREST only updates columns present here).
    rows.push({
      program_slug: program.program_slug,
      source_platform: program.source_platform,
      source_listing_key: key,
      title: l.title,
      detail_url: l.detail_url ?? null,
      category: l.category ?? null,
      location: l.location ?? null,
      format: l.format ?? null,
      current_bid: isBid ? l.points ?? null : null,
      points_required: !isBid ? l.points ?? null : null,
      event_date: l.event_date ?? null,
      raw_listing_blob: l,
      status: 'active',
      status_reason: null,
      last_seen_at: now,
      last_checked_at: now,
      updated_at: now,
    })
    const prev = existing.get(key)
    if (!prev) {
      newCount++
      pendingChanges.push({ key, change_type: 'new', new_value: l.title })
    } else {
      const prevPoints = (prev.current_bid ?? prev.points_required) as number | null
      const newPoints = l.points
      if (prevPoints != null && newPoints != null && prevPoints !== newPoints) {
        changed++
        pendingChanges.push({
          key,
          change_type: 'points',
          field_name: isBid ? 'current_bid' : 'points_required',
          old_value: String(prevPoints),
          new_value: String(newPoints),
        })
      }
    }
  }

  // Batch upsert (insert-or-update on the unique key) in pages of 100.
  const keyToId = new Map<string, string>()
  for (let i = 0; i < rows.length; i += 100) {
    const { data: up } = await supabase
      .from('experience_listings')
      .upsert(rows.slice(i, i + 100), { onConflict: 'program_slug,source_listing_key' })
      .select('id, source_listing_key')
    for (const r of up ?? []) keyToId.set(r.source_listing_key as string, r.id as string)
  }

  // Batch-insert change rows (resolve listing_id from the upsert result).
  const changeRows = pendingChanges
    .map((c) => ({
      listing_id: keyToId.get(c.key),
      change_type: c.change_type,
      field_name: c.field_name ?? null,
      old_value: c.old_value ?? null,
      new_value: c.new_value ?? null,
      detected_at: now,
    }))
    .filter((c) => c.listing_id)
  if (changeRows.length) await supabase.from('experience_listing_changes').insert(changeRows)

  // Close stale listings. For a COMPLETE scrape, "gone this run" means closed.
  // For a CURATED/partial scrape (e.g. Marriott ending-soon + popular), a listing
  // rotating off a page does NOT mean it closed, so we only close what hasn't been
  // seen for 7+ days. Both paths run only on a successful scrape so a failed run
  // never mass-closes.
  let closed = 0
  const staleCutoff = new Date(Date.now() - 7 * 86_400_000).toISOString()
  if (success) {
    // Re-fetch last_seen_at for the stale check (existing rows only had a subset).
    const { data: activeRows } = await supabase
      .from('experience_listings')
      .select('id, source_listing_key, last_seen_at')
      .eq('program_slug', program.program_slug)
      .eq('status', 'active')
    for (const r of activeRows ?? []) {
      const goneThisRun = !seen.has(r.source_listing_key as string)
      const stale = (r.last_seen_at as string) < staleCutoff
      const shouldClose = program.complete ? goneThisRun : goneThisRun && stale
      if (shouldClose) {
        await supabase
          .from('experience_listings')
          .update({
            status: 'closed',
            status_reason: program.complete ? 'gone_from_source' : 'stale_7d',
            updated_at: now,
          })
          .eq('id', r.id)
        await supabase.from('experience_listing_changes').insert({
          listing_id: r.id,
          change_type: 'status',
          field_name: 'status',
          old_value: 'active',
          new_value: 'closed',
          detected_at: now,
        })
        closed++
      }
    }
  }

  // Scraper-health log — makes "HTTP 200 but parsed zero" visible.
  await supabase.from('experience_scrape_runs').insert({
    program_slug: program.program_slug,
    run_started_at: runStart,
    run_completed_at: now,
    http_ok: httpOk,
    items_found: parsed.length,
    items_parsed: parsed.length,
    items_new: newCount,
    items_changed: changed,
    items_closed: closed,
    success,
    error_message: success ? null : httpOk ? 'parsed zero listings' : 'scrape returned empty',
  })

  // Refresh the public directory row's recent_highlights (facts only, our phrasing).
  if (success) {
    const { data: active } = await supabase
      .from('experience_listings')
      .select('title, current_bid, points_required, format, category')
      .eq('program_slug', program.program_slug)
      .eq('status', 'active')
      .order('current_bid', { ascending: false, nullsFirst: false })
      .limit(40) // effectively all current listings, not a top-N teaser
    const cap = (s: string | null | undefined) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
    const highlights = (active ?? []).map((a) => {
      const pts =
        a.format === 'bid'
          ? a.current_bid != null
            ? `Current bid ${Number(a.current_bid).toLocaleString()} points`
            : 'Auction'
          : a.points_required != null
            ? `${Number(a.points_required).toLocaleString()} points`
            : 'Points redemption'
      return { title: a.title as string, detail: a.category ? `${cap(a.category)} · ${pts}` : pts }
    })
    await supabase
      .from('experiences')
      .update({ recent_highlights: highlights, highlights_updated_at: now })
      .eq('slug', program.directory_slug)
  }

  return {
    program_slug: program.program_slug,
    found: parsed.length,
    new: newCount,
    changed,
    closed,
    success,
    error: success ? undefined : httpOk ? 'parsed zero listings' : 'scrape returned empty',
  }
}
