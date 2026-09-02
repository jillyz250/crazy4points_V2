import { createAdminClient } from '@/utils/supabase/server'
import Notepad from '@/components/admin/dashboard/Notepad'
import { Icon } from '@/components/admin/preview/icons'
import type { DashboardNote } from '@/app/admin/(protected)/notes-actions'

export const dynamic = 'force-dynamic'

const DISPLAY = 'var(--font-display)'

export default async function NotepadPage() {
  const db = createAdminClient()
  const { data } = await db
    .from('dashboard_notes')
    .select('id, body, sent_to_takes, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(200)
  const notes = (data ?? []) as DashboardNote[]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.4rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 8%, #fff)', border: '1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border))' }}>
          <Icon name="note" size={20} />
        </span>
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--color-primary)', margin: 0, lineHeight: 1.05 }}>Notepad</h1>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-muted)' }}>Quick jots — they save when you click away. Promote any to Jill&rsquo;s Takes.</p>
        </div>
      </div>
      <div style={{ background: 'var(--admin-surface)', border: '1px solid color-mix(in srgb, var(--color-primary) 9%, var(--admin-border))', borderRadius: 18, boxShadow: '0 1px 2px rgba(107,45,143,.035), 0 18px 40px -30px rgba(107,45,143,.26)', padding: '1.5rem' }}>
        <Notepad initialNotes={notes} />
      </div>
    </div>
  )
}
