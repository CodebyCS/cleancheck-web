import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { Message } from '../components/Message'
import { createServiceProvider, listServiceProviders } from '../services/serviceProviders'
import type { ServiceProvider, ServiceProviderInput } from '../services/serviceProviders'
import { fieldErrors } from '../services/validation'
import type { FieldErrors } from '../services/validation'

const emptyForm: ServiceProviderInput = {
  name: '',
  email: '',
  password: '',
  phone: '',
}

type Feedback = { type: 'error' | 'success'; text: string } | null

export function ServiceProvidersPage() {
  const [items, setItems] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState<ServiceProviderInput>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    let active = true

    listServiceProviders()
      .then((providers) => {
        if (active) setItems(providers)
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
      await createServiceProvider(form)
      setForm(emptyForm)
      setFeedback({
        type: 'success',
        text: 'Prestador criado. Já pode entrar com este e-mail na web e no mobile.',
      })
      setItems(await listServiceProviders())
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
      <h2>Prestadores</h2>

      <form onSubmit={handleSubmit} noValidate>
        <h3>Novo prestador</h3>
        <Field label="Nome" name="name" value={form.name} onChange={handleChange} error={errors.name} required disabled={saving} />
        <Field label="E-mail" name="email" type="email" autoComplete="off" value={form.email} onChange={handleChange} error={errors.email} required disabled={saving} />
        <Field label="Password inicial" name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} error={errors.password} required disabled={saving} />
        <Field label="Telefone" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} required disabled={saving} />
        {feedback && <Message type={feedback.type}>{feedback.text}</Message>}
        <Button type="submit" loading={saving}>Criar prestador</Button>
      </form>

      <h3>Lista</h3>
      {loading ? (
        <Message type="info">A carregar prestadores...</Message>
      ) : loadError ? (
        <Message type="error">{loadError}</Message>
      ) : items.length === 0 ? (
        <Message type="info">Ainda não há prestadores registados.</Message>
      ) : (
        <ul>
          {items.map((provider) => (
            <li key={provider.id}>
              <strong>{provider.name}</strong> — {provider.email} — {provider.phone}
              {!provider.is_active && ' (inativo)'}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
