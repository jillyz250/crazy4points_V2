import Field from './Field'
import { inputStyle } from './styles'

interface Props {
  name: string
  label: string
  rows?: number
  required?: boolean
  placeholder?: string
  defaultValue?: string
  hint?: string
}

export default function TextAreaField({ name, label, rows = 3, required, placeholder, defaultValue, hint }: Props) {
  return (
    <Field label={label} htmlFor={name} required={required} hint={hint}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
    </Field>
  )
}
