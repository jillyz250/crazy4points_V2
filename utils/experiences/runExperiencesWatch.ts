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
  list_url: string // page listing current experiences
}

export const EXPERIENCE_PROGRAMS: ExperienceProgram[] = [
  {
    program_slug: 'wyndham',
    directory_slug: 'wyndham-rewards-experiences',
    source_platform: 'Wyndham Rewards Experiences',
    list_url: 'https://wyndhamrewardsexperiences.wyndhamrewards.com/iSynApp/allAuction.action',
  },
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

async function parseListings(markdown: string, program: ExperienceProgram): Promise<ParsedListing[]> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || !markdown) return []
  const anthropic = new Anthropic({ apiKey: key })
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `Extract every distinct experience listing from this ${program.source_platform} page. Return ONLY a JSON array; one object per listing with exactly these keys: {"title":string,"points":int|null (the current bid or redeem points),"format":"bid"|"redeem","category":string|null (music/sports/entertainment/etc),"location":string|null,"event_date":string|null,"detail_url":string|null (the listing's own page URL if present)}. Deduplicate identical listings. Skip navigation, footer, and promo banners.\n\n${markdown.slice(0, 16000)}`,
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

  let markdown = ''
  try {
    markdown = await firecrawlMarkdown(program.list_url)
  } catch {
    markdown = ''
  }
  const httpOk = markdown.length > 0
  const parsed = httpOk ? await parseListings(markdown, program) : []
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

  for (const l of parsed) {
    if (!l || !l.title) continue
    const key = listingKey(program.program_slug, l)
    seen.add(key)
    const isBid = l.format === 'bid'
    const row = {
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
      status: 'active' as const,
      status_reason: null,
      last_seen_at: now,
      last_checked_at: now,
      updated_at: now,
    }
    const prev = existing.get(key)
    if (!prev) {
      const { data: ins } = await supabase
        .from('experience_listings')
        .insert({ ...row, first_seen_at: now })
        .select('id')
        .single()
      newCount++
      if (ins) {
        await supabase.from('experience_listing_changes').insert({
          listing_id: ins.id,
          change_type: 'new',
          new_value: l.title,
          detected_at: now,
        })
      }
    } else {
      await supabase.from('experience_listings').update(row).eq('id', prev.id)
      const prevPoints = (prev.current_bid ?? prev.points_required) as number | null
      const newPoints = l.points
      if (prevPoints != null && newPoints != null && prevPoints !== newPoints) {
        changed++
        await supabase.from('experience_listing_changes').insert({
          listing_id: prev.id,
          change_type: 'points',
          field_name: isBid ? 'current_bid' : 'points_required',
          old_value: String(prevPoints),
          new_value: String(newPoints),
          detected_at: now,
        })
      }
    }
  }

  // Vanished from the source -> mark closed (only when the scrape actually worked,
  // so a failed scrape never mass-closes everything).
  let closed = 0
  if (success) {
    for (const [key, r] of existing) {
      if (!seen.has(key) && r.status === 'active') {
        await supabase
          .from('experience_listings')
          .update({ status: 'closed', status_reason: 'gone_from_source', updated_at: now })
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
      .select('title, current_bid, points_required, format')
      .eq('program_slug', program.program_slug)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(8)
    const highlights = (active ?? []).map((a) => ({
      title: a.title as string,
      detail:
        a.format === 'bid'
          ? `Current bid ${Number(a.current_bid ?? 0).toLocaleString()} points`
          : `${Number(a.points_required ?? 0).toLocaleString()} points`,
    }))
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
