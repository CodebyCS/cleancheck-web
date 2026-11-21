import { useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../../api'
import { Button } from '../Button'
import { Field } from '../Field'
import { Message } from '../Message'
import { Modal } from '../Modal'
import { createBookingSource, maskSourceUrl, updateBookingSource } from '../../services/bookingSources'
import type { BookingSource } from '../../services/bookingSources'
import { fieldErrors } from '../../services/validation'

type SourceFormProps = {
  propertyId: number
  source: BookingSource | null
  onClose: () => void
  onSaved: (saved: BookingSource) => void
}

export function SourceForm({ propertyId, source, onClose, onSaved }: SourceFormProps) {
  const editing = source !== null
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setUrlError('')
    setError('')

    try {
      const value = url.trim()
      const saved = editing
        ? await updateBookingSource(source.id, { url: value })
        : await createBookingSource(propertyId, value)
      onSaved(saved)
    } catch (requestError) {
      const fields = fieldErrors(requestError)
      setUrlError(fields.url ?? '')
      setError(fields.source ?? (fields.url ? '' : errorMessage(requestError)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Trocar link do calendário' : 'Nova fonte iCal'}
      subtitle={editing && source.url ? maskSourceUrl(source.url) : undefined}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="source-form" loading={saving}>
            {editing ? 'Guardar link' : 'Registar fonte'}
          </Button>
        </>
      }
    >
      <form id="source-form" onSubmit={handleSubmit} noValidate>
        {error && <Message type="error">{error}</Message>}
        <Field
          label="Link de exportação do Airbnb"
          name="url"
          type="url"
          value={url}
          onChange={(_, value) => setUrl(value)}
          error={urlError}
          required
          disabled={saving}
          autoComplete="off"
        />
        <p className="form-hint">
          {editing
            ? 'Use só para um link novo do mesmo calendário. Para outro calendário, desative esta fonte e registe uma nova.'
            : 'No Airbnb: Calendário → Disponibilidade → Sincronizar calendários → Exportar calendário.'}
        </p>
      </form>
    </Modal>
  )
}