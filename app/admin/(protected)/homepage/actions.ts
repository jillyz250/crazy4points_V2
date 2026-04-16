'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { upsertHomepageSlot } from '@/utils/supabase/queries'

export async function updateHomepageSlotAction(
  slotNumber: number,
  formData: FormData
): Promise<void> {
  const raw = formData.get('alert_id')
  const alertId = raw && raw !== '' ? (raw as string) : null

  const supabase = createAdminClient()
  await upsertHomepageSlot(supabase, slotNumber, alertId)

  revalidatePath('/admin/homepage')
  revalidatePath('/')
}
