'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { toggleSourceActive } from '@/utils/supabase/queries'

export async function toggleSourceAction(id: string, is_active: boolean) {
  const supabase = createAdminClient()
  await toggleSourceActive(supabase, id, is_active)
  revalidatePath('/admin/sources')
}
