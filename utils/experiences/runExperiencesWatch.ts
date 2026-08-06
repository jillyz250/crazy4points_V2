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
  // Card-issuer ACCESS programs: cardmember presale/access, not points. Listings
  // parse as format='access' (no points; bought with the card).
  {
    program_slug: 'chase',
    directory_slug: 'chase-experiences',
    source_platform: 'Chase Experiences',
    list_urls: ['https://www.chase.com/personal/events/experiences'],
    complete: true,
  },
  {
    program_slug: 'amex',
    directory_slug: 'amex-experiences',
    source_platform: 'Amex Experiences',
    list_urls: ['https://www.americanexpress.com/en-us/benefits/entertainment/'],
    complete: true,
  },
  {
    program_slug: 'united',
    directory_slug: 'united-mileageplus-exclusives',
    source_platform: 'United MileagePlus Exclusives',
    list_urls: ['https://exclusives.mileageplus.com'],
    complete: true,
  },
  {
    program_slug: 'citi',
    directory_slug: 'citi-entertainment',
    source_platform: 'Citi Entertainment',
    list_urls: ['https://www.citientertainment.com'],
    complete: true,
  },
  // Points-redeemable HOTEL experience catalogs. Both render a full, structured
  // catalog on their dedicated experience subdomains (verified live) — the
  // earlier "no catalog" test mistakenly hit their marketing landing pages
  // (hyatt.com/find, all.accor.com) instead. Curated subsets (complete:false):
  // large, rotating, region-weighted catalogs, so we use the stale rule rather
  // than auto-closing listings that rotate off a page. Both skew international.
  {
    program_slug: 'hyatt',
    directory_slug: 'world-of-hyatt-find',
    source_platform: 'World of Hyatt FIND',
    list_urls: ['https://experiences.hyatt.com/'],
    complete: false,
  },
  {
    program_slug: 'accor',
    directory_slug: 'accor-all-experiences',
    source_platform: 'ALL Limitless Experiences',
    // Individual experiences live on the category LISTING pages, not the hub —
    // the hub only shows category tiles (which parsed as junk). Scrape the four
    // experience categories; deliberately skip the points-SHOPPING portal
    // (electronics/fashion/home/etc.), which is retail, not experiences.
    list_urls: [
      'https://limitlessexperiences.accor.com/passion-sports',
      'https://limitlessexperiences.accor.com/entertainment',
      'https://limitlessexperiences.accor.com/passion-travel',
      'https://limitlessexperiences.accor.com/accor-taste',
    ],
    complete: false,
  },
  {
    program_slug: 'atmos',
    directory_slug: 'atmos-rewards-experiences',
    source_platform: 'Atmos Rewards Unlocked',
    // Alaska + Hawaiian combined program. Auctions + fixed-price experiences live
    // on a dedicated SPA host (unlocked.atmosrewards.com); the public
    // atmosrewards.com/auctions route is only a shell that never renders listings
    // (the earlier "messy" Atmos test hit that shell). Scrape all three "kind"
    // views: auction (bid), buy (Events & Travel), book (Experiences). Rotating
    // monthly catalog with historical/ended auctions kept visible -> complete:false.
    list_urls: [
      'https://unlocked.atmosrewards.com/listings?kind=auction',
      'https://unlocked.atmosrewards.com/listings?kind=buy',
      'https://unlocked.atmosrewards.com/listings?kind=book',
    ],
    complete: false,
  },
  // Tested but NOT added (parse zero / marketing pages, flagged by scraper health):
  // Flying Blue (flyingblue.com spend-miles), Bilt (biltrewards.com homepage),
  // Capital One (capitalone.com/entertainment). Emirates/Qatar/Virgin-Red/
  // Miles&More/Choice: 1-2 or messy. IHG/Aeroplan/Qantas/BA: blocked or
  // landing pages, no catalog. All stay guide-only in the directory.
]

