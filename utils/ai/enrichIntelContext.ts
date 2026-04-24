/**
 * Fetches each program's official FAQ / terms page (via Firecrawl) and
 * returns a concatenated markdown blob the writer can use as authoritative
 * context. Enforces a 24h cache in program_faq_cache — fresh rows are
 * reused, stale rows (or url edits) trigger refetch.
 *
 * Fail-soft by design: if Firecrawl fails or no programs have FAQ URLs,
 * returns { extra_context: null }. Never throws — the writer still runs
 * on raw_text alone.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchFirecrawl } from './firecrawl'
import {
  getProgramFaqCache,
  upsertProgramFaqCache,
} from '@/utils/supabase/queries'

export interface EnrichProgramInput {
  id: string
  slug: string
  name: string
  official_faq_url: string | null
}

export interface EnrichIntelContextResult {
  extra_context: string | null
  fetched_urls: string[]
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h
const PER_PROGRAM_MAX_CHARS = 4000
const TOTAL_MAX_CHARS = 8000

/**
 * Returns cached content if fresh and the stored URL matches the current
 * program.official_faq_url. Otherwise fetches fresh via Firecrawl and upserts.
 * Returns '' (not null) on any failure so the caller can skip this program
 * without breaking the whole enrichment.
 */
async function getOrFetchFaq(
  supabase: SupabaseClient,
  program: EnrichProgramInput
): Promise<string> {
  if (!program.official_faq_url) return ''
  const currentUrl = program.official_faq_url

  try {
    const cached = await getProgramFaqCache(supabase, program.id)
    const now = Date.now()
    if (
      cached &&
      cached.url === currentUrl &&
      now - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS
    ) {
      return cached.content
    }
  } catch (err) {
    console.warn(`[enrichIntelContext] cache read failed for ${program.slug}:`, err)
    // fall through to fetch
  }

  const fresh = await fetchFirecrawl(currentUrl, PER_PROGRAM_MAX_CHARS)
  if (!fresh) return ''

  try {
    await upsertProgramFaqCache(supabase, {
      program_id: program.id,
      url: currentUrl,
      content: fresh,
    })
  } catch (err) {
    console.warn(`[enrichIntelContext] cache write failed for ${program.slug}:`, err)
    // still return the fresh content — cache miss shouldn't block enrichment
  }

  return fresh
}

export async function enrichIntelContext(args: {
  supabase: SupabaseClient
  programs: EnrichProgramInput[]
}): Promise<EnrichIntelContextResult> {
  const withFaq = args.programs.filter((p) => p.official_faq_url)
  if (withFaq.length === 0) return { extra_context: null, fetched_urls: [] }

  const sections: string[] = []
  const fetched_urls: string[] = []
  let used = 0

  for (const program of withFaq) {
    if (used >= TOTAL_MAX_CHARS) break
    const content = await getOrFetchFaq(args.supabase, program)
    if (!content) continue

    const remaining = TOTAL_MAX_CHARS - used
    const truncated = content.length > remaining ? content.slice(0, remaining) : content
    const header = `### ${program.name} — official FAQ (${program.official_faq_url})\n\n`
    sections.push(header + truncated)
    used += header.length + truncated.length
    fetched_urls.push(program.official_faq_url!)
  }

  if (sections.length === 0) return { extra_context: null, fetched_urls: [] }
  return {
    extra_context: sections.join('\n\n---\n\n'),
    fetched_urls,
  }
}
