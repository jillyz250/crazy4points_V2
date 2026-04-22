interface Props {
  error: string | null
}

export default function FormError({ error }: Props) {
  if (!error) return null
  return (
    <p
      role="alert"
      style={{
        color: '#c0392b',
        fontSize: '0.875rem',
        marginBottom: '1rem',
        fontFamily: 'var(--font-body)',
      }}
    >
      {error}
    </p>
  )
}
