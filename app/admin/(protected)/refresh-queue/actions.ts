'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Bump last_verified=today on a single row in the admin_refresh_queue.
 * Called when the user has confirmed the entity's data is still current
 * but nothing actually needs editing — drops the row out of the queue
 * until the next cadence cycle.
 *
 * The view's underlying tables vary by entity_type, so we route the
 * UPDATE per type. Adding a new tracked entity = adding a case here.
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
    case 'transfer_partners':
      // entity_id is the program id; this entity tracks the program's
      // transfer-partner data freshness via programs.transfer_partners_verified_at
      // (separate from programs.last_verified). Stamp that field so the row
      // drops out of the queue.
      {
        const { error } = await supabase
          .from('programs')
          .update({ transfer_partners_verified_at: new Date().toISOString() })
          .eq('id', entityId)
        if (error) throw error
        revalidatePath('/admin/accuracy')
        revalidatePath('/admin')
        return
      }
    case 'alert':
      // Direct writes to `alerts` are blocked by the G6 trigger; last_verified
      // lives in the content_variant metadata and the variants->alerts trigger
      // mirrors it back. Stamp it there so the alert drops out of the queue
      // (i.e. "reviewed, still accurate") until the next 120-day cycle.
      {
        const { updateAlertVariantMetadata } = await import('@/utils/content/writeAlertVariant')
        await updateAlertVariantMetadata(supabase, entityId, { last_verified: today })
        revalidatePath('/admin/accuracy')
        revalidatePath('/admin')
        return
      }
    case 'hotel_properties_program':
      // entity_id here is actually the program_id; bump every property's
      // last_verified at once so the program drops off the queue. The
      // alternative (per-property) would force the user through 1,500
      // rows for Hyatt alone.
      {
        const { error } = await supabase
          .from('hotel_properties')
          .update({ last_verified: today })
          .eq('program_id', entityId)
        if (error) throw error
        revalidatePath('/admin/accuracy')
        revalidatePath('/admin')
        return
      }
    default:
      // Programs (program_airline, program_hotel, program_currency, etc.)
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

  revalidatePath('/admin/accuracy')
  revalidatePath('/admin')
}
