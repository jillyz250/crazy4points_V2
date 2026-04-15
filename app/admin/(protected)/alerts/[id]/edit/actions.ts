'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { updateAlert } from '@/utils/supabase/queries'
import type { AlertUpdate, AlertType, AlertStatus, AlertActionType, ConfidenceLevel } from '@/utils/supabase/queries'
import { logPublishEvent } from '@/utils/ai/logPublishEvent'

export async function updateAlertAction(id: string, formData: FormData) {
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
  const confidence_level = formData.get('confidence_level') as ConfidenceLevel
  const source_url = (formData.get('source_url') as string) || null
  const existing_published_at = (formData.get('existing_published_at') as string) || null

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
    source_url,
    confidence_level,
  }

  const supabase = createAdminClient()
  const alert = await updateAlert(supabase, id, alertData)

  if (status === 'published') {
    try {
      await logPublishEvent(alert)
    } catch {
      // Non-blocking — history logging failure should not prevent redirect
    }
  }

  redirect('/admin/alerts')
}
