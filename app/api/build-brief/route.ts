import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { buildBriefEmail } from '@/utils/ai/briefEmail'
import type { BriefFinding } from '@/utils/ai/briefEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const manualSecret = req.headers.get('x-intel-secret')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = manualSecret === process.env.INTEL_API_SECRET

  if (!isCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Fetch intel_items from the last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: items, error } = await supabase
    .from('intel_items')
    .select('headline, raw_text, source_name, source_url, confidence, alert_type, programs')
    .gte('created_at', since)
    .order('confidence', { ascending: false }) // high → medium → low
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[build-brief] Failed to fetch intel_items:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const findings: BriefFinding[] = (items ?? []).map((row) => ({
    headline: row.headline,
    raw_text: row.raw_text,
    source_name: row.source_name,
    source_url: row.source_url,
    confidence: row.confidence as 'high' | 'medium' | 'low',
    alert_type: row.alert_type,
    programs: row.programs,
  }))

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const html = buildBriefEmail(findings, date)

  const { error: emailError } = await resend.emails.send({
    from: 'crazy4points Scout <alerts@mail.crazy4points.com>',
    to: 'jillzeller6@gmail.com',
    subject: `crazy4points Daily Brief — ${date}`,
    html,
  })

  if (emailError) {
    console.error('[build-brief] Resend error:', emailError)
    return NextResponse.json({ error: 'Email send failed', details: emailError }, { status: 500 })
  }

  return NextResponse.json({
    findings_in_brief: findings.length,
    email_sent: true,
    date,
  })
}
