/**
 * Experiences watch — daily scrape of loyalty "experiences" listings.
 *
 * For each configured program: scrape its experiences page (Firecrawl), parse
 * listings (Haiku), upsert into experience_listings with change detection, mark
 * vanished listings closed, log scraper health, and refresh the public
 * `experiences` directory row's recent_highlights.
 *
 * Phase 1: Wyndham only (internal engine; public Finder deliberately deferred).
 * Review data in /admin/experiences (fast-follow). Schedule: daily (vercel.json).
 * Auth: assertCron (CRON_SECRET).
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { assertCron } from '@/lib/auth/cron'
import { runExperiencesWatch, EXPERIENCE_PROGRAMS } from '@/utils/experiences/runExperiencesWatch'
import { orderProgramsByStaleness, checkExperiencesCoverage } from '@/utils/experiences/coverage'
import { alertFlashDrops } from '@/utils/experiences/flashDrops'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Stop STARTING new programs past this — a program in flight finishes, then we
// stop, leaving headroom under the 300s function cap so we never get killed
// mid-run (a kill is silent — it leaves no error and no scrape_run row).
const BUDGET_MS = 230_000

export async function GET(request: Request) {
  return handle(request)
}
export async function POST(request: Request) {
  return handle(request)
}

async function handle(request: Request) {
  const denied = assertCron(request)
  if (denied) return denied
  try {
    const supabase = createAdminClient()
    // Optional `?program=<slug>` filter — run a single program instead of all.
    // Used to re-scrape one catalog after a config fix without re-running the
    // whole (expensive) sweep. Omit for the normal daily all-programs run.
    const only = new URL(request.url).searchParams.get('program')
    // Normal run: process programs STALEST-FIRST and stop before the time budget,
    // so the most-neglected always get covered and we never time out. With the
    // cron running every few hours, all 18 cycle several times a day (which also
    // catches flash drops). A `?program=` run does just that one, unbounded.
    const programs = only
      ? EXPERIENCE_PROGRAMS.filter((p) => p.program_slug === only)
      : await orderProgramsByStaleness(supabase)
    const started = Date.now()
    const results: unknown[] = []
    const skipped: string[] = []
    for (const program of programs) {
      if (!only && Date.now() - started > BUDGET_MS) {
        skipped.push(program.program_slug)
        continue
      }
      try {
        results.push(await runExperiencesWatch(supabase, program))
        // Email Jill immediately if this program's scrape surfaced a near-free
        // flash drop (100-mile / 1-point) — these sell out fast.
        await alertFlashDrops(supabase, program.program_slug)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[experiences-watch] ${program.program_slug} failed:`, message)
        results.push({ program_slug: program.program_slug, success: false, error: message })
      }
    }
    // Watchdog: surface any program that has now gone quiet for >36h as a real
    // system error, so a coverage lapse can never stay silent again.
    let staleAlert: string[] = []
    if (!only) staleAlert = await checkExperiencesCoverage(supabase)
    return NextResponse.json({ ok: true, ran: results.length, skipped, staleAlert, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[experiences-watch] failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
