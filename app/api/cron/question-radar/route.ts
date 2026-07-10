/**
 * Question Radar — daily scrape of real user questions to answer on socials.
 *
 * Pulls candidates from Reddit RSS + Google "People Also Ask" (via Firecrawl),
 * has Haiku filter to genuinely relevant points/travel questions and enrich each
 * with a topic, relevance score, a matching crazy4points page, and a draft post
 * hook, then inserts the relevant ones into content_questions (dedup on
 * question_key; existing rows are never touched, so review states persist).
 *
 * Review them at /admin/question-radar.
 * Schedule: daily (see vercel.json). Auth: assertCron (CRON_SECRET).
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { assertCron } from '@/lib/auth/cron'
import { fetchQuestions } from '@/utils/social/fetchQuestions'
import { enrichQuestions } from '@/utils/social/enrichQuestions'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  return handle(request)
}
export async function POST(request: Request) {
  return handle(request)
}

const MIN_RELEVANCE = 55

function keyFor(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 300)
}

async function handle(request: Request) {
  const denied = assertCron(request)
  if (denied) return denied
  try {
    return await run()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[question-radar] failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

async function run() {
  const raw = await fetchQuestions()
  const enriched = await enrichQuestions(raw)
  const relevant = enriched.filter((q) => q.relevant && q.relevance >= MIN_RELEVANCE)

  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const rows = relevant.map((q) => ({
    source: q.source,
    source_detail: q.sourceDetail,
    source_url: q.sourceUrl,
    question: q.question,
    question_key: keyFor(q.question),
    topic: q.topic,
    relevance: q.relevance,
    matched_url: q.matchedUrl,
    matched_label: q.matchedLabel,
    post_hook: q.postHook,
    fetched_at: now,
  }))

  // Insert new questions only; never overwrite existing rows (preserves review
  // status like saved/used/dismissed for repeat questions).
  const { data, error } = await supabase
    .from('content_questions')
    .upsert(rows, { onConflict: 'question_key', ignoreDuplicates: true })
    .select('id')

  const result = {
    ok: !error,
    raw: raw.length,
    enriched: enriched.length,
    relevant: relevant.length,
    inserted: data?.length ?? 0,
    error: error?.message,
  }
  console.log('[question-radar]', JSON.stringify(result))
  return NextResponse.json(result, { status: error ? 500 : 200 })
}
