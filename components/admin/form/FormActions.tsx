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
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
      <button
        type="submit"
        disabled={submitting}
        className="admin-btn admin-btn-primary"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
      {cancelHref && (
        <a href={cancelHref} className="admin-btn admin-btn-ghost">
          {cancelLabel}
        </a>
      )}
    </div>
  )
}
