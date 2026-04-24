interface Props {
  name: string
  label: string
  defaultChecked?: boolean
}

export default function CheckboxField({ name, label, defaultChecked }: Props) {
  return (
    <div style={{ marginBottom: '1.125rem' }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        color: 'var(--admin-text)',
        cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          style={{ accentColor: 'var(--admin-accent)' }}
        />
        {label}
      </label>
    </div>
  )
}
