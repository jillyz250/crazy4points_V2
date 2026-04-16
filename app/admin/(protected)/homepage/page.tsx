import { createAdminClient } from '@/utils/supabase/server'
import { getAllHomepageSlots, getAllAlerts } from '@/utils/supabase/queries'
import type { AlertStatus } from '@/utils/supabase/queries'
import { updateHomepageSlotAction } from './actions'

const STATUS_LABEL: Record<AlertStatus, string> = {
  published:      'Published',
  draft:          'Draft',
  pending_review: 'Pending Review',
  rejected:       'Rejected',
  expired:        'Expired',
}

export default async function AdminHomepagePage() {
  const supabase = createAdminClient()
  const [slots, alerts] = await Promise.all([
    getAllHomepageSlots(supabase),
    getAllAlerts(supabase),
  ])

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Homepage Pin Slots</h1>
        <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>
          Choose which alerts appear in the "Top Alerts" section on the homepage.
          Empty slots fall back to the top-scored active alerts automatically.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px' }}>
        {[1, 2, 3, 4].map((slotNumber) => {
          const slot = slots.find((s) => s.slot_number === slotNumber)
          const currentAlertId = slot?.alert_id ?? ''

          return (
            <div
              key={slotNumber}
              style={{
                border: '1px solid var(--color-border-soft)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                background: 'var(--color-background-soft)',
              }}
            >
              <p style={{
                fontFamily: 'var(--font-ui)',
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-primary)',
                marginBottom: '0.75rem',
              }}>
                Slot {slotNumber}
              </p>

              <form
                action={updateHomepageSlotAction.bind(null, slotNumber)}
                style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
              >
                <select
                  name="alert_id"
                  defaultValue={currentAlertId}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-ui)',
                    border: '1px solid var(--color-border-soft)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-primary)',
                    background: 'white',
                  }}
                >
                  <option value="">— No alert pinned (use top scored) —</option>
                  {alerts.map((alert) => (
                    <option key={alert.id} value={alert.id}>
                      [{STATUS_LABEL[alert.status]}] {alert.title}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="rg-btn-primary"
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Save
                </button>
              </form>

              {slot?.alerts && (
                <p style={{
                  marginTop: '0.625rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-secondary)',
                }}>
                  Currently pinned: <strong style={{ color: 'var(--color-text-primary)' }}>{slot.alerts.title}</strong>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
