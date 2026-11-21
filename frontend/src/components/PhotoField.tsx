import { useEffect, useId, useMemo, useState } from 'react'
import { initialsOf } from '../utils/initials'
import { Button } from './Button'
import './components.css'

type PhotoFieldProps = {
  name: string
  currentUrl: string | null
  file: File | null
  onChange: (file: File | null) => void
  error?: string
  disabled?: boolean
}

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp'

export function PhotoField({ name, currentUrl, file, onChange, error, disabled = false }: PhotoFieldProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null)

  // Preview the chosen file before it is sent.
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  // Release the temporary preview URL when the file changes or the field unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const imageUrl = previewUrl ?? currentUrl
  const showImage = imageUrl !== null && imageUrl !== brokenUrl

  return (
    <div className="photo-field">
      {showImage ? (
        <img
          className="avatar avatar-large"
          src={imageUrl}
          alt={`Fotografia de ${name}`}
          onError={() => setBrokenUrl(imageUrl)}
        />
      ) : (
        <div className="avatar avatar-large" aria-label="Sem fotografia">
          {initialsOf(name)}
        </div>
      )}

      <div className="photo-field-controls">
        <label htmlFor={inputId} className="btn btn-secondary photo-field-button">
          {imageUrl ? 'Alterar fotografia' : 'Escolher fotografia'}
        </label>
        <input
          id={inputId}
          className="visually-hidden"
          type="file"
          accept={ACCEPTED_TYPES}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            onChange(event.target.files?.[0] ?? null)
            event.target.value = ''
          }}
        />
        <span className="photo-field-hint">
          {file ? file.name : 'JPG, PNG ou WEBP, até 2 MB.'}
        </span>
        {(file || error) && (
          // Lets the user drop the chosen (or rejected) file and keep the current photo.
          <Button variant="secondary" className="photo-field-clear" onClick={() => onChange(null)} disabled={disabled}>
            Remover escolha
          </Button>
        )}
        {error && (
          <span id={errorId} className="field-error">
            {error}
          </span>
        )}
      </div>
    </div>
  )
}
