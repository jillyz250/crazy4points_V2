import Field from './Field'
import { inputStyle } from './styles'

interface Option {
  value: string
  label: string
}

interface Props {
  name: string
  label: string
  options: readonly Option[]
  required?: boolean
  defaultValue?: string
  hint?: string
  includeEmpty?: string
}

export default function SelectField({ name, label, options, required, defaultValue, hint, includeEmpty }: Props) {
  return (
    <Field label={label} htmlFor={name} required={required} hint={hint}>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        style={inputStyle}
      >
        {includeEmpty !== undefined && <option value="">{includeEmpty}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </Field>
  )
}
