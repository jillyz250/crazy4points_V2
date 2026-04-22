'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { resolveSystemError } from '@/utils/supabase/queries'

export async function resolveErrorAction(id: string) {
  const supabase = createAdminClient()
  await resolveSystemError(supabase, id)
  revalidatePath('/admin/errors')
  revalidatePath('/admin', 'layout')
}
