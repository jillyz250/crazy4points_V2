'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { getAlertById, incrementSourceApproved } from '@/utils/supabase/queries'
import type { AlertType, AlertStatus, AlertActionType, AlertGap, ConfidenceLevel } from '@/utils/supabase/queries'
import { logPublishEvent } from '@/utils/ai/logPublishEvent'
import { actionError, isRedirectError, type ActionResult } from '@/lib/admin/actionResult'
import { findVariantByAlertId, setAlertVariantPrograms } from '@/utils/content/writeAlertVariant'

// Mirror of revalidateAlertPaths in ../actions.ts. Inline here to avoid a
// circular import (this file is imported by ../actions.ts indirectly).
async function revalidatePublicAlertPaths(
  supabase: SupabaseClient,
  alertId: string,
  alertSlug: string | null,
) {
  revalidatePath('/alerts')
  if (alertSlug) revalidatePath(`/alerts/${alertSlug}`)
  const { data: row } = await supabase
    .from('alerts')
    .select('primary_program_id, alert_programs(program_id)')
    .eq('id', alertId)
    .maybeSingle()
  const programIds = new Set<string>()
  if (row?.primary_program_id) programIds.add(row.primary_program_id as string)
  const junction = (row?.alert_programs ?? []) as { program_id: string }[]
  for (const j of junction) if (j.program_id) programIds.add(j.program_id)
  if (programIds.size === 0) return
  const { data: programs } = await supabase
    .from('programs')
    .select('slug')
    .in('id', Array.from(programIds))
  for (const p of programs ?? []) {
    if (p.slug) revalidatePath(`/programs/${p.slug}`)
  }
}

// Map alerts.status → content_variants.status
function variantStatusFromAlert(s: AlertStatus): 'draft' | 'needs_review' | 'published' | 'archived' {
  switch (s) {
    case 'draft': return 'draft'
    case 'pending_review': return 'needs_review'
    case 'published': return 'published'
    case 'expired': return 'published'
    case 'rejected':
    case 'soft_rejected':
      return 'archived'
    default: return 'draft'
  }
}

function topicStatusFromAlert(s: AlertStatus): 'draft' | 'active' | 'archived' {
  switch (s) {
    case 'draft': return 'draft'
    case 'pending_review':
    case 'published':
    case 'expired':
      return 'active'
    case 'rejected':
    case 'soft_rejected':
      return 'archived'
    default: return 'draft'
  }
}

