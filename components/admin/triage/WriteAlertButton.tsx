/**
 * WriteAlertButton — server-action form with a loading state.
 *
 * The underlying writeAlertFromCandidate action runs ~3 Sonnet calls
 * (writer → editor → voice check), taking 30-60 seconds. Without a pending
 * state the button looked dead and editors thought "nothing happened."
 *
 * Uses React's useFormStatus to expose pending state to the button while
 * the parent form's action is running.
 */
'use client'

import { useFormStatus } from 'react-dom'
import { writeAlertFromCandidate } from '@/app/admin/(protected)/triage/actions'

export function WriteAlertButton({ intelId }: { intelId: string }) {
  return (
    <form action={writeAlertFromCandidate}>
      <input type="hidden" name="intel_id" value={intelId} />
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      style={{
        padding: '0.5rem 1rem',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8125rem',
        fontWeight: 600,
        background: pending ? 'var(--admin-text-muted)' : 'var(--admin-accent)',
        color: '#fff',
        border: 'none',
        borderRadius: 'var(--admin-radius)',
        cursor: pending ? 'wait' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
      }}
    >
      {pending && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: '0.75rem',
            height: '0.75rem',
            border: '2px solid rgba(255,255,255,0.4)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'wa-spin 0.8s linear infinite',
          }}
        />
      )}
      {pending ? 'Writing alert (Sonnet)…' : 'Write alert'}
      <style>{`
        @keyframes wa-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  )
}
