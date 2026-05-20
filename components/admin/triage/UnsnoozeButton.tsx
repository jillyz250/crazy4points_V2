/**
 * UnsnoozeButton — surface a snoozed item back to Active immediately.
 * Renders on each row in the Snoozed tab.
 */
'use client'

import { unsnoozeIntel } from '@/app/admin/(protected)/triage/actions'

export function UnsnoozeButton({ intelId }: { intelId: string }) {
  return (
    <form action={unsnoozeIntel}>
      <input type="hidden" name="intel_id" value={intelId} />
      <button
        type="submit"
        style={{
          padding: '0.5rem 0.875rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          background: 'transparent',
          color: 'var(--color-chip-purple-fg)',
          border: '1px solid var(--color-chip-purple)',
          borderRadius: 'var(--admin-radius)',
          cursor: 'pointer',
        }}
      >
        Unsnooze
      </button>
    </form>
  )
}
