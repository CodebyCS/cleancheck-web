import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { Message } from '../components/Message'
import { Modal } from '../components/Modal'
import { saveChecklist } from '../services/checklists'
import type { Checklist } from '../services/checklists'
import { rateTaskTypeLabel } from '../services/rates'
import { fieldErrors } from '../services/validation'
import type { FieldErrors } from '../services/validation'
import { focusFirstInvalid } from '../utils/focus'

type ChecklistFormProps = {
  taskType: string
  // Checklist in force, or null when the type has none yet.
  current: Checklist | null
  onClose: () => void
  onSaved: (checklist: Checklist) => void
}

type ItemRow = { key: number; label: string; required: boolean }

let nextKey = 1

function row(label = '', required = true): ItemRow {
  return { key: nextKey++, label, required }
}

export function ChecklistForm({ taskType, current, onClose, onSaved }: ChecklistFormProps) {
  const [name, setName] = useState(current?.name ?? rateTaskTypeLabel(taskType))
  const [items, setItems] = useState<ItemRow[]>(() =>
    current && current.items.length > 0 ? current.items.map((item) => row(item.label, item.required)) : [row()],
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // After the API rejects the data, take the user to the first wrong field.
  useEffect(() => {
    if (Object.keys(errors).length > 0) focusFirstInvalid('checklist-form')
  }, [errors])

  function updateItem(key: number, changes: Partial<ItemRow>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...changes } : item)))
  }

  function moveItem(index: number, delta: number) {
    setItems((current) => {
      const target = index + delta
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function removeItem(key: number) {
    setItems((current) => current.filter((item) => item.key !== key))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setError('')

    try {
      const saved = await saveChecklist({
        task_type: taskType,
        name: name.trim(),
        items: items.map((item) => ({ label: item.label.trim(), required: item.required })),
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
      title={current ? 'Alterar checklist' : 'Criar checklist'}
      subtitle={rateTaskTypeLabel(taskType)}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="checklist-form" loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="checklist-form" className="checklist-form" onSubmit={handleSubmit} noValidate>
        <p className="form-hint">
          As alterações aplicam-se às tarefas criadas a partir de agora. As tarefas já criadas mantêm a checklist que
          tinham.
        </p>

        <Field
          label="Nome da checklist"
          name="name"
          value={name}
          onChange={(_, value) => setName(value)}
          error={errors.name}
          required
          disabled={saving}
        />

        <fieldset className="checklist-items" disabled={saving}>
          <legend>Itens (pela ordem em que o prestador os vê)</legend>
          {errors.items && <p className="field-error">{errors.items}</p>}

          <ol>
            {items.map((item, index) => {
              const inputId = `items.${index}.label`
              const itemError = errors[`items.${index}.label`]

              return (
                <li key={item.key} className="checklist-item-row">
                  <div className="field checklist-item-main">
                    <label htmlFor={inputId} className="checklist-item-label">
                      Item {index + 1}
                    </label>
                    <input
                      id={inputId}
                      name={inputId}
                      value={item.label}
                      onChange={(event) => updateItem(item.key, { label: event.target.value })}
                      maxLength={200}
                      aria-invalid={itemError ? true : undefined}
                      aria-describedby={itemError ? `${inputId}-error` : undefined}
                    />
                    {itemError && (
                      <p id={`${inputId}-error`} className="field-error">
                        {itemError}
                      </p>
                    )}
                  </div>
                  <label className="checklist-item-required">
                    <input
                      type="checkbox"
                      checked={item.required}
                      onChange={(event) => updateItem(item.key, { required: event.target.checked })}
                    />
                    Obrigatório
                  </label>
                  <div className="checklist-item-actions">
                    <Button
                      variant="secondary"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      aria-label={`Subir item ${index + 1}`}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label={`Descer item ${index + 1}`}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => removeItem(item.key)}
                      disabled={items.length === 1}
                      aria-label={`Remover item ${index + 1}`}
                    >
                      ✕
                    </Button>
                  </div>
                </li>
              )
            })}
          </ol>

          <Button variant="secondary" onClick={() => setItems((current) => [...current, row()])}>
            Adicionar item
          </Button>
        </fieldset>

        {error && <Message type="error">{error}</Message>}
      </form>
    </Modal>
  )
}
