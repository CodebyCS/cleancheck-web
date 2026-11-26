import axios from 'axios'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../../api'
import { Button } from '../Button'
import { Field } from '../Field'
import { Message } from '../Message'
import { Modal } from '../Modal'
import { alertTypeLabels, resolveTaskAlert } from '../../services/taskAlerts'
import type { TaskAlert } from '../../services/taskAlerts'

type ResolveAlertModalProps = {
  alert: TaskAlert
  onClose: () => void
  onResolved: (alert: TaskAlert) => void
  onSessionExpired: () => void
}

const MIN_REASON = 3
const MAX_REASON = 255

export function ResolveAlertModal({ alert, onClose, onResolved, onSessionExpired }: ResolveAlertModalProps) {
  const [reason, setReason] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = reason.trim()
    if (trimmed.length < MIN_REASON) {
      setFieldError('Indique o motivo (pelo menos 3 caracteres).')
      return
    }
    if (trimmed.length > MAX_REASON) {
      setFieldError('O motivo não pode ter mais de 255 caracteres.')
      return
    }

    setFieldError('')
    setError('')
    setSaving(true)

    try {
      onResolved(await resolveTaskAlert(alert.id, trimmed))
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        onSessionExpired()
        return
      }
      // 409: someone else resolved it, or it resolved itself. The API message says so.
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Resolver alerta"
      subtitle={`${alertTypeLabels[alert.type]} · ${alert.property?.name ?? 'Apartamento desconhecido'}`}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" disabled={saving} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="resolve-alert-form" loading={saving} loadingText="A resolver...">
            Resolver alerta
          </Button>
        </>
      }
    >
      <form id="resolve-alert-form" noValidate onSubmit={(event) => void handleSubmit(event)}>
        <p className="alerts-modal-text">
          O alerta passa para o histórico e não volta a abrir para esta tarefa. Indique o que foi feito.
        </p>
        <Field
          label="Motivo"
          name="reason"
          value={reason}
          onChange={(_, value) => setReason(value)}
          error={fieldError}
          required
          multiline
          rows={3}
          disabled={saving}
        />
        {error && <Message type="error">{error}</Message>}
      </form>
    </Modal>
  )
}