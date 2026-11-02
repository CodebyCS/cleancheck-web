import './components.css'

export type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps = {
  label: string
  name: string
  value: string
  options: SelectOption[]
  onChange: (name: string, value: string) => void
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

export function SelectField({
  label,
  name,
  value,
  options,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
}: SelectFieldProps) {
  const errorId = `${name}-error`

  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(name, event.target.value)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={errorId} className="field-error">
          {error}
        </span>
      )}
    </div>
  )
}
