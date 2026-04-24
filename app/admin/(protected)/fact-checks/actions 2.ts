'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { webVerifyClaims, type VerifyClaim } from '@/utils/ai/verifyAlertDraft'
import { logSystemError } from '@/utils/supabase/queries'

export interface ReverifyResult {
  ok: boolean
  error?: string
  verdictCounts?: { likely_correct: number; likely_wrong: number; unverifiable: number }
}

// Re-run the webVerifyClaims pass on a single alert's stored fact-check claims.
// Sidesteps the build-brief 300s budget — called directly from the fact-checks
// admin page when the original brief run's web-verify step failed or was skipped.
export async function reverifyAlertClaimsAction(alertId: string): Promise<ReverifyResult> {
  const supabase = createAdminClient()

  const { data: alert, error: alertErr } = await supabase
    .from('alerts')
    .select('id, title, source_url, fact_check_claims')
    .eq('id', alertId)
    .maybeSingle()

  if (alertErr || !alert) {
    return { ok: false, error: alertErr?.message ?? 'alert not found' }
  }

  const claims = Array.isArray(alert.fact_check_claims)
    ? (alert.fact_check_claims as VerifyClaim[])
    : []
  if (claims.length === 0) return { ok: false, error: 'alert has no fact_check_claims' }
  if (!claims.some((c) => !c.supported)) {
    return { ok: false, error: 'no unsupported claims to re-verify' }
  }

  let grounded: VerifyClaim[]
  try {
    grounded = await webVerifyClaims({
      claims,
      context: {
        title: (alert.title as string) ?? '',
        source_url: (alert.source_url as string | null) ?? null,
      },
    })
  } catch (err) {
    await logSystemError(supabase, 'fact-checks:reverifyAlertClaims', err, {
      alert_id: alertId,
      title: alert.title,
    })
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  const { error: updErr } = await supabase
    .from('alerts')
    .update({ fact_check_claims: grounded })
    .eq('id', alertId)

  if (updErr) return { ok: false, error: updErr.message }

  const verdictCounts = { likely_correct: 0, likely_wrong: 0, unverifiable: 0 }
  for (const c of grounded) {
    if (c.web_verdict === 'likely_correct') verdictCounts.likely_correct++
    else if (c.web_verdict === 'likely_wrong') verdictCounts.likely_wrong++
    else if (c.web_verdict === 'unverifiable') verdictCounts.unverifiable++
  }

  revalidatePath('/admin/fact-checks')
  return { ok: true, verdictCounts }
}
