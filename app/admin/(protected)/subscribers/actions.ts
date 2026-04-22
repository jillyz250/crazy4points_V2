'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { setSubscriberActive } from '@/utils/supabase/queries'

export async function toggleSubscriberActiveAction(id: string, active: boolean) {
  const supabase = createAdminClient()
  await setSubscriberActive(supabase, id, active)
  revalidatePath('/admin/subscribers')
}
