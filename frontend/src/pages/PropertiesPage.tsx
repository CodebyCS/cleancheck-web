import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { Message } from '../components/Message'
import { createProperty, listProperties } from '../services/properties'
import type { Property, PropertyInput } from '../services/properties'
import { fieldErrors } from '../services/validation'
import type { FieldErrors } from '../services/validation'

const emptyForm: PropertyInput = {
  name: '',
  address: '',
  postal_code: '',
  city: '',
  access_instructions: '',
}

type Feedback = { type: 'error' | 'success'; text: string } | null

export function PropertiesPage() {
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState<PropertyInput>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    let active = true

    listProperties()
      .then((properties) => {
        if (active) setItems(properties)
      })
      .catch((error: unknown) => {
        if (active) setLoadError(errorMessage(error))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function handleChange(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setFeedback(null)

    try {
      await createProperty(form)
      setForm(emptyForm)
      setFeedback({ type: 'success', text: 'Imóvel criado.' })
      setItems(await listProperties())
      setLoadError('')
    } catch (error) {
      const fields = fieldErrors(error)
      setErrors(fields)
      setFeedback({
        type: 'error',
        text: Object.keys(fields).length > 0
          ? 'Corrija os campos assinalados.'
          : errorMessage(error),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <h2>Imóveis</h2>

      <form onSubmit={handleSubmit} noValidate>
        <h3>Novo imóvel</h3>
        <Field label="Nome" name="name" value={form.name} onChange={handleChange} error={errors.name} required disabled={saving} />
        <Field label="Morada" name="address" value={form.address} onChange={handleChange} error={errors.address} required disabled={saving} />
        <Field label="Código postal" name="postal_code" value={form.postal_code} onChange={handleChange} error={errors.postal_code} required disabled={saving} />
        <Field label="Localidade" name="city" value={form.city} onChange={handleChange} error={errors.city} required disabled={saving} />
        <Field label="Instruções de acesso" name="access_instructions" value={form.access_instructions} onChange={handleChange} error={errors.access_instructions} disabled={saving} />
        {feedback && <Message type={feedback.type}>{feedback.text}</Message>}
        <Button type="submit" loading={saving}>Criar imóvel</Button>
      </form>

      <h3>Lista</h3>
      {loading ? (
        <Message type="info">A carregar imóveis...</Message>
      ) : loadError ? (
        <Message type="error">{loadError}</Message>
      ) : items.length === 0 ? (
        <Message type="info">Ainda não há imóveis registados.</Message>
      ) : (
        <ul>
          {items.map((property) => (
            <li key={property.id}>
              <strong>{property.name}</strong> — {property.address}, {property.postal_code} {property.city}
              {!property.is_active && ' (inativo)'}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