interface ParsedListing {
  title: string
  points: number | null
  format: 'bid' | 'redeem' | 'access'
  category: string | null
  location: string | null
  event_date: string | null
  detail_url: string | null
  // Some platforms (e.g. Atmos) keep finished auctions visible with their
  // winning bid. `ended` lets us mark those closed instead of showing "active".
  ended?: boolean
}

export interface WatchResult {
  program_slug: string
  found: number
  new: number
  changed: number
  closed: number
  archived: number
  enriched: number
  reminders: number
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
        content: `Extract every distinct experience listing in this fragment of a ${program.source_platform} page. Return ONLY a JSON array; one object per listing with exactly these keys: {"title":string,"points":int|null (current bid or redeem points; null if it is cardmember access/presale paid with cash),"format":"bid"|"redeem"|"access" ("access" = cardmember presale/access bought with a card, not points),"category":string|null (music/sports/entertainment/etc),"location":string|null,"event_date":string|null,"detail_url":string|null (the listing's own page URL if present),"ended":boolean (true if this listing shows it has FINISHED - e.g. "Auction ended", "Winning Bid", "View history", "Sold Out", or a clearly past deadline - else false)}. Skip navigation, footer, category headers, and promo banners. If the fragment has no listings, return [].\n\n${chunk}`,
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

/**
 * Pull the auction/offer CLOSE date off one listing's own detail page. Robust
 * across the per-platform date formats (Wyndham "Close Date: Jul 24, 2026 08:00
 * PM EDT", Marriott "End Date: 16 Jul 2026", United "07/20/2026 09:00 CST").
 * Returns an ISO string, or null when nothing plausible is found — including
 * when a page omits the year and Haiku guesses a past date (we reject those so a
 * bad guess never hides a live listing or fires a phantom reminder).
 */
interface ListingFacts {
  close_date: string | null
  event_date: string | null
  bid_opens_at: string | null
}

/**
 * One Haiku call reads a listing's detail page and returns its dates. Uniform
 * across every platform (Marriott "End Date", Wyndham "Close Date", the iSynApp
 * auction sites, United) rather than a brittle regex per site - a wrong regex
 * is what produced false "bidding closed" labels before.
 *
 * Haiku returns raw values and a RELATIVE open countdown; the date maths is done
 * here in code, because a model computing "today + 56 days" is not reliable.
 */
async function extractListingFacts(anthropic: Anthropic, markdown: string, todayIso: string): Promise<ListingFacts> {
  const empty: ListingFacts = { close_date: null, event_date: null, bid_opens_at: null }
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 260,
    messages: [
      {
        role: 'user',
        content: `Today is ${todayIso}. This is an auction/experience detail page. Return ONLY this JSON, no prose:
{"close_date": ISO 8601 datetime when BIDDING CLOSES (the auction deadline / "End Date" / "Close Date"), or null;
 "event_date": ISO 8601 date when the EXPERIENCE happens (first date of any range), or null;
 "not_open_yet": true ONLY if the page shows a "Starting Bid" with NO current bid AND a countdown to when packages/bidding become available, else false;
 "opens_in_days": integer number of whole days in that "available in" countdown, or null}
If a year is missing, assume the soonest FUTURE date.

${markdown.slice(0, 12000)}`,
      },
    ],
  })
  try {
    await logUsage(msg, 'experiences-watch:listing-facts', {})
  } catch {
    /* non-fatal */
  }
  const first = msg.content[0]
  const text = first && first.type === 'text' ? first.text : '{}'
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(cleaned)
  } catch {
    return empty
  }
  const now = Date.now()
  const iso = (v: unknown): string | null => {
    if (typeof v !== 'string') return null
    const t = Date.parse(v)
    if (Number.isNaN(t)) return null
    // Reject implausible past dates (missing-year guesses land in the past).
    if (t < now - 2 * 86_400_000) return null
    return new Date(t).toISOString()
  }
  let opensAt: string | null = null
  if (raw.not_open_yet === true && typeof raw.opens_in_days === 'number' && raw.opens_in_days > 0) {
    opensAt = new Date(now + raw.opens_in_days * 86_400_000).toISOString()
  }
  return { close_date: iso(raw.close_date), event_date: iso(raw.event_date), bid_opens_at: opensAt }
}

