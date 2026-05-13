import { NextResponse } from 'next/server'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createAdminClient } from '@/utils/supabase/server'
import {
  startScrapeRun,
  closeScrapeRun,
  persistPromoBatch,
  type ParsedPromoRow,
} from '@/utils/scraper/persist'
import type { IntelType } from '@/utils/supabase/promoQueries'

/**
 * Daily cron endpoint — runs every promo scraper config in lib/scrapers/.
 * Invoked by Vercel Cron per vercel.json schedule.
 *
 * Each scraper:
 *  - hits its source URL via Firecrawl
 *  - extracts structured promos via JSON schema
 *  - persists to promo_rewards (diff against existing active rows)
 *  - logs a scrape_runs row for observability
 *
 * Nothing renders on public surfaces until curator approves +
 * publishes from /admin/promos.
 *
 * Auth: Vercel Cron sets `Authorization: Bearer ${CRON_SECRET}` when
 * invoking — we verify against process.env.CRON_SECRET.
 *
 * Observability:
 *  - Every invocation creates a scrape_runs row per scraper (DB-level log)
 *  - Console output captured in Vercel Function Logs (request-level log)
 *  - Failures don't short-circuit the loop — one scraper failing doesn't
 *    block the others
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min — enough for all scrapers sequentially

const SCRAPERS_DIR = join(process.cwd(), 'lib', 'scrapers')

type ScraperConfig = {
  slug: string
  program_slug: string
  source_url: string
  default_intel_type: IntelType
  schema: Record<string, unknown>
  items_path: string
  field_mapping?: Record<string, string>
  firecrawl_options?: Record<string, unknown>
}

type ScrapeReport = {
  slug: string
  status: 'success' | 'failed'
  items_seen?: number
  items_new?: number
  items_updated?: number
  items_disappeared?: number
  duration_ms?: number
  credits?: number | null
  error?: string
}

export async function GET(req: Request) {
  const invocationId = `cron-${Date.now().toString(36)}`
  console.log(`[${invocationId}] promo-scraper cron starting`)

  // Auth gate
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn(`[${invocationId}] unauthorized cron invocation`)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const results: ScrapeReport[] = []
  let slugs: string[]
  try {
    slugs = readdirSync(SCRAPERS_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.slice(0, -5))
  } catch (err) {
    console.error(`[${invocationId}] failed to list scrapers dir`, err)
    return NextResponse.json(
      { error: 'scrapers dir missing', detail: String(err) },
      { status: 500 },
    )
  }

  console.log(`[${invocationId}] running ${slugs.length} scrapers: ${slugs.join(', ')}`)

  for (const slug of slugs) {
    try {
      const config = JSON.parse(
        readFileSync(join(SCRAPERS_DIR, `${slug}.json`), 'utf8'),
      ) as ScraperConfig
      const r = await runScraper(config, invocationId)
      results.push(r)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[${invocationId}] ${slug} failed at top level:`, message)
      results.push({ slug, status: 'failed', error: message })
    }
  }

  const failed = results.filter((r) => r.status === 'failed').length
  console.log(
    `[${invocationId}] cron complete — ${results.length - failed} success, ${failed} failed`,
  )

  return NextResponse.json(
    { invocationId, scraperCount: results.length, failed, results },
    { status: 200 },
  )
}

async function runScraper(
  config: ScraperConfig,
  invocationId: string,
): Promise<ScrapeReport> {
  const started = Date.now()
  console.log(`[${invocationId}] ${config.slug} starting`)

  // Firecrawl extract
  let firecrawlJson: unknown
  let credits: number | null = null
  try {
    const firecrawlRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: config.source_url,
        formats: ['json'],
        jsonOptions: { schema: config.schema },
        timeout: 60000,
        ...(config.firecrawl_options ?? {}),
      }),
      signal: AbortSignal.timeout(75000),
    })
    if (!firecrawlRes.ok) {
      const text = await firecrawlRes.text().catch(() => '')
      throw new Error(`Firecrawl ${firecrawlRes.status}: ${text.slice(0, 200)}`)
    }
    const fc = await firecrawlRes.json()
    if (!fc.success) throw new Error('Firecrawl returned success=false')
    firecrawlJson = fc.data?.json
    credits = fc.data?.metadata?.creditsUsed ?? null
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[${invocationId}] ${config.slug} firecrawl failed:`, message)
    return { slug: config.slug, status: 'failed', error: message, credits }
  }

  const itemsRaw = getByPath(firecrawlJson, config.items_path)
  if (!Array.isArray(itemsRaw)) {
    const message = `items_path "${config.items_path}" did not yield an array`
    console.error(`[${invocationId}] ${config.slug} parse failed:`, message)
    return { slug: config.slug, status: 'failed', error: message, credits }
  }

  const parsed: ParsedPromoRow[] = itemsRaw.map((item) => ({
    source_url: config.source_url,
    raw_payload: item as Record<string, unknown>,
    ...mapFields(item, config.field_mapping ?? {}),
  }))

  // Persist via Supabase
  const supabase = createAdminClient()
  const { data: prog, error: progErr } = await supabase
    .from('programs')
    .select('id')
    .eq('slug', config.program_slug)
    .maybeSingle()
  if (progErr || !prog) {
    const message = `program "${config.program_slug}" not found`
    console.error(`[${invocationId}] ${config.slug}:`, message)
    return { slug: config.slug, status: 'failed', error: message, credits }
  }
  const programId = prog.id as string

  const runId = await startScrapeRun(supabase, {
    programId,
    scraperSlug: config.slug,
    sourceUrl: config.source_url,
  })

  try {
    const result = await persistPromoBatch(
      supabase,
      parsed,
      {
        programId,
        scraperSlug: config.slug,
        sourceUrl: config.source_url,
        defaultIntelType: config.default_intel_type,
      },
      runId,
    )
    const duration_ms = Date.now() - started
    await closeScrapeRun(supabase, runId, {
      status: 'success',
      duration_ms,
      ...result,
      firecrawl_credits_used: credits ?? undefined,
    })
    console.log(
      `[${invocationId}] ${config.slug} ok — ${result.items_new} new, ${result.items_updated} updated, ${result.items_disappeared} disappeared (${duration_ms}ms, ${credits ?? '?'} credits)`,
    )
    return { slug: config.slug, status: 'success', ...result, duration_ms, credits }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await closeScrapeRun(supabase, runId, {
      status: 'failed',
      duration_ms: Date.now() - started,
      firecrawl_credits_used: credits ?? undefined,
      error_log: message.slice(0, 2000),
    })
    console.error(`[${invocationId}] ${config.slug} persist failed:`, message)
    return { slug: config.slug, status: 'failed', error: message, credits }
  }
}

function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj
  return path.split('.').reduce<unknown>(
    (cur, key) =>
      cur && typeof cur === 'object' && key in (cur as Record<string, unknown>)
        ? (cur as Record<string, unknown>)[key]
        : null,
    obj,
  )
}

function mapFields(item: unknown, mapping: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [target, source] of Object.entries(mapping)) {
    out[target] = getByPath(item, source) ?? null
  }
  return out
}
