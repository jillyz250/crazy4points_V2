'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Vendors actions (Erica, Head of Finance). The vendor directory — contact,
 * website, login, plan, pricing, renewal — the relationship record beside the
 * money (/admin/expenses) and the product updates (vendor_radar). Every action
 * re-verifies admin at the data layer (server actions are callable POST endpoints).
 */

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

function numOrNull(raw: string): number | null {
  const v = raw.trim().replace(/[$,\s]/g, '')
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Create or update a vendor. Hidden `id` present → update; else insert. */
export async function saveVendor(formData: FormData): Promise<void> {
  await assertAdmin()
  const db = createAdminClient()

  const id = String(formData.get('id') || '').trim()
  const name = String(formData.get('name') || '').trim()
  if (!name) return

  const row = {
    name,
    category: String(formData.get('category') || '').trim() || null,
    website: String(formData.get('website') || '').trim() || null,
    account_url: String(formData.get('account_url') || '').trim() || null,
    contact_name: String(formData.get('contact_name') || '').trim() || null,
    contact_email: String(formData.get('contact_email') || '').trim() || null,
    plan: String(formData.get('plan') || '').trim() || null,
    flat_monthly: numOrNull(String(formData.get('flat_monthly') || '')) ?? 0,
    usage_monthly: numOrNull(String(formData.get('usage_monthly') || '')),
    billing_cycle: String(formData.get('billing_cycle') || 'monthly').trim() || 'monthly',
    renewal_date: String(formData.get('renewal_date') || '').trim() || null,
    status: String(formData.get('status') || 'active').trim() || 'active',
    rec: String(formData.get('rec') || '').trim() || null,
    notes: String(formData.get('notes') || '').trim() || null,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    await db.from('vendors').update(row).eq('id', id)
  } else {
    // New vendor: derive a unique-ish slug from the name.
    const base = slugify(name) || `vendor-${Date.now()}`
    await db.from('vendors').insert({ ...row, slug: base })
  }

  revalidatePath('/admin/vendors')
}

/** Delete a vendor. */
export async function deleteVendor(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') || '').trim()
  if (!id) return
  const db = createAdminClient()
  await db.from('vendors').delete().eq('id', id)
  revalidatePath('/admin/vendors')
}
