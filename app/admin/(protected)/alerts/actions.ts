'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { updateAlert, expireAlert } from '@/utils/supabase/queries'

export async function publishAlertAction(id: string) {
  const supabase = createAdminClient()
  await updateAlert(supabase, id, {
    status: 'published',
    published_at: new Date().toISOString(),
  })
  redirect('/admin/alerts')
}

export async function approveIntelAlertAction(id: string) {
  const supabase = createAdminClient()
  await updateAlert(supabase, id, {
    status: 'published',
    published_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
  })
  redirect('/admin/alerts')
}

export async function rejectAlertAction(id: string) {
  const supabase = createAdminClient()
  await updateAlert(supabase, id, { status: 'rejected' })
  redirect('/admin/alerts')
}

export async function expireAlertAction(id: string) {
  const supabase = createAdminClient()
  await expireAlert(supabase, id)
  redirect('/admin/alerts')
}
