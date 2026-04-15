'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { toggleProgramActive } from '@/utils/supabase/queries'

export async function toggleProgramAction(id: string, is_active: boolean) {
  const supabase = createAdminClient()
  await toggleProgramActive(supabase, id, is_active)
  revalidatePath('/admin/programs')
}
