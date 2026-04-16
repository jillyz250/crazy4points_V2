'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { createAlert, setAlertPrograms } from '@/utils/supabase/queries'
import type { AlertInsert, AlertType, AlertStatus, AlertActionType, ConfidenceLevel } from '@/utils/supabase/queries'
import { logPublishEvent } from '@/utils/ai/logPublishEvent'

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

export async function createAlertAction(formData: FormData) {
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

  const alertData: AlertInsert = {
    slug: toSlug(title),
    title,
    summary: title, // summary is required; use title as default until an edit form supports it
    description,
    type,
    status,
    action_type,
    primary_program_id: primary_program_id || null,
    start_date: start_date ? new Date(start_date).toISOString() : null,
    end_date: end_date ? new Date(end_date).toISOString() : null,
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
    approved_by: null,
    last_verified: null,
  }

  const supabase = createAdminClient()
  const alert = await createAlert(supabase, alertData)

  // Sync alert_programs junction table
  const taggedIds = (formData.getAll('tagged_program_ids') as string[]).filter(Boolean)
  if (taggedIds.length > 0) {
    await setAlertPrograms(supabase, alert.id, taggedIds)
  }

  if (status === 'published') {
    try {
      await logPublishEvent(alert)
    } catch {
      // Non-blocking — history logging failure should not prevent redirect
    }
  }

  redirect('/admin/alerts')
}
