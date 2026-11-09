import { useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { Message } from '../components/Message'
import { Modal } from '../components/Modal'
import { SelectField } from '../components/SelectField'
import type { SelectOption } from '../components/SelectField'
import { createProperty, updateProperty } from '../services/properties'
import type { Property, PropertyInput } from '../services/properties'
import { fieldErrors } from '../services/validation'
import type { FieldErrors } from '../services/validation'
import { taskWindow } from '../utils/taskWindow'
import { DEFAULT_TIMEZONE, timezoneOptionsWith } from '../utils/timezones'

type PropertyFormProps = {
  property: Property | null
  providerOptions: SelectOption[]
  onClose: () => void
  onSaved: (property: Property) => void
}

type FormState = {
  name: string
  address: string
  postal_code: string
  city: string
  access_instructions: string
  responsible_service_provider_id: string
  base_cleaning_amount: string
  default_check_in_time: string
  default_check_out_time: string
  timezone: string
}

function toFormState(property: Property | null): FormState {
  return {
    name: property?.name ?? '',
    address: property?.address ?? '',
    postal_code: property?.postal_code ?? '',
    city: property?.city ?? '',
    access_instructions: property?.access_instructions ?? '',
    responsible_service_provider_id: property?.responsible_service_provider_id?.toString() ?? '',
    base_cleaning_amount: property?.base_cleaning_amount ?? '',
    default_check_in_time: property?.default_check_in_time ?? '',
    default_check_out_time: property?.default_check_out_time ?? '',
    timezone: property?.timezone ?? DEFAULT_TIMEZONE,
  }
}

// Empty optional fields are sent as null so the API clears them.
function toInput(form: FormState): PropertyInput {
  return {
    name: form.name,
    address: form.address,
    postal_code: form.postal_code,
    city: form.city,
    access_instructions: form.access_instructions,
    responsible_service_provider_id: form.responsible_service_provider_id
      ? Number(form.responsible_service_provider_id)
      : null,
    base_cleaning_amount: form.base_cleaning_amount === '' ? null : Number(form.base_cleaning_amount),
    default_check_in_time: form.default_check_in_time || null,
    default_check_out_time: form.default_check_out_time || null,
    timezone: form.timezone,
  }
}

export function PropertyForm({ property, providerOptions, onClose, onSaved }: PropertyFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(property))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const editing = property !== null
  const cleaningWindow = taskWindow(form.default_check_out_time || null, form.default_check_in_time || null)

  function handleChange(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setError('')

    try {
      const input = toInput(form)
      const saved = editing ? await updateProperty(property.id, input) : await createProperty(input)
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
      title={editing ? 'Editar imóvel' : 'Novo imóvel'}
      subtitle={editing ? property.name : undefined}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="property-form" loading={saving}>
            {editing ? 'Guardar alterações' : 'Criar imóvel'}
          </Button>
        </>
      }
    >
      <form id="property-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="span-2">
            <Field label="Nome" name="name" value={form.name} onChange={handleChange} error={errors.name} required disabled={saving} />
          </div>
          <div className="span-2">
            <Field label="Morada" name="address" value={form.address} onChange={handleChange} error={errors.address} required disabled={saving} />
          </div>
          <Field label="Código postal" name="postal_code" value={form.postal_code} onChange={handleChange} error={errors.postal_code} required disabled={saving} />
          <Field label="Localidade" name="city" value={form.city} onChange={handleChange} error={errors.city} required disabled={saving} />
          <div className="span-2">
            <Field label="Instruções de acesso" name="access_instructions" value={form.access_instructions} onChange={handleChange} error={errors.access_instructions} disabled={saving} />
          </div>
          <div className="span-2">
            <SelectField
              label="Prestador responsável"
              name="responsible_service_provider_id"
              value={form.responsible_service_provider_id}
              options={providerOptions}
              placeholder="Sem responsável"
              onChange={handleChange}
              error={errors.responsible_service_provider_id}
              disabled={saving}
            />
          </div>
          <Field label="Valor base (€)" name="base_cleaning_amount" type="number" value={form.base_cleaning_amount} onChange={handleChange} error={errors.base_cleaning_amount} disabled={saving} />
          <div />
        </div>

        <fieldset className="schedule-fieldset">
          <legend>Horários dos hóspedes</legend>
          <p className="form-hint">
            Horas a que o hóspede sai e o próximo entra, iguais às do anúncio no Airbnb/Booking (o iCal só traz as datas).
            Valem para todas as reservas deste imóvel; para mudar só uma reserva, use o ajuste local da reserva.
          </p>
          <div className="form-grid">
            <Field label="Hora de saída" name="default_check_out_time" type="time" value={form.default_check_out_time} onChange={handleChange} error={errors.default_check_out_time} disabled={saving} />
            <Field label="Hora de entrada" name="default_check_in_time" type="time" value={form.default_check_in_time} onChange={handleChange} error={errors.default_check_in_time} disabled={saving} />
            <div className="span-2">
              <SelectField
                label="Fuso horário"
                name="timezone"
                value={form.timezone}
                options={timezoneOptionsWith(form.timezone)}
                onChange={handleChange}
                error={errors.timezone}
                required
                disabled={saving}
              />
            </div>
          </div>
          <p className="form-hint" aria-live="polite">
            Janela de limpeza: <strong>{cleaningWindow.start} → {cleaningWindow.end}</strong> (hora local do imóvel).{' '}
            {form.default_check_out_time || form.default_check_in_time
              ? 'Começa 30 min depois da saída e acaba 30 min antes da entrada.'
              : 'Sem horas definidas, a limpeza é das 11:30 às 14:30.'}
          </p>
        </fieldset>
        {error && <Message type="error">{error}</Message>}
      </form>
    </Modal>
  )
}
