import { fieldStyle, labelStyle } from './styles'

interface Props {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}

export default function Field({ label, htmlFor, required, hint, children }: Props) {
  return (
    <div style={fieldStyle}>
      <label htmlFor={htmlFor} style={labelStyle}>
        {label}{required ? ' *' : ''}
      </label>
      {hint && (
        <p style={{
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          marginTop: '-0.125rem',
          marginBottom: '0.5rem',
          fontFamily: 'var(--font-body)',
        }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  )
}
