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
  // Renders a textarea for long free text, e.g. access instructions.
  multiline?: boolean
  rows?: number
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
  multiline = false,
  rows = 4,
}: FieldProps) {
  const errorId = `${name}-error`
  const describedBy = error ? errorId : undefined

  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          value={value}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(name, event.target.value)}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(name, event.target.value)}
        />
      )}
      {error && (
        <span id={errorId} className="field-error">
          {error}
        </span>
      )}
    </div>
  )
}
