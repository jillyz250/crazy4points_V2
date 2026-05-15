'use client'

import { useFormStatus } from 'react-dom'

/**
 * Generic submit button with pending state. Used anywhere a server action
 * takes more than ~1 second so the operator has clear visible feedback
 * instead of wondering whether the click registered.
 *
 * Pending state shows a spinner emoji + the pendingLabel.
 */
export default function ExtractionActionButton({
  variant,
  label,
  pendingLabel,
  size = 'md',
}: {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost'
  label: string
  pendingLabel: string
  /** 'sm' = compact (0.75rem text, 0.25rem padding); 'md' = default */
  size?: 'sm' | 'md'
}) {
  const { pending } = useFormStatus()

  let baseClass: string
  switch (variant) {
    case 'primary':
      baseClass = 'rg-btn-primary'
      break
    case 'secondary':
      baseClass = 'rg-btn-secondary'
      break
    case 'ghost':
      baseClass =
        'rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] px-3 py-2 font-ui text-xs uppercase tracking-wide text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
      break
    case 'danger':
      baseClass =
        'rounded-[var(--radius-ui)] border border-red-200 px-3 py-2 font-ui text-xs uppercase tracking-wide text-red-600 hover:bg-red-50'
      break
  }

  const sizeClass = size === 'sm' ? 'text-xs' : 'text-xs'
  const style: React.CSSProperties =
    size === 'sm' ? { fontSize: '0.75rem', padding: '0.25rem 0.5rem' } : {}

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${baseClass} ${sizeClass} disabled:cursor-not-allowed disabled:opacity-60`}
      style={style}
    >
      {pending ? `⏳ ${pendingLabel}` : label}
    </button>
  )
}
