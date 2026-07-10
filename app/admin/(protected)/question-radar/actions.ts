'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

const STATUSES = new Set(['new', 'saved', 'used', 'dismissed'])

/**
 * Move a radar question through its review states:
 *  - saved: worth posting, keep it in the list
 *  - used: turned into a post, archive it
 *  - dismissed: not useful, hide it
 */
export async function setQuestionStatus(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()
  if (!id || !STATUSES.has(status)) return
  const supabase = createAdminClient()
  await supabase.from('content_questions').update({ status }).eq('id', id)
  revalidatePath('/admin/question-radar')
}
