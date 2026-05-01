'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import {
  createPartnerRedemption,
  updatePartnerRedemption,
  deletePartnerRedemption,
} from '@/utils/supabase/queries'
import type {
  PricingModel,
  RedemptionCabin,
  RedemptionConfidence,
} from '@/utils/supabase/queries'

const CABINS: RedemptionCabin[] = ['Economy', 'Premium Economy', 'Business', 'First']
const MODELS: PricingModel[] = ['fixed', 'dynamic', 'hybrid']
const CONFIDENCE: RedemptionConfidence[] = ['HIGH', 'MED', 'LOW']

function parseIntOrNull(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
}

function parseDateOrNull(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? '').trim()
  return s || null
}

export async function createPartnerRedemptionAction(
  formData: FormData
): Promise<{ error?: string }> {
  const currency_program_id = String(formData.get('currency_program_id') ?? '').trim()
  const operating_carrier_id = String(formData.get('operating_carrier_id') ?? '').trim()
  const cabin = String(formData.get('cabin') ?? '') as RedemptionCabin
  const region_or_route = String(formData.get('region_or_route') ?? '').trim()
  const pricing_model = (String(formData.get('pricing_model') ?? 'fixed') || 'fixed') as PricingModel
  const cost_miles_low = parseIntOrNull(formData.get('cost_miles_low'))
  const cost_miles_high = parseIntOrNull(formData.get('cost_miles_high'))
  const notes = String(formData.get('notes') ?? '').trim() || null
  const confidence = (String(formData.get('confidence') ?? 'MED') || 'MED') as RedemptionConfidence
  const last_verified = parseDateOrNull(formData.get('last_verified'))

  if (!currency_program_id) return { error: 'Currency program is required.' }
  if (!operating_carrier_id) return { error: 'Operating carrier is required.' }
  if (!CABINS.includes(cabin)) return { error: 'Invalid cabin.' }
  if (!region_or_route) return { error: 'Region or route is required.' }
  if (!MODELS.includes(pricing_model)) return { error: 'Invalid pricing model.' }
  if (!CONFIDENCE.includes(confidence)) return { error: 'Invalid confidence.' }
  if (
    cost_miles_low !== null &&
    cost_miles_high !== null &&
    cost_miles_high < cost_miles_low
  ) {
    return { error: 'Cost high must be greater than or equal to cost low.' }
  }

  const supabase = createAdminClient()
  try {
    await createPartnerRedemption(supabase, {
      currency_program_id,
      operating_carrier_id,
      cabin,
      region_or_route,
      cost_miles_low,
      cost_miles_high,
      pricing_model,
      notes,
      confidence,
      last_verified,
      is_active: true,
    })
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create redemption.' }
  }
  revalidatePath('/admin/partner-redemptions')
  return {}
}

export async function updatePartnerRedemptionAction(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const cabin = String(formData.get('cabin') ?? '') as RedemptionCabin
  const pricing_model = String(formData.get('pricing_model') ?? 'fixed') as PricingModel
  const confidence = String(formData.get('confidence') ?? 'MED') as RedemptionConfidence
  if (!CABINS.includes(cabin)) return { error: 'Invalid cabin.' }
  if (!MODELS.includes(pricing_model)) return { error: 'Invalid pricing model.' }
  if (!CONFIDENCE.includes(confidence)) return { error: 'Invalid confidence.' }

  const cost_miles_low = parseIntOrNull(formData.get('cost_miles_low'))
  const cost_miles_high = parseIntOrNull(formData.get('cost_miles_high'))
  if (
    cost_miles_low !== null &&
    cost_miles_high !== null &&
    cost_miles_high < cost_miles_low
  ) {
    return { error: 'Cost high must be greater than or equal to cost low.' }
  }

  const supabase = createAdminClient()
  try {
    await updatePartnerRedemption(supabase, id, {
      currency_program_id: String(formData.get('currency_program_id') ?? '').trim(),
      operating_carrier_id: String(formData.get('operating_carrier_id') ?? '').trim(),
      cabin,
      region_or_route: String(formData.get('region_or_route') ?? '').trim(),
      cost_miles_low,
      cost_miles_high,
      pricing_model,
      notes: String(formData.get('notes') ?? '').trim() || null,
      confidence,
      last_verified: parseDateOrNull(formData.get('last_verified')),
      is_active: formData.get('is_active') === 'on',
    })
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update redemption.' }
  }
  revalidatePath('/admin/partner-redemptions')
  return {}
}

export async function deletePartnerRedemptionAction(
  id: string
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  try {
    await deletePartnerRedemption(supabase, id)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete.' }
  }
  revalidatePath('/admin/partner-redemptions')
  return {}
}

export async function markVerifiedTodayAction(
  id: string
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  try {
    await updatePartnerRedemption(supabase, id, { last_verified: today })
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to mark verified.' }
  }
  revalidatePath('/admin/partner-redemptions')
  return {}
}
