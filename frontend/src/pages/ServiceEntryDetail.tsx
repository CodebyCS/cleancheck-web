import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { Message } from '../components/Message'
import { Modal } from '../components/Modal'
import { rateTaskTypeLabel } from '../services/rates'
import { amountSourceLabels, createAdjustment, getServiceEntry } from '../services/serviceEntries'
import type { ServiceEntry } from '../services/serviceEntries'
import { fieldErrors } from '../services/validation'
import type { FieldErrors } from '../services/validation'
import { focusFirstInvalid } from '../utils/focus'
import { formatAmount, formatDate, formatDateTime, formatSigned } from './serviceEntryFormat'

type ServiceEntryDetailProps = {
  entryId: number
  onClose: () => void
  // Called after an adjustment is saved, so the list and totals are reloaded.
  onChanged: () => void
}

type FormState = { amount: string; reason: string }

const emptyForm: FormState = { amount: '', reason: '' }

export function ServiceEntryDetail({ entryId, onClose, onChanged }: ServiceEntryDetailProps) {
  const [entry, setEntry] = useState<ServiceEntry | null>(null)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    getServiceEntry(entryId)
      .then((nextEntry) => {
        if (!active) return
        setEntry(nextEntry)
        setLoadError('')
      })
      .catch((requestError: unknown) => {
        if (active) setLoadError(errorMessage(requestError))
      })

    return () => {
      active = false
    }
  }, [entryId, reloadKey])

  // After the API rejects the data, take the user to the first wrong field.
  useEffect(() => {
    if (Object.keys(errors).length > 0) focusFirstInvalid('adjustment-form')
  }, [errors])

  function handleChange(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!entry) return

    setSaving(true)
    setErrors({})
    setError('')
    setSuccess('')

    try {
      const result = await createAdjustment(entry.id, {
        amount: form.amount.trim() === '' ? null : Number(form.amount.replace(',', '.')),
        reason: form.reason.trim(),
      })
      setForm(emptyForm)
      setSuccess(`Ajuste registado. Valor final: ${formatAmount(result.finalAmount, entry.currency)}.`)
      setReloadKey((key) => key + 1)
      onChanged()
    } catch (requestError) {
      const fields = fieldErrors(requestError)
      setErrors(fields)
      setError(Object.keys(fields).length > 0 ? 'Corrija os campos assinalados.' : errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const adjustments = entry?.adjustments ?? []

  return (
    <Modal
      title={`Lançamento #${entryId}`}
      subtitle={entry ? `${formatDate(entry.service_date)} · ${entry.property_name ?? `Imóvel #${entry.property_id}`}` : undefined}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Fechar
          </Button>
          <Button type="submit" form="adjustment-form" loading={saving} disabled={!entry}>
            Registar ajuste
          </Button>
        </>
      }
    >
      {loadError ? (
        <Message type="error">{loadError}</Message>
      ) : !entry ? (
        <Message type="info">A carregar lançamento...</Message>
      ) : (
        <>
          <dl className="detail-rows">
            <div className="detail-row">
              <dt>Prestador</dt>
              <dd>{entry.service_provider_name ?? `Prestador #${entry.service_provider_id}`}</dd>
            </div>
            <div className="detail-row">
              <dt>Tarefa</dt>
              <dd>#{entry.task_id} · {rateTaskTypeLabel(entry.task_type)}</dd>
            </div>
            <div className="detail-row">
              <dt>Origem do valor</dt>
              <dd>{amountSourceLabels[entry.amount_source] ?? entry.amount_source}</dd>
            </div>
          </dl>

          <div className="entry-amounts">
            <div>
              <span>Original</span>
              <strong>{formatAmount(entry.amount, entry.currency)}</strong>
            </div>
            <div>
              <span>Ajustes</span>
              <strong>{formatSigned(entry.adjustments_total, entry.currency)}</strong>
            </div>
            <div className="entry-amount-final">
              <span>Final</span>
              <strong>{formatAmount(entry.final_amount, entry.currency)}</strong>
            </div>
          </div>

          <h3 className="entry-section-title">Histórico de ajustes</h3>
          {adjustments.length === 0 ? (
            <p className="form-hint">Este lançamento ainda não tem ajustes.</p>
          ) : (
            <ol className="entry-adjustments">
              {adjustments.map((adjustment) => (
                <li key={adjustment.id}>
                  <div className="entry-adjustment-head">
                    <strong className={Number(adjustment.amount) < 0 ? 'entry-adjustment-down' : 'entry-adjustment-up'}>
                      {formatSigned(adjustment.amount, entry.currency)}
                    </strong>
                    <span>
                      {adjustment.created_by?.name ?? 'Utilizador removido'} · {formatDateTime(adjustment.created_at)}
                    </span>
                  </div>
                  <p>{adjustment.reason}</p>
                </li>
              ))}
            </ol>
          )}

          <h3 className="entry-section-title">Novo ajuste</h3>
          <form id="adjustment-form" className="entry-adjustment-form" onSubmit={handleSubmit} noValidate>
            <p className="form-hint">
              Use um valor negativo para reduzir e positivo para aumentar. O lançamento original não muda e os ajustes
              não se apagam; um ajuste errado corrige-se com outro.
            </p>
            <div className="form-grid">
              <Field
                label="Valor do ajuste"
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                error={errors.amount}
                required
                disabled={saving}
              />
              <div className="span-2">
                <Field
                  label="Motivo"
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  error={errors.reason}
                  required
                  multiline
                  rows={3}
                  disabled={saving}
                />
              </div>
            </div>
            {error && <Message type="error">{error}</Message>}
            {success && <Message type="success">{success}</Message>}
          </form>
        </>
      )}
    </Modal>
  )
}
