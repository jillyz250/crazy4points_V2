/**
 * Fetches the US State Department travel-advisory RSS feed, parses each
 * country's level + URL + summary, and upserts into destinations matched
 * by country name.
 *
 * Called manually for now (POST with admin auth). Once the data shape is
 * proven we can wire a Vercel cron to hit this daily.
 *
 * Source: https://travel.state.gov/_res/rss/TAsTWs.xml
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

const FEED_URL = 'https://travel.state.gov/_res/rss/TAsTWs.xml'

interface ParsedAdvisory {
  country: string       // canonical country name as parsed from the title
  level: number | null  // 1-4 or null if unparseable
  link: string | null
  summary: string | null
}

/**
 * The State Dept RSS titles look like:
 *   "Mexico - Level 2: Exercise Increased Caution"
 *   "Russia - Level 4: Do Not Travel"
 *   "Andorra - Level 1: Exercise Normal Precautions - Travel Advisory"
 *
 * Pull the country name (left of " - Level") and the level digit.
 */
function parseTitle(title: string): { country: string; level: number | null } {
  const m = title.match(/^(.+?)\s*-\s*Level\s*(\d)/i)
  if (!m) {
    return { country: title.trim(), level: null }
  }
  const lvl = Number.parseInt(m[2], 10)
  return {
    country: m[1].trim(),
    level: lvl >= 1 && lvl <= 4 ? lvl : null,
  }
}

/**
 * Map State Dept country names to the names we use in destinations.country.
 * Most match verbatim. The handful here cover known mismatches we've hit
 * with our existing dataset; extend as new ones surface.
 */
const COUNTRY_ALIASES: Record<string, string> = {
  'United States of America':         'United States',
  'Korea, Republic of':                'South Korea',
  'Korea, Democratic People\'s Republic of': 'North Korea',
  'Burma':                             'Myanmar',
  'Czechia':                           'Czech Republic',
  'Russia':                            'Russia',
  'Türkiye':                           'Türkiye',
  'Turkiye':                           'Türkiye',
  'Turkey':                            'Türkiye',
  'Eswatini':                          'Eswatini',
  'Macedonia':                         'North Macedonia',
  'Republic of North Macedonia':       'North Macedonia',
  'Cabo Verde':                        'Cabo Verde',
  'Cape Verde':                        'Cabo Verde',
  'Holy See':                          'Vatican City',
  'East Timor':                        'Timor-Leste',
}

function normalizeCountry(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim()
  return COUNTRY_ALIASES[cleaned] ?? cleaned
}

/**
 * Lightweight RSS parser — no extra deps. Pulls each <item>'s title, link,
 * and description. State Dept's feed is well-formed XML.
 */
function parseRss(xml: string): ParsedAdvisory[] {
  const items: ParsedAdvisory[] = []
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
  for (const block of itemBlocks) {
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/)
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/)
    const descMatch = block.match(/<description>([\s\S]*?)<\/description>/)
    if (!titleMatch) continue
    const titleRaw = decodeXml(stripCdata(titleMatch[1]))
    const linkRaw = linkMatch ? decodeXml(stripCdata(linkMatch[1])).trim() : null
    const descRaw = descMatch ? stripHtml(decodeXml(stripCdata(descMatch[1]))) : null
    const { country, level } = parseTitle(titleRaw)
    items.push({
      country: normalizeCountry(country),
      level,
      link: linkRaw,
      summary: descRaw ? descRaw.slice(0, 800) : null,
    })
  }
  return items
}

function stripCdata(s: string): string {
  return s.replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim()
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

export async function POST() {
  let xml: string
  try {
    const res = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'crazy4points-travel-advisory-refresh/1.0' },
      cache: 'no-store',
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Feed fetch failed: HTTP ${res.status}` },
        { status: 502 }
      )
    }
    xml = await res.text()
  } catch (err) {
    return NextResponse.json(
      { error: `Feed fetch error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    )
  }

  const advisories = parseRss(xml)
  const supabase = createAdminClient()

  const { data: destinations, error: destErr } = await supabase
    .from('destinations')
    .select('id, country')
  if (destErr) {
    return NextResponse.json({ error: destErr.message }, { status: 500 })
  }

  // Build a lookup: country (lowercased) → list of destination ids
  const byCountry = new Map<string, string[]>()
  for (const d of destinations ?? []) {
    const key = (d.country as string | null)?.trim().toLowerCase()
    if (!key) continue
    const list = byCountry.get(key) ?? []
    list.push(d.id as string)
    byCountry.set(key, list)
  }

  const now = new Date().toISOString()
  let matched = 0
  let unmatched: string[] = []

  for (const adv of advisories) {
    const ids = byCountry.get(adv.country.toLowerCase())
    if (!ids || ids.length === 0) {
      unmatched.push(adv.country)
      continue
    }
    const { error: updErr } = await supabase
      .from('destinations')
      .update({
        advisory_level: adv.level,
        advisory_url: adv.link,
        advisory_summary: adv.summary,
        advisory_updated_at: now,
      })
      .in('id', ids)
    if (updErr) {
      console.error('[refresh-travel-advisories] update failed:', adv.country, updErr.message)
      continue
    }
    matched += ids.length
  }

  return NextResponse.json({
    parsedAdvisories: advisories.length,
    destinationsUpdated: matched,
    unmatchedAdvisoryCountries: unmatched.slice(0, 50),
    refreshedAt: now,
  })
}