/**
 * Enrich close dates for this program's auction listings that don't have one yet.
 * Only BID listings have a bidding deadline, and we only scrape those missing a
 * close_date, so this is a one-time backfill per listing then near-free ongoing.
 * Capped + batched so it stays well inside the cron budget.
 */
async function enrichCloseDates(supabase: SupabaseClient, program: ExperienceProgram): Promise<number> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return 0
  const anthropic = new Anthropic({ apiKey: key })
  const todayIso = new Date().toISOString().slice(0, 10)
  // Any biddable/redeemable listing missing either date. Access listings are
  // presales with no dates, so they are skipped. Bounded per run; the backfill
  // finishes over a few daily runs then only touches new listings.
  const { data: need } = await supabase
    .from('experience_listings')
    .select('id, detail_url')
    .eq('program_slug', program.program_slug)
    .eq('status', 'active')
    .neq('format', 'access')
    .or('close_date.is.null,event_date.is.null')
    .not('detail_url', 'is', null)
    .limit(12) // per-run cap; backfill finishes over a few daily runs
  if (!need?.length) return 0
  let updated = 0
  for (let i = 0; i < need.length; i += 6) {
    const batch = need.slice(i, i + 6)
    const results = await Promise.all(
      batch.map(async (r) => {
        let md = ''
        try {
          md = await firecrawlMarkdown(r.detail_url as string)
        } catch {
          return null
        }
        if (md.length < 800) return null
        const facts = await extractListingFacts(anthropic, md, todayIso)
        if (!facts.close_date && !facts.event_date && !facts.bid_opens_at) return null
        return { id: r.id as string, facts }
      }),
    )
    for (const res of results) {
      if (!res) continue
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (res.facts.close_date) {
        patch.close_date = res.facts.close_date
        patch.close_date_confidence = 'haiku'
      }
      if (res.facts.event_date) patch.event_date = res.facts.event_date
      if (res.facts.bid_opens_at) patch.bid_opens_at = res.facts.bid_opens_at
      await supabase.from('experience_listings').update(patch).eq('id', res.id)
      updated++
    }
  }
  return updated
}

/**
 * Maintain the experience-auction "bidding closes soon" reminders (kind =
 * 'experience'), which render in their own collapsed section on the dashboard,
 * separate from real to-dos:
 *   1. Prune — archive any experience reminder whose auction has already closed,
 *      so the section self-cleans instead of piling up (it used to flood the board).
 *   2. Create — one reminder per active auction closing within 3 days that
 *      doesn't already have one.
 *
 * Dedup is on the TITLE, not the detail URL: the same auction can resurface with
 * drifting query params on its URL, which slipped past exact-URL dedup and spawned
 * duplicate reminders. The title (listing + close day + platform) is stable.
 */
