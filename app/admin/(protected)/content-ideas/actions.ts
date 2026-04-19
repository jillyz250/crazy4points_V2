'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'

type IdeaStatus = 'new' | 'queued' | 'drafted' | 'published' | 'dismissed'
const VALID: IdeaStatus[] = ['new', 'queued', 'drafted', 'published', 'dismissed']

export async function updateContentIdeaStatusAction(
  id: string,
  status: string
): Promise<void> {
  if (!VALID.includes(status as IdeaStatus)) {
    throw new Error(`Invalid status: ${status}`)
  }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('content_ideas')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/admin/content-ideas')
}

export async function updateContentIdeaNotesAction(
  id: string,
  formData: FormData
): Promise<void> {
  const notes = (formData.get('notes') as string | null) ?? ''
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('content_ideas')
    .update({ notes: notes.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/admin/content-ideas')
}
