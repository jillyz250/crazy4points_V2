'use server'

import { revalidatePath } from 'next/cache'
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
