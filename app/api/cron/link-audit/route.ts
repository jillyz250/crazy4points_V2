/**
 * Weekly outbound link audit.
 *
 * Links rot silently: a program retires a URL and nothing tells us, so readers
 * hit a 404 until somebody happens to notice. (Accor's experiences link died
 * this way and was only caught by hand on 2026-07-20.) This sweeps every
 * reader-facing outbound link — card official pages, AFFILIATE links, the
 * experiences directory, and program partner charts — and raises a dashboard
 * reminder listing anything genuinely dead.
 *
 * The checker is content-based on purpose; see utils/integrity/auditLinks.ts
 * for why HTTP status alone is not trustworthy here.
 *
 * Schedule: weekly (vercel.json). Auth: assertCron (CRON_SECRET).
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { assertCron } from '@/lib/auth/cron'
import { auditLinks } from '@/utils/integrity/auditLinks'
import { startCronRun, finishCronRun } from '@/lib/cron/recordRun'

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

  const supabase = createAdminClient()
  const runId = await startCronRun(supabase, 'link-audit')

  try {
    const { checked, findings } = await auditLinks(supabase)

    let reminderCreated = false
    if (findings.length > 0) {
      const today = new Date().toISOString().slice(0, 10)
      const title = `${findings.length} broken link${findings.length === 1 ? '' : 's'} found on the site`
      const lines = findings
        .map((f) => `- [${f.kind}] ${f.name}: ${f.url} (${f.reason})`)
        .join('\n')
      const notes =
        `Checked ${checked} outbound links. These identify themselves as dead ` +
        `(not just bot-blocked), so they need a real replacement URL or should be cleared:\n\n${lines}\n\n` +
        `Affiliate links are listed first because a dead one costs money silently.`
      // A persistent breakage must stay ONE living reminder, not one per weekly run.
      // If an open broken-link reminder already exists, refresh it in place
      // (updated count, links, and date) instead of stacking a new row every week.
      const { data: openExisting } = await supabase
        .from('reminders')
        .select('id')
        .ilike('title', '%broken link%')
        .eq('status', 'open')
        .limit(1)
      if (openExisting?.length) {
        await supabase
          .from('reminders')
          .update({ title, due_date: today, notes })
          .eq('id', openExisting[0].id)
        reminderCreated = true
      } else {
        await supabase.from('reminders').insert({ title, due_date: today, status: 'open', notes })
        reminderCreated = true
      }
    }

    await finishCronRun(supabase, runId, {
      status: 'success',
      recordsChecked: checked,
      recordsChanged: findings.length,
    })
    return NextResponse.json({ ok: true, checked, broken: findings.length, reminderCreated, findings })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await finishCronRun(supabase, runId, { status: 'failed', error: message })
    console.error('[link-audit] failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
