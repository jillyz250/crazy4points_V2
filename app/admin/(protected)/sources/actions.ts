'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { toggleSourceActive, deleteSourceById } from '@/utils/supabase/queries'

export async function toggleSourceAction(id: string, is_active: boolean) {
  await assertAdmin()
  const supabase = createAdminClient()
  await toggleSourceActive(supabase, id, is_active)
  revalidatePath('/admin/sources')
}

export async function deleteSourceAction(id: string) {
  await assertAdmin()
  const supabase = createAdminClient()
  await deleteSourceById(supabase, id)
  revalidatePath('/admin/sources')
}
