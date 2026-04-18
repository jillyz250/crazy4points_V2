import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import type { AlertType, IntelItemInsert } from '@/utils/supabase/queries'

interface IntelFinding {
  source_url?: string
  source_type: 'official' | 'blog' | 'reddit' | 'social'
  source_name: string
  raw_text?: string
  headline: string
  confidence: 'high' | 'medium' | 'low'
  alert_type?: AlertType
  programs?: string[]
  expires_at?: string
}

interface IngestPayload {
  findings: IntelFinding[]
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-intel-secret')
  if (secret !== process.env.INTEL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: IngestPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.findings) || body.findings.length === 0) {
    return NextResponse.json({ error: 'findings array required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const items: IntelItemInsert[] = body.findings.map((f) => ({
    source_url: f.source_url ?? null,
    source_type: f.source_type,
    source_name: f.source_name,
    raw_text: f.raw_text ?? null,
    headline: f.headline,
    confidence: f.confidence,
    alert_type: f.alert_type ?? null,
    programs: f.programs ?? null,
    expires_at: f.expires_at ?? null,
  }))

  const { data: inserted, error: intelError } = await supabase
    .from('intel_items')
    .insert(items)
    .select()

  if (intelError) {
    console.error('[ingest-intel] DB error:', intelError)
    return NextResponse.json({ error: 'Failed to save intel' }, { status: 500 })
  }

  // Stage high-confidence items as pending_review alerts
  const highConfidence = inserted.filter((item) => item.confidence === 'high' && item.alert_type)
  const staged: string[] = []

  for (const item of highConfidence) {
    const slug = `intel-${item.id.slice(0, 8)}-${Date.now()}`
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .insert({
        slug,
        title: item.headline,
        summary: item.raw_text?.slice(0, 300) ?? item.headline,
        type: item.alert_type,
        status: 'pending_review',
        confidence_level: item.confidence,
        source_url: item.source_url ?? null,
        source: item.source_name,
        end_date: item.expires_at ?? null,
        source_intel_id: item.id,
        impact_score: 5,
        value_score: 5,
        rarity_score: 5,
        impact_justification: 'Auto-staged from Claude Scout',
        action_type: 'monitor',
        registration_required: false,
      })
      .select('id')
      .single()

    if (alertError) {
      console.error('[ingest-intel] Alert staging error:', alertError)
      continue
    }

    // Mark intel item as processed
    await supabase
      .from('intel_items')
      .update({ processed: true, alert_id: alert.id })
      .eq('id', item.id)

    staged.push(alert.id)
  }

  return NextResponse.json({
    received: inserted.length,
    staged: staged.length,
    staged_alert_ids: staged,
  })
}
