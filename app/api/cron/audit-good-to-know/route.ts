/**
 * Weekly drift audit for every card's good_to_know callout.
 *
 * The save-time guardrail (saveGoodToKnowAction) catches issues when a callout
 * is edited. This cron is the second net: it re-audits ALL authored cards on a
 * schedule so issuer-side changes or anything that slipped through gets caught
 * over time. If any card flags, it emails Jill a summary.
 *
 * Runs on Vercel (prod env has Supabase + Anthropic + Resend keys); Jill's Mac
 * doesn't need to be on. Auth: Vercel sets Authorization: Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { auditGoodToKnow, type GtkAuditIssue } from '@/utils/cards/auditGoodToKnow'
import { startCronRun, finishCronRun } from '@/lib/cron/recordRun'
import { assertCron } from '@/lib/auth/cron'

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
  const runId = await startCronRun(supabase, 'audit-good-to-know')
  const { data: cards } = await supabase
    .from('credit_cards')
    .select('id, slug, good_to_know')
    .eq('status', 'active')
    .not('good_to_know', 'is', null)
    .order('slug')

  const targets = (cards ?? []).filter((c) => c.good_to_know && (c.good_to_know as string).trim())
  const flagged: Array<{ slug: string; issues: GtkAuditIssue[] }> = []

  // Run with bounded concurrency so the whole sweep fits within maxDuration.
  const CONCURRENCY = 4
  let cursor = 0
  async function worker() {
    while (cursor < targets.length) {
      const card = targets[cursor++]
      const issues = await auditGoodToKnow(supabase, card.id as string, card.good_to_know as string)
      if (issues.length) flagged.push({ slug: card.slug as string, issues })
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  // Only escalate genuine (high/med) conflicts; low-severity is noise.
  const escalate = flagged
    .map((f) => ({ slug: f.slug, issues: f.issues.filter((i) => i.severity === 'high' || i.severity === 'med') }))
    .filter((f) => f.issues.length > 0)

  // Notification handled centrally by the Daily Data Digest: the flagged cards
  // are stashed in this run's cron_runs.details so the digest can surface them
  // in 🟡 Verify. No separate email (the digest is the sole notifier).
  await finishCronRun(supabase, runId, {
    status: 'success',
    recordsChecked: targets.length,
    recordsChanged: escalate.length,
    extra: {
      flagged: escalate.map((f) => ({
        slug: f.slug,
        issues: f.issues.map((i) => ({ severity: i.severity, claim: i.claim, problem: i.problem })),
      })),
    },
  })
  return NextResponse.json({
    ok: true,
    audited: targets.length,
    flagged: flagged.length,
    escalated: escalate.length,
    cards: escalate.map((f) => f.slug),
  })
}
