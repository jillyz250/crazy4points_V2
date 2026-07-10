/**
 * Question Radar — source scrapers.
 *
 * Pulls candidate user questions from two free sources:
 *  - Reddit RSS  (reddit.com/r/<sub>/new/.rss) — no API/OAuth needed. Reddit
 *    blocks its JSON API + all scrapers (incl. Firecrawl), but the RSS feed is
 *    still open with a browser-like User-Agent. RSS gives title + permalink but
 *    NOT upvote/comment counts, so ranking is by recency + AI relevance.
 *  - Google "People Also Ask" via Firecrawl — scrape the SERP for seed queries
 *    and extract the question-shaped lines.
 *
 * Returns raw candidates; relevance filtering + enrichment happens in
 * enrichQuestions.ts (Haiku).
 */
import { fetchFirecrawl } from '@/utils/ai/firecrawl'

export type QuestionSource = 'reddit' | 'google_paa'

export type RawQuestion = {
  source: QuestionSource
  sourceDetail: string // e.g. "r/awardtravel" or the seed query
  sourceUrl: string
  question: string
}

// Subreddits worth mining for points/travel questions.
const REDDIT_SUBS = ['awardtravel', 'CreditCards', 'churning', 'hotels']
// Browser-like UA — Reddit 403s default/unknown agents.
const REDDIT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'

// Google PAA seed queries — chosen to map to content we already have
// (CSR checklist, Best Rate Guarantee guide, card explorer, transfer partners).
const GOOGLE_SEEDS = [
  'chase sapphire reserve worth it',
  'hotel best rate guarantee',
  'how to transfer credit card points',
  'amex platinum worth it',
  'best credit card for travel points',
  'how to use world of hyatt points',
  'best hotel loyalty program',
  'how to book award flights with points',
]

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchRedditRss(sub: string): Promise<RawQuestion[]> {
  const url = `https://www.reddit.com/r/${sub}/new/.rss?limit=30`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': REDDIT_UA,
        Accept: 'application/atom+xml, application/rss+xml, application/xml',
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      console.warn(`[question-radar] reddit r/${sub} rss returned ${res.status}`)
      return []
    }
    const xml = await res.text()
    const out: RawQuestion[] = []
    for (const block of xml.split('<entry>').slice(1)) {
      const title = decodeEntities(block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? '')
      const link = (block.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? '').trim()
      if (title && link) out.push({ source: 'reddit', sourceDetail: `r/${sub}`, sourceUrl: link, question: title })
    }
    return out
  } catch (err) {
    console.warn(`[question-radar] reddit r/${sub} rss error:`, err)
    return []
  }
}

async function fetchGooglePaa(seed: string): Promise<RawQuestion[]> {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(seed)}`
  const r = await fetchFirecrawl(searchUrl, { formats: ['markdown'], maxChars: 25_000, timeoutMs: 25_000 })
  if (!r.ok) {
    console.warn(`[question-radar] google PAA "${seed}" firecrawl failed: ${r.reason}`)
    return []
  }
  // Question-shaped lines: start with a capital, end with "?", reasonable length.
  const candidates = [...r.markdown.matchAll(/(?:^|\n)#{0,4}\s*([A-Z][^?\n]{12,110}\?)/g)].map((m) =>
    m[1].trim(),
  )
  const junk = /google|sign in|accessibility|cookie|privacy|feedback|search|images|maps|shopping/i
  const unique = [...new Set(candidates)].filter((q) => !junk.test(q))
  return unique.map((q) => ({ source: 'google_paa', sourceDetail: seed, sourceUrl: searchUrl, question: q }))
}

/** Pull raw candidate questions from all sources. Deduped by normalized text. */
export async function fetchQuestions(): Promise<RawQuestion[]> {
  const all: RawQuestion[] = []

  // Reddit — sequential with a small delay to stay under RSS rate limits.
  for (const sub of REDDIT_SUBS) {
    all.push(...(await fetchRedditRss(sub)))
    await sleep(600)
  }

  // Google PAA — Firecrawl handles concurrency fine; run in parallel.
  const googleBatches = await Promise.all(GOOGLE_SEEDS.map((s) => fetchGooglePaa(s)))
  for (const batch of googleBatches) all.push(...batch)

  // Dedup by normalized question text (keep first seen).
  const seen = new Set<string>()
  const deduped: RawQuestion[] = []
  for (const q of all) {
    const key = q.question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (key.length < 8 || seen.has(key)) continue
    seen.add(key)
    deduped.push(q)
  }
  console.log(`[question-radar] fetched ${all.length} raw, ${deduped.length} after dedup`)
  return deduped
}
