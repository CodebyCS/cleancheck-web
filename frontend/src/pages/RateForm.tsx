import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { Message } from '../components/Message'
import { Modal } from '../components/Modal'
import { SelectField } from '../components/SelectField'
import type { SelectOption } from '../components/SelectField'
import { createRate, rateTaskTypes } from '../services/rates'
import type { Rate, RateTaskType } from '../services/rates'
import { fieldErrors } from '../services/validation'
import type { FieldErrors } from '../services/validation'
import { focusFirstInvalid } from '../utils/focus'

type RateFormProps = {
  propertyOptions: SelectOption[]
  today: string
  onClose: () => void
  onSaved: (rate: Rate) => void
}

type FormState = {
  property_id: string
  task_type: RateTaskType
  amount: string
  currency: string
  valid_from: string
}

export function RateForm({ propertyOptions, today, onClose, onSaved }: RateFormProps) {
  const [form, setForm] = useState<FormState>({
    property_id: '',
    task_type: 'checkout_cleaning',
    amount: '',
    currency: 'EUR',
    valid_from: today,
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // After the API rejects the data, take the user to the first wrong field.
  useEffect(() => {
    if (Object.keys(errors).length > 0) focusFirstInvalid('rate-form')
  }, [errors])

  function handleChange(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: name === 'currency' ? value.toUpperCase() : value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setError('')

    try {
      const saved = await createRate({
        property_id: form.property_id ? Number(form.property_id) : null,
        task_type: form.task_type,
        amount: Number(form.amount.replace(',', '.')),
        currency: form.currency.trim(),
        valid_from: form.valid_from,
      })
      onSaved(saved)
    } catch (requestError) {
      const fields = fieldErrors(requestError)
      setErrors(fields)
      setError(Object.keys(fields).length > 0 ? 'Corrija os campos assinalados.' : errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Nova tarifa"
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="rate-form" loading={saving}>
            Criar tarifa
          </Button>
        </>
      }
    >
      <form id="rate-form" onSubmit={handleSubmit} noValidate>
        <p className="form-hint">
          As tarifas não se editam. Para mudar um valor, crie uma tarifa nova com a data a partir da qual se aplica;
          as anteriores ficam no histórico e os serviços já lançados não mudam.
        </p>
        <div className="form-grid">
          <div className="span-2">
            <SelectField
              label="Aplica-se a"
              name="property_id"
              value={form.property_id}
              options={propertyOptions}
              placeholder="Todos os imóveis (tarifa geral)"
              onChange={handleChange}
              error={errors.property_id}
              disabled={saving}
            />
          </div>
          <div className="span-2">
            <SelectField
              label="Tipo de tarefa"
              name="task_type"
              value={form.task_type}
              options={rateTaskTypes}
              onChange={handleChange}
              error={errors.task_type}
              disabled={saving}
            />
          </div>
          <Field
            label="Valor"
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleChange}
            error={errors.amount}
            required
            disabled={saving}
          />
          <Field
            label="Moeda"
            name="currency"
            value={form.currency}
            onChange={handleChange}
            error={errors.currency}
            disabled={saving}
          />
          <div className="span-2">
            <Field
              label="Aplica-se a partir de"
              name="valid_from"
              type="date"
              value={form.valid_from}
              onChange={handleChange}
              error={errors.valid_from}
              required
              disabled={saving}
            />
          </div>
        </div>
        <p className="form-hint">
          Ordem usada em cada serviço: valor acordado na tarefa, depois a tarifa do imóvel, depois a tarifa geral,
          depois o valor base do imóvel.
        </p>
        {error && <Message type="error">{error}</Message>}
      </form>
    </Modal>
  )
}