async function createBidReminders(supabase: SupabaseClient, program: ExperienceProgram): Promise<number> {
  const nowIso = new Date().toISOString()
  const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) // YYYY-MM-DD

  // 1. Prune closed auctions. Close date is embedded in the title
  // ("Bidding closes YYYY-MM-DD: ..."); archive anything already past.
  const { data: openBids } = await supabase
    .from('reminders')
    .select('id, title')
    .eq('kind', 'experience')
    .eq('status', 'open')
  const staleIds = (openBids ?? [])
    .filter((r) => {
      const m = (r.title as string).match(/Bidding closes (\d{4}-\d{2}-\d{2})/)
      return m ? m[1] < todayET : false
    })
    .map((r) => r.id as string)
  if (staleIds.length > 0) {
    await supabase
      .from('reminders')
      .update({ status: 'done', completed_at: nowIso })
      .in('id', staleIds)
  }

  // 2. Create reminders for auctions closing within the next 3 days.
  const soonIso = new Date(Date.now() + 3 * 86_400_000).toISOString()
  const { data: closing } = await supabase
    .from('experience_listings')
    .select('id, title, close_date, detail_url')
    .eq('program_slug', program.program_slug)
    .eq('status', 'active')
    .eq('format', 'bid')
    .not('close_date', 'is', null)
    .gte('close_date', nowIso)
    .lte('close_date', soonIso)
  let created = 0
  for (const l of closing ?? []) {
    const link = (l.detail_url as string) ?? null
    if (!link) continue
    const closeIso = l.close_date as string
    const closeDay = closeIso.slice(0, 10)
    const title = `Bidding closes ${closeDay}: ${(l.title as string).slice(0, 80)} (${program.source_platform})`
    const { data: exists } = await supabase.from('reminders').select('id').eq('title', title).limit(1)
    if (exists?.length) continue
    // Remind a day before it closes, but never in the past.
    const dueMs = Math.max(Date.now(), Date.parse(closeIso) - 86_400_000)
    await supabase.from('reminders').insert({
      title,
      kind: 'experience',
      due_date: new Date(dueMs).toISOString().slice(0, 10),
      status: 'open',
      link,
      notes: `This ${program.source_platform} auction closes ${closeIso}. Bid on the official site if you want it. Transfers are final, so only move points you're comfortable holding regardless of whether you win.`,
    })
    created++
  }
  return created
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
      status: l.ended ? 'closed' : 'active',
      status_reason: l.ended ? 'auction_ended' : null,
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
      let pts: string
      if (a.format === 'access') pts = 'Cardmember access'
      else if (a.format === 'bid')
        pts = a.current_bid != null ? `Current bid ${Number(a.current_bid).toLocaleString()} points` : 'Auction'
      else pts = a.points_required != null ? `${Number(a.points_required).toLocaleString()} points` : 'Points redemption'
      return { title: a.title as string, detail: a.category ? `${cap(a.category)} · ${pts}` : pts }
    })
    await supabase
      .from('experiences')
      .update({ recent_highlights: highlights, highlights_updated_at: now })
      .eq('slug', program.directory_slug)
  }

  // Archive listings whose experience has already happened. The public finder
  // only shows status=active, so a passed event (World Cup, a spring concert)
  // must be retired or it lingers forever - nothing else expires them. One-day
  // grace so a multi-day event still showing on its final day is not archived.
  let archived = 0
  if (success) {
    try {
      const cutoff = new Date(Date.now() - 86_400_000).toISOString()
      const { data: expired } = await supabase
        .from('experience_listings')
        .select('id')
        .eq('program_slug', program.program_slug)
        .eq('status', 'active')
        .not('event_date', 'is', null)
        .lt('event_date', cutoff)
      for (const r of expired ?? []) {
        await supabase
          .from('experience_listings')
          .update({ status: 'archived', status_reason: 'event_passed', updated_at: new Date().toISOString() })
          .eq('id', r.id)
        archived++
      }
    } catch (err) {
      console.error('[experiences-watch] archive-expired step failed:', err instanceof Error ? err.message : err)
    }
  }

  // Close-date enrichment + bid-close reminders (auctions only). Backfills the
  // "ending soonest" sort and drops a reminder when an auction is about to close.
  let enriched = 0
  let reminders = 0
  if (success) {
    try {
      enriched = await enrichCloseDates(supabase, program)
      reminders = await createBidReminders(supabase, program)
    } catch (err) {
      console.error('[experiences-watch] close-date step failed:', err instanceof Error ? err.message : err)
    }
  }

  return {
    program_slug: program.program_slug,
    found: parsed.length,
    new: newCount,
    changed,
    closed,
    archived,
    enriched,
    reminders,
    success,
    error: success ? undefined : httpOk ? 'parsed zero listings' : 'scrape returned empty',
  }
}
