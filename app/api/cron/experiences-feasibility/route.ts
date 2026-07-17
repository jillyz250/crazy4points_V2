/**
 * Experiences feasibility — monthly re-scan of guide-only programs.
 *
 * Re-tests every directory experiences program we don't already monitor to see if
 * it now exposes a scrapeable catalog. For each newly-viable program it drops a
 * dashboard reminder ("consider adding X"), so a program launching a real catalog
 * gets caught automatically instead of us re-checking 18 pages by hand.
 *
 * Schedule: monthly (vercel.json). Auth: assertCron (CRON_SECRET).
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { assertCron } from '@/lib/auth/cron'
import { scanExperienceCandidates } from '@/utils/experiences/scanExperienceCandidates'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

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
    const viable = await scanExperienceCandidates(supabase)
    const created: string[] = []
    for (const c of viable) {
      const title = `Experiences: ${c.name} now has a scrapeable catalog - consider adding`
      const { data: exists } = await supabase.from('reminders').select('id').eq('title', title).limit(1)
      if (exists?.length) continue
      await supabase.from('reminders').insert({
        title,
        due_date: new Date().toISOString().slice(0, 10),
        status: 'open',
        link: c.official_url,
        notes: `The monthly feasibility scan found ~${c.count} listings on ${c.name}'s experiences page (${c.official_url}). Add it to EXPERIENCE_PROGRAMS in utils/experiences/runExperiencesWatch.ts (verify it parses clean via a run first).`,
      })
      created.push(c.program_slug)
    }
    return NextResponse.json({
      ok: true,
      viable: viable.map((v) => ({ program: v.program_slug, count: v.count })),
      remindersCreated: created,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[experiences-feasibility] failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