export async function updateAlertAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin()
  try {
    const title = formData.get('title') as string
    const type = formData.get('type') as AlertType
    const status = formData.get('status') as AlertStatus
    const primary_program_id = (formData.get('primary_program_id') as string) || null
    const summary = (formData.get('summary') as string) || title
    const description = (formData.get('description') as string) || null
    const start_date = (formData.get('start_date') as string) || null
    const end_date = (formData.get('end_date') as string) || null
    const action_type = formData.get('action_type') as AlertActionType
    const history_note = (formData.get('history_note') as string) || null
    const verified_terms_raw = (formData.get('verified_terms') as string)?.trim() || ''
    const verified_terms = verified_terms_raw.length > 0 ? verified_terms_raw : null
    const terms_waived_reason_raw = (formData.get('terms_waived_reason') as string)?.trim() || ''
    const terms_waived_reason = terms_waived_reason_raw.length > 0 ? terms_waived_reason_raw : null
    const why_this_matters = (formData.get('why_this_matters') as string)?.trim() || null
    const override_reason = (formData.get('override_reason') as string)?.trim() || null
    const confidence_level = formData.get('confidence_level') as ConfidenceLevel
    const source_url = (formData.get('source_url') as string) || null
    const is_hot = formData.get('is_hot') === 'on'
    const existing_published_at = (formData.get('existing_published_at') as string) || null

    // Gap fills come in as gap__<field> textarea entries from AlertGapsBanner.
    const gapEntries: { field: string; filled: string | null }[] = []
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith('gap__')) continue
      const field = key.slice('gap__'.length)
      if (!field) continue
      const v = typeof value === 'string' ? value.trim() : ''
      gapEntries.push({ field, filled: v.length > 0 ? v : null })
    }

    const supabase = createAdminClient()

    // Wave 3a: resolve variant + topic; alerts mirror is downstream.
    const refs = await findVariantByAlertId(supabase, id)
    if (!refs) throw new Error('alert not found (no matching topic/variant)')

    const prev = await getAlertById(supabase, id) // still reads alerts mirror, fine for reads

    // Preserve writer-flagged gaps not in the form
    const existingGaps: AlertGap[] = Array.isArray(prev.gaps)
      ? (prev.gaps as AlertGap[]).filter((g) => g && typeof g.field === 'string')
      : []
    const submittedFields = new Set(gapEntries.map((g) => g.field))
    const mergedGaps: AlertGap[] = [
      ...gapEntries,
      ...existingGaps.filter((g) => !submittedFields.has(g.field)),
    ]

    // Read current variant + topic state so we can merge into metadata.
    const [{ data: variant }, { data: topic }] = await Promise.all([
      supabase.from('content_variants').select('metadata').eq('id', refs.variant_id).single(),
      supabase.from('topics').select('metadata, source_urls').eq('id', refs.topic_id).single(),
    ])

    const newVariantMeta = {
      ...((variant?.metadata as object) ?? {}),
      original_alert_type: type,
      action_type: action_type ?? null,
      start_date: start_date ? new Date(start_date).toISOString() : null,
      history_note,
      override_reason,
      confidence_level,
      gaps: mergedGaps,
      verified_terms,
      terms_waived_reason,
    }

    const currentEd = (topic?.metadata as { editorial_scores?: Record<string, unknown> } | null)?.editorial_scores ?? {}
    const newTopicMeta = {
      ...((topic?.metadata as object) ?? {}),
      editorial_scores: {
        ...currentEd,
        is_hot,
        why_this_matters,
      },
    }

    // Update variant — title, body, status, published_at, metadata
    const variantUpdate: Record<string, unknown> = {
      title,
      body: description,
      status: variantStatusFromAlert(status),
      metadata: newVariantMeta,
    }
    if (status === 'published') {
      variantUpdate.published_at = existing_published_at ?? new Date().toISOString()
    }
    const { error: vErr } = await supabase
      .from('content_variants')
      .update(variantUpdate)
      .eq('id', refs.variant_id)
    if (vErr) throw new Error(`variant update failed: ${vErr.message}`)

    // Update topic — summary, end_date, status, source_urls, metadata
    const topicUpdate: Record<string, unknown> = {
      summary,
      end_date: end_date ? new Date(end_date).toISOString() : null,
      status: topicStatusFromAlert(status),
      metadata: newTopicMeta,
    }
    if (source_url) {
      topicUpdate.source_urls = [source_url]
    } else if (topic?.source_urls && Array.isArray(topic.source_urls) && topic.source_urls.length > 0) {
      topicUpdate.source_urls = [] // explicit clear
    }
    const { error: tErr } = await supabase
      .from('topics')
      .update(topicUpdate)
      .eq('id', refs.topic_id)
    if (tErr) throw new Error(`topic update failed: ${tErr.message}`)

    // Reconcile program tagging via the helper (trigger rebuilds alert_programs)
    const taggedIds = (formData.getAll('tagged_program_ids') as string[]).filter(Boolean)
    const secondaryIds = taggedIds.filter((tid) => tid !== primary_program_id)
    await setAlertVariantPrograms(supabase, id, {
      primaryProgramId: primary_program_id,
      secondaryProgramIds: secondaryIds,
    })

    // Counter-skew fix — first-time publish triggers source approval bump
    if (
      status === 'published' &&
      prev.status !== 'published' &&
      prev.source_intel_id
    ) {
      await incrementSourceApproved(supabase, prev.source_intel_id).catch(() => {})
    }

    if (status === 'published') {
      // logPublishEvent expects the legacy Alert shape; load the now-mirrored alerts row.
      const refreshed = await getAlertById(supabase, id).catch(() => null)
      if (refreshed) await logPublishEvent(refreshed).catch(() => {})
    }

    await revalidatePublicAlertPaths(supabase, id, prev.slug)
  } catch (err) {
    if (isRedirectError(err)) throw err
    return actionError(err)
  }
  redirect('/admin/alerts')
}
