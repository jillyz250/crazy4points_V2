'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { VENDOR_RADAR_STATUSES, type VendorRadarStatus } from './shared'

/**
 * Expenses actions (Erica, Head of Finance). Jill logs the money going OUT here.
 * Every action re-verifies admin authorization at the data layer — server actions
 * are independently-callable POST endpoints, so the layout gate isn't enough.
 *
 * Reconcile to the penny: amount is parsed to a fixed 2-decimal string and stored
 * in a numeric(12,2) column. No floats reach the DB, nothing gets rounded away.
 *
 * NOTE: constants + types live in ./shared — a 'use server' file may only export
 * async functions.
 */

/** Log one expense. Returns an error string on bad input (form re-shows it). */
export async function addExpense(formData: FormData): Promise<void> {
  await assertAdmin()
  const db = createAdminClient()

  const spent_on = String(formData.get('spent_on') || '').trim()
  const amountRaw = String(formData.get('amount') || '').trim().replace(/[$,\s]/g, '')
  const vendor = String(formData.get('vendor') || '').trim()
  const category = String(formData.get('category') || '').trim()
  const note = String(formData.get('note') || '').trim()

  // Validate: a real date and a positive, finite amount. Bail quietly if not —
  // the HTML `required`/`min`/`type` attributes are the first line of defense.
  const amountNum = Number(amountRaw)
  if (!spent_on || !amountRaw || !Number.isFinite(amountNum) || amountNum <= 0) return

  await db.from('expenses').insert({
    spent_on,
    amount: amountNum.toFixed(2), // exact 2-decimal string → numeric(12,2)
    vendor: vendor || null,
    category: category || null,
    note: note || null,
  })

  revalidatePath('/admin/expenses')
}

/** Delete one logged expense (e.g. a mistake or a duplicate). */
export async function deleteExpense(id: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const db = createAdminClient()
  await db.from('expenses').delete().eq('id', id)
  revalidatePath('/admin/expenses')
}

/**
 * Triage one vendor-radar item: set its status (reviewed | acted | dismissed |
 * new) and stamp decided_at. Re-verifies admin — this is a standalone POST.
 * revalidatePath so the row restyles/reorders (handled rows recede).
 */
export async function setVendorRadarStatus(id: string, status: VendorRadarStatus): Promise<void> {
  await assertAdmin()
  if (!id || !VENDOR_RADAR_STATUSES.includes(status)) return
  const db = createAdminClient()
  await db
    .from('vendor_radar')
    .update({
      status,
      // 'new' means "back to the triage queue" — clear the decision stamp.
      decided_at: status === 'new' ? null : new Date().toISOString(),
    })
    .eq('id', id)
  revalidatePath('/admin/expenses')
}
