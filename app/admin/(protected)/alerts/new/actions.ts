'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { createAlert } from '@/utils/supabase/queries'
import type { AlertInsert, AlertType, AlertStatus, AlertActionType, ConfidenceLevel } from '@/utils/supabase/queries'

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
    impact_justification: '',
    value_score: 5,
    rarity_score: 5,
    registration_required: false,
    created_by: null,
    approved_by: null,
    last_verified: null,
  }

  console.log('[createAlertAction] payload:', JSON.stringify(alertData, null, 2))

  const supabase = createAdminClient()

  try {
    await createAlert(supabase, alertData)
  } catch (err) {
    console.log('[createAlertAction] caught error:', JSON.stringify(err, null, 2))
    throw err
  }

  redirect('/admin/alerts')
}
