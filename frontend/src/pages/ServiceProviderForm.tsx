import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { Message } from '../components/Message'
import { Modal } from '../components/Modal'
import { PhotoField } from '../components/PhotoField'
import {
  createServiceProvider,
  updateServiceProvider,
  uploadServiceProviderPhoto,
} from '../services/serviceProviders'
import type { ServiceProvider, ServiceProviderInput } from '../services/serviceProviders'
import { fieldErrors } from '../services/validation'
import type { FieldErrors } from '../services/validation'
import { focusFirstInvalid } from '../utils/focus'

type ServiceProviderFormProps = {
  provider: ServiceProvider | null
  onClose: () => void
  onSaved: (provider: ServiceProvider, photoError?: string) => void
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function toFormState(provider: ServiceProvider | null): Required<ServiceProviderInput> {
  return {
    name: provider?.name ?? '',
    email: provider?.email ?? '',
    password: '',
    phone: provider?.phone ?? '',
    address: provider?.address ?? '',
    postal_code: provider?.postal_code ?? '',
    city: provider?.city ?? '',
  }
}

// Mirrors the API rules so the user gets feedback before uploading.
function validatePhoto(file: File): string | null {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return 'A fotografia tem de ser JPG, PNG ou WEBP.'
  if (file.size > MAX_PHOTO_BYTES) return 'A fotografia não pode ter mais de 2 MB.'
  return null
}

function photoErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.status === 422) {
    return fieldErrors(error).photo ?? 'A fotografia não é válida.'
  }
  return errorMessage(error)
}

export function ServiceProviderForm({ provider, onClose, onSaved }: ServiceProviderFormProps) {
  const [form, setForm] = useState(() => toFormState(provider))
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // After the API rejects the data, take the user to the first wrong field.
  useEffect(() => {
    if (Object.keys(errors).length > 0) focusFirstInvalid('provider-form')
  }, [errors])

  const editing = provider !== null

  function handleChange(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handlePhotoChange(file: File | null) {
    const problem = file ? validatePhoto(file) : null
    setPhotoError(problem ?? '')
    setPhoto(problem ? null : file)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Do not save while the chosen photo is invalid, otherwise it would be silently dropped.
    if (photoError) return

    setSaving(true)
    setErrors({})
    setError('')

    let saved: ServiceProvider

    try {
      saved = editing ? await updateServiceProvider(provider.id, form) : await createServiceProvider(form)
    } catch (requestError) {
      const fields = fieldErrors(requestError)
      setErrors(fields)
      setError(Object.keys(fields).length > 0 ? 'Corrija os campos assinalados.' : errorMessage(requestError))
      setSaving(false)
      return
    }

    // The data is already saved; a failed photo upload is reported separately.
    if (photo) {
      try {
        saved = await uploadServiceProviderPhoto(saved.id, photo)
      } catch (uploadError) {
        setSaving(false)
        onSaved(saved, photoErrorMessage(uploadError))
        return
      }
    }

    setSaving(false)
    onSaved(saved)
  }

  return (
    <Modal
      title={editing ? 'Editar prestador' : 'Novo prestador'}
      subtitle={editing ? provider.email : undefined}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="provider-form" loading={saving} disabled={photoError !== ''}>
            {editing ? 'Guardar alterações' : 'Criar prestador'}
          </Button>
        </>
      }
    >
      <form id="provider-form" onSubmit={handleSubmit} noValidate>
        <PhotoField
          name={form.name || 'Prestador'}
          currentUrl={provider?.photo_url ?? null}
          file={photo}
          onChange={handlePhotoChange}
          error={photoError}
          disabled={saving}
        />
        <div className="form-grid">
          <div className="span-2">
            <Field label="Nome" name="name" value={form.name} onChange={handleChange} error={errors.name} required disabled={saving} />
          </div>
          <Field label="E-mail" name="email" type="email" autoComplete="off" value={form.email} onChange={handleChange} error={errors.email} required disabled={saving} />
          <Field label="Telefone" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} required disabled={saving} />
          <div className="span-2">
            <Field
              label={editing ? 'Nova password (deixe em branco para manter)' : 'Password inicial'}
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              required={!editing}
              disabled={saving}
            />
          </div>
          <div className="span-2">
            <Field label="Morada" name="address" value={form.address} onChange={handleChange} error={errors.address} disabled={saving} />
          </div>
          <Field label="Código postal" name="postal_code" value={form.postal_code} onChange={handleChange} error={errors.postal_code} disabled={saving} />
          <Field label="Localidade" name="city" value={form.city} onChange={handleChange} error={errors.city} disabled={saving} />
        </div>
        {error && <Message type="error">{error}</Message>}
      </form>
    </Modal>
  )
}
