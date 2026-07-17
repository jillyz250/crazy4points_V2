/**
 * scanExperienceCandidates — monthly feasibility check.
 *
 * For every experiences-directory program we do NOT already monitor, scrape its
 * official experiences URL and count listings. Returns the ones that now expose a
 * scrapeable catalog (>= threshold), so the monthly cron can flag "this program
 * is now addable" instead of us re-testing 18 pages by hand.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { EXPERIENCE_PROGRAMS } from './runExperiencesWatch'

export interface CandidateResult {
  program_slug: string
  name: string
  official_url: string
  count: number
}

const VIABLE_THRESHOLD = 3

// Verified 2026-07-17 to look listing-ish to the counter but parse ZERO real
// listings in the engine (marketing/homepage pages). Skip so the monthly scan
// doesn't cry wolf every month. If one publicly launches a real catalog, re-test
// it by hand ("re-scan experiences programs") and remove it here.
const CONFIRMED_NO_CATALOG = new Set(['bilt', 'flying-blue', 'capital-one'])

async function firecrawlMarkdown(url: string): Promise<string> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return ''
  try {
    const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], waitFor: 8000 }),
      signal: AbortSignal.timeout(60_000),
    })
    const json = await res.json()
    return (json?.data?.markdown as string) ?? ''
  } catch {
    return ''
  }
}

async function countListings(markdown: string, name: string): Promise<number> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || markdown.length < 1500) return 0
  try {
    const anthropic = new Anthropic({ apiKey: key })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `Count distinct bookable experience/event listings (a title plus points or cardmember access) on this ${name} page. Ignore nav, footer, and marketing copy. Return ONLY {"count":int}.\n\n${markdown.slice(0, 13000)}`,
        },
      ],
    })
    const first = msg.content[0]
    const text = first && first.type === 'text' ? first.text : '{}'
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const n = JSON.parse(cleaned)?.count
    return typeof n === 'number' ? n : 0
  } catch {
    return 0
  }
}

export async function scanExperienceCandidates(supabase: SupabaseClient): Promise<CandidateResult[]> {
  const monitored = new Set(EXPERIENCE_PROGRAMS.map((p) => p.program_slug))
  const { data } = await supabase
    .from('experiences')
    .select('parent_program_slug, name, official_url')
    .eq('status', 'published')
    .not('official_url', 'is', null)
  const candidates = (data ?? []).filter(
    (r) =>
      r.parent_program_slug &&
      !monitored.has(r.parent_program_slug as string) &&
      !CONFIRMED_NO_CATALOG.has(r.parent_program_slug as string),
  )

  const results: CandidateResult[] = []
  for (let i = 0; i < candidates.length; i += 5) {
    const batch = candidates.slice(i, i + 5)
    const scored = await Promise.all(
      batch.map(async (r) => {
        const md = await firecrawlMarkdown(r.official_url as string)
        const count = await countListings(md, (r.name as string) ?? '')
        return {
          program_slug: r.parent_program_slug as string,
          name: (r.name as string) ?? (r.parent_program_slug as string),
          official_url: r.official_url as string,
          count,
        }
      }),
    )
    results.push(...scored)
  }
  return results.filter((r) => r.count >= VIABLE_THRESHOLD)
}
