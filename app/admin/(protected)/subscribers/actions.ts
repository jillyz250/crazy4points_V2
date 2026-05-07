'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { setSubscriberActive, addSubscriber } from '@/utils/supabase/queries'

export async function toggleSubscriberActiveAction(id: string, active: boolean) {
  const supabase = createAdminClient()
  await setSubscriberActive(supabase, id, active)
  revalidatePath('/admin/subscribers')
}

export async function addSubscriberAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const first_name = String(formData.get('first_name') ?? '').trim()
  const last_name = String(formData.get('last_name') ?? '').trim()

  if (!email) {
    return { ok: false, error: 'Email is required.' }
  }
  // Minimal sanity check; Resend verifies deliverability at send time.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "That email doesn't look right." }
  }

  const supabase = createAdminClient()
  try {
    const sub = await addSubscriber(supabase, {
      email,
      first_name: first_name || null,
      last_name: last_name || null,
      active: true,
    })
    revalidatePath('/admin/subscribers')
    return { ok: true, subscriber: sub }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return { ok: false, error: `${email} is already a subscriber.` }
    }
    return { ok: false, error: msg }
  }
}
