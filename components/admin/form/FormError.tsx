interface Props {
  error: string | null
}

export default function FormError({ error }: Props) {
  if (!error) return null
  return (
    <div
      role="alert"
      style={{
        padding: '0.625rem 0.75rem',
        marginBottom: '1rem',
        borderRadius: 'var(--admin-radius)',
        border: '1px solid var(--admin-danger)',
        background: 'var(--admin-danger-soft)',
        color: 'var(--admin-danger)',
        fontSize: '0.8125rem',
      }}
    >
      {error}
    </div>
  )
}
