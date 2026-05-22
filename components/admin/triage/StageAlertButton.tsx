/**
 * StageAlertButton — server-action form that creates a skeleton alert
 * (no Sonnet writer call) and redirects to /admin/alerts/[id]/edit so
 * the editor can paste verified T&Cs before drafting.
 *
 * Cheaper + better than Write alert when the editor already has the
 * official T&Cs in hand — the regenerate call from the edit page gets
 * those T&Cs as extra_context on the first writer pass.
 */
'use client'

import { useFormStatus } from 'react-dom'
import { stageAlertFromCandidate } from '@/app/admin/(protected)/triage/actions'

export function StageAlertButton({ intelId }: { intelId: string }) {
  return (
    <form action={stageAlertFromCandidate}>
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
      title="Create a skeleton alert without running the writer. Use this when you have the T&Cs ready to paste before drafting."
      style={{
        padding: '0.5rem 1rem',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8125rem',
        fontWeight: 600,
        background: pending ? 'var(--admin-text-muted)' : 'transparent',
        color: pending ? '#fff' : 'var(--admin-accent)',
        border: `1px solid var(--admin-accent)`,
        borderRadius: 'var(--admin-radius)',
        cursor: pending ? 'wait' : 'pointer',
      }}
    >
      {pending ? 'Staging…' : 'Stage for editing'}
    </button>
  )
}
