'use server'

import { redirect } from 'next/navigation'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { getAlertById } from '@/utils/supabase/queries'
import type { AlertType, AlertStatus, AlertActionType, ConfidenceLevel } from '@/utils/supabase/queries'
import { logPublishEvent } from '@/utils/ai/logPublishEvent'
import { actionError, isRedirectError, type ActionResult } from '@/lib/admin/actionResult'
import { writeAlertVariant } from '@/utils/content/writeAlertVariant'

function toSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-') +
    '-' +
    Date.now()
  )
}

export async function createAlertAction(formData: FormData): Promise<ActionResult> {
  await assertAdmin()
  try {
    const title = formData.get('title') as string
    const type = formData.get('type') as AlertType
    const status = formData.get('status') as AlertStatus
    const primary_program_id = (formData.get('primary_program_id') as string) || null
    const description = formData.get('description') as string
    const start_date = (formData.get('start_date') as string) || null
    const end_date = (formData.get('end_date') as string) || null
    const action_type = formData.get('action_type') as AlertActionType
    const history_note = (formData.get('history_note') as string) || null
    const confidence_level = formData.get('confidence_level') as ConfidenceLevel
    const source_url = (formData.get('source_url') as string) || null

    const supabase = createAdminClient()

    // Resolve all tagged program IDs → slugs for topic.programs[]
    const taggedIds = (formData.getAll('tagged_program_ids') as string[]).filter(Boolean)
    const allIds = Array.from(new Set([
      ...(primary_program_id ? [primary_program_id] : []),
      ...taggedIds,
    ]))
    let programSlugs: string[] = []
    if (allIds.length > 0) {
      const { data: progs } = await supabase
        .from('programs')
        .select('slug')
        .in('id', allIds)
      programSlugs = (progs ?? []).map((p) => p.slug as string)
    }

    // Wave 3a: writeAlertVariant() lands the new alert as topic + variant.
    // The trigger mirrors back to alerts; logPublishEvent reads the mirror.
    const result = await writeAlertVariant(supabase, {
      slug: toSlug(title),
      title,
      summary: title,
      description,
      type,
      status,
      action_type,
      primary_program_id,
      program_slugs: programSlugs,
      start_date,
      end_date,
      published_at: status === 'published' ? new Date().toISOString() : null,
      source: null,
      source_url,
      confidence_level,
      impact_score: 5,
      impact_justification: 'Manually created',
      value_score: 5,
      rarity_score: 5,
      history_note,
      registration_required: false,
      created_by: null,
      is_hot: false,
      gaps: [],
      verified_terms: null,
    })

    if (status === 'published') {
      // logPublishEvent expects the legacy Alert row; load via the mirror.
      const alert = await getAlertById(supabase, result.alert_id).catch(() => null)
      if (alert) await logPublishEvent(alert).catch(() => {})
    }
  } catch (err) {
    if (isRedirectError(err)) throw err
    return actionError(err)
  }
  redirect('/admin/alerts')
}
