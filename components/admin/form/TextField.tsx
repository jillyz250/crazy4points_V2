import Field from './Field'
import { inputStyle } from './styles'

interface Props {
  name: string
  label: string
  type?: 'text' | 'url' | 'email' | 'date' | 'number'
  required?: boolean
  placeholder?: string
  defaultValue?: string | number
  hint?: string
}

export default function TextField({ name, label, type = 'text', required, placeholder, defaultValue, hint }: Props) {
  return (
    <Field label={label} htmlFor={name} required={required} hint={hint}>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        style={inputStyle}
      />
    </Field>
  )
}
