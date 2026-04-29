'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import {
  toggleProgramActive,
  createProgram,
  updateProgramPageContent,
} from '@/utils/supabase/queries'
import type {
  ProgramType,
  MonitorTier,
  ProgramPageContentInput,
} from '@/utils/supabase/queries'

export async function toggleProgramAction(id: string, is_active: boolean) {
  const supabase = createAdminClient()
  await toggleProgramActive(supabase, id, is_active)
  revalidatePath('/admin/programs')
}

const PROGRAM_TYPES: ProgramType[] = [
  'credit_card', 'airline', 'hotel', 'loyalty_program', 'alliance', 'car_rental', 'cruise',
  'shopping_portal', 'travel_portal', 'lounge_network', 'ota',
]
const MONITOR_TIERS: MonitorTier[] = ['daily', 'weekly', 'monthly']

export async function createProgramAction(formData: FormData): Promise<{ error?: string }> {
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase()
  const name = String(formData.get('name') ?? '').trim()
  const type = String(formData.get('type') ?? '') as ProgramType
  const tier = String(formData.get('tier') ?? '').trim() || null
  const monitorRaw = String(formData.get('monitor_tier') ?? '').trim()
  const monitor_tier = MONITOR_TIERS.includes(monitorRaw as MonitorTier) ? (monitorRaw as MonitorTier) : null
  const program_url = String(formData.get('program_url') ?? '').trim() || null

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return { error: 'Slug: lowercase letters, numbers, hyphens only.' }
  if (!name) return { error: 'Name is required.' }
  if (!PROGRAM_TYPES.includes(type)) return { error: 'Invalid type.' }

  const supabase = createAdminClient()
  try {
    await createProgram(supabase, { slug, name, type, tier, monitor_tier, program_url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create program.'
    return { error: msg.includes('duplicate') ? `Slug "${slug}" already exists.` : msg }
  }
  revalidatePath('/admin/programs')
  return {}
}

export async function updateProgramPageContentAction(
  id: string,
  input: ProgramPageContentInput
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  try {
    await updateProgramPageContent(supabase, id, input)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to save page content.' }
  }
  revalidatePath('/admin/programs')
  return {}
}
