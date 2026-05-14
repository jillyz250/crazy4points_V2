'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/server'
import {
  updateAlert,
  setAlertPrograms,
  getAlertById,
  incrementSourceApproved,
} from '@/utils/supabase/queries'
import type { AlertUpdate, AlertType, AlertStatus, AlertActionType, AlertGap, ConfidenceLevel } from '@/utils/supabase/queries'
import { logPublishEvent } from '@/utils/ai/logPublishEvent'
import { actionError, isRedirectError, type ActionResult } from '@/lib/admin/actionResult'

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

export async function updateAlertAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
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
    // Merge with existing alert.gaps so we keep the writer's flagged set;
    // admin's blank values mean "still unfilled" (filled stays null).
    const gapEntries: { field: string; filled: string | null }[] = []
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith('gap__')) continue
      const field = key.slice('gap__'.length)
      if (!field) continue
      const v = typeof value === 'string' ? value.trim() : ''
      gapEntries.push({ field, filled: v.length > 0 ? v : null })
    }

    const supabase = createAdminClient()
    const prev = await getAlertById(supabase, id)

    // Preserve any gaps the writer flagged that aren't in the form (defensive
    // — under normal flow every flagged gap renders an input, but if the
    // banner ever short-circuits we don't want to silently drop the flag).
    const existingGaps: AlertGap[] = Array.isArray(prev.gaps)
      ? (prev.gaps as AlertGap[]).filter((g) => g && typeof g.field === 'string')
      : []
    const submittedFields = new Set(gapEntries.map((g) => g.field))
    const mergedGaps: AlertGap[] = [
      ...gapEntries,
      ...existingGaps.filter((g) => !submittedFields.has(g.field)),
    ]

    const alertData: AlertUpdate = {
      title,
      summary,
      description,
      type,
      status,
      action_type,
      primary_program_id: primary_program_id || null,
      start_date: start_date ? new Date(start_date).toISOString() : null,
      end_date: end_date ? new Date(end_date).toISOString() : null,
      published_at:
        status === 'published'
          ? existing_published_at ?? new Date().toISOString()
          : null,
      history_note,
      why_this_matters,
      override_reason,
      source_url,
      confidence_level,
      is_hot,
      gaps: mergedGaps,
      verified_terms,
      terms_waived_reason,
    }
    const alert = await updateAlert(supabase, id, alertData)

    const taggedIds = (formData.getAll('tagged_program_ids') as string[]).filter(Boolean)
    await setAlertPrograms(supabase, id, taggedIds)

    // Counter-skew fix: increment source approval when edit transitions
    // an intel-sourced alert into published for the first time.
    if (
      status === 'published' &&
      prev.status !== 'published' &&
      prev.source_intel_id
    ) {
      await incrementSourceApproved(supabase, prev.source_intel_id).catch(() => {})
    }

    if (status === 'published') {
      await logPublishEvent(alert).catch(() => {})
    }

    // Revalidate the public-facing pages this alert lives on so the /alerts
    // index and per-program /programs/[slug] pages reflect the change
    // immediately. Otherwise ISR holds the cached snapshot for up to 60s.
    await revalidatePublicAlertPaths(supabase, id, alert.slug)
  } catch (err) {
    if (isRedirectError(err)) throw err
    return actionError(err)
  }
  redirect('/admin/alerts')
}
