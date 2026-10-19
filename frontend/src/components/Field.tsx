import './components.css'

type FieldProps = {
  label: string
  name: string
  value: string
  onChange: (name: string, value: string) => void
  error?: string
  type?: string
  required?: boolean
  disabled?: boolean
  autoComplete?: string
}

export function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  required = false,
  disabled = false,
  autoComplete,
}: FieldProps) {
  const errorId = `${name}-error`

  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {error && (
        <span id={errorId} className="field-error">
          {error}
        </span>
      )}
    </div>
  )
}
