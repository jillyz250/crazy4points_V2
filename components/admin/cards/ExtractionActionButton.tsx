'use client'

import { useFormStatus } from 'react-dom'

/**
 * Generic submit button with pending state. Used for Re-save and Reject
 * actions on the extraction review screen so the editor has visible
 * feedback while the server action runs.
 */
export default function ExtractionActionButton({
  variant,
  label,
  pendingLabel,
}: {
  variant: 'secondary' | 'danger'
  label: string
  pendingLabel: string
}) {
  const { pending } = useFormStatus()

  const baseClass =
    variant === 'secondary'
      ? 'rg-btn-secondary'
      : 'rounded-[var(--radius-ui)] border border-red-200 px-3 py-2 font-ui text-xs uppercase tracking-wide text-red-600 hover:bg-red-50'

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${baseClass} text-xs disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}
