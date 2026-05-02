import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { updateAlert, incrementSourceApproved } from '@/utils/supabase/queries'
import { verifyBulkActionToken, type BulkActionKind } from '@/utils/ai/bulkActionToken'

const TOKEN_TTL_HOURS = 48

function htmlResponse(title: string, body: string, status = 200) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#FAF9F6;margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#1A1A1A}
  .card{max-width:480px;background:#fff;padding:40px 32px;border-radius:12px;box-shadow:0 2px 8px rgba(26,26,26,0.06);text-align:center}
  h1{font-family:"Playfair Display",serif;color:#6B2D8F;margin:0 0 12px;font-size:24px}
  p{color:#4A4A4A;line-height:1.6;margin:0 0 20px}
  a{color:#6B2D8F;font-weight:600;text-decoration:none}
  a:hover{text-decoration:underline}
</style>
</head><body><div class="card">${body}</div></body></html>`
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function okPage(title: string, msg: string) {
  return htmlResponse(title, `<h1>${title}</h1><p>${msg}</p><a href="https://www.crazy4points.com/admin/alerts">Go to admin →</a>`)
}

function errorPage(msg: string, status = 400) {
  return htmlResponse('Something went wrong', `<h1>Something went wrong</h1><p>${msg}</p><a href="https://www.crazy4points.com/admin/alerts">Go to admin →</a>`, status)
}

async function findPendingAlertByIntelId(supabase: ReturnType<typeof createAdminClient>, intelId: string) {
  const { data, error } = await supabase
    .from('alerts')
    .select('id, status, source_intel_id')
    .eq('source_intel_id', intelId)
    .maybeSingle()
  if (error) throw error
  return data as { id: string; status: string; source_intel_id: string } | null
}

async function logAction(
  supabase: ReturnType<typeof createAdminClient>,
  briefId: string,
  entry: { action: BulkActionKind; target_id: string; result: 'ok' | 'noop' | 'error'; message?: string }
) {
  const { data: brief } = await supabase
    .from('daily_briefs')
    .select('actions')
    .eq('id', briefId)
    .single()
  const actions = Array.isArray(brief?.actions) ? brief.actions : []
  actions.push({ ...entry, taken_at: new Date().toISOString() })
  await supabase.from('daily_briefs').update({ actions }).eq('id', briefId)
}

async function alreadyProcessed(
  supabase: ReturnType<typeof createAdminClient>,
  briefId: string,
  action: BulkActionKind,
  targetId: string
): Promise<boolean> {
  const { data: brief } = await supabase
    .from('daily_briefs')
    .select('actions')
    .eq('id', briefId)
    .single()
  const actions = Array.isArray(brief?.actions) ? brief.actions : []
  return actions.some(
    (a: { action?: string; target_id?: string; result?: string }) =>
      a.action === action && a.target_id === targetId && a.result === 'ok'
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return errorPage('Missing token.', 400)

  const payload = verifyBulkActionToken(token)
  if (!payload) return errorPage('Invalid or tampered link.', 400)

  const supabase = createAdminClient()

  // Verify brief exists + enforce TTL
  const { data: brief, error: briefErr } = await supabase
    .from('daily_briefs')
    .select('id, brief_date')
    .eq('id', payload.brief_id)
    .single()
  if (briefErr || !brief) return errorPage('This brief no longer exists.', 404)

  const ageMs = Date.now() - new Date(brief.brief_date + 'T00:00:00Z').getTime()
  if (ageMs > TOKEN_TTL_HOURS * 60 * 60 * 1000) {
    return errorPage(`This link has expired. One-click actions are valid for ${TOKEN_TTL_HOURS} hours.`, 410)
  }

  // Replay protection
  {
    if (await alreadyProcessed(supabase, payload.brief_id, payload.action, payload.target_id)) {
      return okPage('Already done', 'This action was already applied from a previous click.')
    }
  }

  try {
    if (payload.action === 'approve') {
      const alert = await findPendingAlertByIntelId(supabase, payload.target_id)
      if (!alert) {
        await logAction(supabase, payload.brief_id, { ...payload, result: 'noop', message: 'No linked alert' })
        return errorPage('No pending alert found for that intel item.', 404)
      }
      if (alert.status !== 'pending_review') {
        await logAction(supabase, payload.brief_id, { ...payload, result: 'noop', message: `status=${alert.status}` })
        return okPage('Already decided', `This alert is already ${alert.status}. No change made.`)
      }
      const updated = await updateAlert(supabase, alert.id, {
        status: 'published',
        published_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      })
      if (updated.source_intel_id) {
        await incrementSourceApproved(supabase, updated.source_intel_id).catch(() => {})
      }
      await logAction(supabase, payload.brief_id, { ...payload, result: 'ok' })
      return okPage('Published', 'The alert is now live on the site.')
    }

    if (payload.action === 'reject') {
      // Always stamp the intel item as rejected so it doesn't re-surface
      // tomorrow, even if no alert was ever staged (medium/low confidence).
      await supabase
        .from('intel_items')
        .update({ rejected_at: new Date().toISOString() })
        .eq('id', payload.target_id)

      const alert = await findPendingAlertByIntelId(supabase, payload.target_id)
      if (!alert) {
        await logAction(supabase, payload.brief_id, { ...payload, result: 'ok', message: 'intel marked rejected (no linked alert)' })
        return okPage('Rejected', 'This intel is marked rejected and will not re-surface.')
      }
      if (alert.status !== 'pending_review') {
        await logAction(supabase, payload.brief_id, { ...payload, result: 'noop', message: `status=${alert.status}` })
        return okPage('Already decided', `This alert is already ${alert.status}. No change made.`)
      }
      await updateAlert(supabase, alert.id, { status: 'rejected' })
      await logAction(supabase, payload.brief_id, { ...payload, result: 'ok' })
      return okPage('Rejected', 'The alert has been rejected and will not be published.')
    }

if (payload.action === 'queue_newsletter' || payload.action === 'dismiss_newsletter') {
      const nextStatus = payload.action === 'queue_newsletter' ? 'queued' : 'dismissed'
      const { data: idea, error: ideaErr } = await supabase
        .from('content_ideas')
        .select('id, status')
        .eq('type', 'newsletter')
        .eq('source_brief_id', payload.brief_id)
        .eq('source_intel_id', payload.target_id)
        .maybeSingle()
      if (ideaErr) throw ideaErr
      if (!idea) {
        await logAction(supabase, payload.brief_id, { ...payload, result: 'noop', message: 'No matching content_idea' })
        return errorPage('No matching newsletter idea found.', 404)
      }
      const { error: updErr } = await supabase
        .from('content_ideas')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', idea.id)
      if (updErr) throw updErr
      await logAction(supabase, payload.brief_id, { ...payload, result: 'ok' })
      return okPage(
        nextStatus === 'queued' ? 'Queued for newsletter' : 'Dismissed',
        nextStatus === 'queued'
          ? 'Added to the newsletter queue. Manage it in Content Ideas.'
          : 'Dismissed from the newsletter queue.'
      )
    }

    return errorPage('Unknown action.', 400)
  } catch (err) {
    console.error('[bulk-action] error:', err)
    await logAction(supabase, payload.brief_id, { ...payload, result: 'error', message: String(err) }).catch(() => {})
    return errorPage('Something went wrong while applying the action. Please go to admin to complete it manually.', 500)
  }
}
