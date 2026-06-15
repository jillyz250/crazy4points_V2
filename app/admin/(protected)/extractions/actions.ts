'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Bump last_verified=today on a single entity in the extractions hub.
 * Mirrors the refresh-queue mark-verified flow but with revalidate paths
 * tuned for the new /admin/extractions page.
 *
 * Adding a new tracked entity type = adding a case here.
 */
export async function markVerifiedAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const entityType = String(formData.get('entity_type') ?? '')
  const entityId = String(formData.get('entity_id') ?? '')

  if (!entityType || !entityId) return

  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  let table: string | null = null
  switch (entityType) {
    case 'credit_card':
      table = 'credit_cards'
      break
    case 'credit_card_welcome_bonus':
      table = 'credit_card_welcome_bonuses'
      break
    case 'issuer':
      table = 'issuers'
      break
    case 'hotel_properties_program':
      {
        const { error } = await supabase
          .from('hotel_properties')
          .update({ last_verified: today })
          .eq('program_id', entityId)
        if (error) throw error
        revalidatePath('/admin/extractions')
        revalidatePath('/admin/refresh-queue')
        revalidatePath('/admin')
        return
      }
    default:
      if (entityType.startsWith('program_')) {
        table = 'programs'
      }
  }

  if (!table) {
    throw new Error(`Unknown entity type: ${entityType}`)
  }

  const { error } = await supabase
    .from(table)
    .update({ last_verified: today })
    .eq('id', entityId)

  if (error) throw error

  revalidatePath('/admin/extractions')
  revalidatePath('/admin/refresh-queue')
  revalidatePath('/admin')
}
