'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { rejectIntelItem, unrejectIntelItem } from '@/utils/supabase/queries'

export async function rejectIntelAction(id: string) {
  const supabase = createAdminClient()
  await rejectIntelItem(supabase, id)
  revalidatePath('/admin/intel')
}

export async function unrejectIntelAction(id: string) {
  const supabase = createAdminClient()
  await unrejectIntelItem(supabase, id)
  revalidatePath('/admin/intel')
}

export async function rejectPromotedIntelAction(id: string) {
  const supabase = createAdminClient()

  const { data: item } = await supabase
    .from('intel_items')
    .select('alert_id')
    .eq('id', id)
    .single()

  if (item?.alert_id) {
    await supabase
      .from('alerts')
      .update({ status: 'rejected', rejected_reason: 'duplicate of existing coverage' })
      .eq('id', item.alert_id)
      .eq('status', 'pending_review')
  }

  await rejectIntelItem(supabase, id)
  revalidatePath('/admin/intel')
  revalidatePath('/admin/alerts')
}

export async function promoteIntelAction(id: string) {
  const supabase = createAdminClient()

  const { data: item, error: fetchError } = await supabase
    .from('intel_items')
    .select('id, headline, raw_text, source_url, source_name, alert_type, confidence, expires_at, processed, alert_id')
    .eq('id', id)
    .single()

  if (fetchError || !item) {
    throw new Error(`intel item ${id} not found`)
  }

  if (item.processed && item.alert_id) {
    redirect(`/admin/alerts/${item.alert_id}/edit`)
  }

  const slug = `intel-${item.id.slice(0, 8)}-${Date.now()}`
  const { data: alert, error: alertError } = await supabase
    .from('alerts')
    .insert({
      slug,
      title: item.headline,
      summary: item.raw_text?.slice(0, 300) ?? item.headline,
      type: item.alert_type ?? 'news',
      status: 'pending_review',
      confidence_level: item.confidence,
      source_url: item.source_url ?? null,
      source: item.source_name,
      end_date: item.expires_at ?? null,
      source_intel_id: item.id,
      impact_score: 5,
      value_score: 5,
      rarity_score: 5,
      impact_justification: 'Manually promoted from intel',
      action_type: 'monitor',
      registration_required: false,
    })
    .select('id')
    .single()

  if (alertError || !alert) {
    throw new Error(`alert insert failed: ${alertError?.message}`)
  }

  await supabase
    .from('intel_items')
    .update({ processed: true, alert_id: alert.id })
    .eq('id', item.id)

  revalidatePath('/admin/intel')
  redirect(`/admin/alerts/${alert.id}/edit`)
}
