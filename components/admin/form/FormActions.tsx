interface Props {
  submitLabel: string
  submittingLabel?: string
  submitting?: boolean
  cancelHref?: string
  cancelLabel?: string
}

export default function FormActions({
  submitLabel,
  submittingLabel = 'Saving…',
  submitting = false,
  cancelHref,
  cancelLabel = 'Cancel',
}: Props) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <button
        type="submit"
        disabled={submitting}
        className="rg-btn-primary"
        style={{ opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
      {cancelHref && (
        <a
          href={cancelHref}
          style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textDecoration: 'underline' }}
        >
          {cancelLabel}
        </a>
      )}
    </div>
  )
}
