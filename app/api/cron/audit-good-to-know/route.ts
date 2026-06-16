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
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { auditGoodToKnow, type GtkAuditIssue } from '@/utils/cards/auditGoodToKnow'
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

  // Always email a summary - clean or flagged - so the audit is never silent.
  // A missing weekly email then signals the cron itself didn't run.
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const subject = escalate.length
      ? `good_to_know audit: ${escalate.length} card${escalate.length === 1 ? '' : 's'} flagged`
      : `good_to_know audit: all ${targets.length} clean`
    const rows = escalate.map((f) =>
      `<h3 style="margin:14px 0 4px">${f.slug}</h3><ul style="margin:0">${f.issues.map((i) => `<li><b>[${i.severity}]</b> &ldquo;${i.claim}&rdquo; &mdash; ${i.problem}</li>`).join('')}</ul>`).join('')
    const body = escalate.length
      ? `<p>The weekly good_to_know accuracy audit checked <b>${targets.length}</b> cards and flagged <b>${escalate.length}</b> against current card data. Review and fix in /admin/cards/[slug]/extract.</p>${rows}`
      : `<p>The weekly good_to_know accuracy audit checked <b>${targets.length}</b> cards. No conflicts with the card data - all clean.</p>`
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>',
      to: 'jillzeller6@gmail.com',
      subject,
      html: body,
    }).catch(() => {})
  }

  return NextResponse.json({
    ok: true,
    audited: targets.length,
    flagged: flagged.length,
    escalated: escalate.length,
    cards: escalate.map((f) => f.slug),
  })
}
