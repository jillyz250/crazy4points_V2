interface Props {
  name: string
  label: string
  defaultChecked?: boolean
}

export default function CheckboxField({ name, label, defaultChecked }: Props) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontFamily: 'var(--font-body)',
        fontSize: '0.9rem',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          style={{ accentColor: 'var(--color-primary)' }}
        />
        {label}
      </label>
    </div>
  )
}
