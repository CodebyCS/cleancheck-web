import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Message } from '../components/Message'
import { SelectField } from '../components/SelectField'
import { listProperties } from '../services/properties'
import type { Property } from '../services/properties'
import { listRates, rateTaskTypeLabel, rateTaskTypes, ratesInForce } from '../services/rates'
import type { Rate, RateTaskType } from '../services/rates'
import { RateForm } from './RateForm'
import './records.css'
import './RatesPage.css'

type Feedback = { type: 'error' | 'success'; text: string } | null

function localToday(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function formatAmount(amount: string, currency: string): string {
  const value = Number(amount)
  if (Number.isNaN(value)) return `${amount} ${currency}`

  try {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(value)
  } catch {
    return `${value.toFixed(2).replace('.', ',')} ${currency}`
  }
}

export function RatesPage() {
  const today = useMemo(() => localToday(), [])
  const [rates, setRates] = useState<Rate[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [taskType, setTaskType] = useState<RateTaskType | ''>('')
  const [scope, setScope] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    Promise.all([listRates({ taskType, scope }), listProperties('all')])
      .then(([nextRates, nextProperties]) => {
        if (!active) return
        setRates(nextRates)
        setProperties(nextProperties)
        setLoadError('')
        setUnavailable(false)
      })
      .catch((error: unknown) => {
        if (!active) return
        // 404: the API does not have the rates endpoints yet.
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setUnavailable(true)
          return
        }
        setLoadError(errorMessage(error))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [taskType, scope, reloadKey])

  const propertyName = useMemo(() => {
    const names = new Map(properties.map((property) => [property.id, property.name]))
    return (id: number | null) => (id === null ? 'Geral (todos os imóveis)' : names.get(id) ?? `Imóvel #${id}`)
  }, [properties])

  const scopeOptions = useMemo(
    () => [
      { value: 'general', label: 'Só tarifas gerais' },
      ...properties.map((property) => ({ value: String(property.id), label: property.name })),
    ],
    [properties],
  )

  const propertyOptions = useMemo(
    () => properties
      .filter((property) => property.is_active)
      .map((property) => ({ value: String(property.id), label: property.name })),
    [properties],
  )

  const inForce = useMemo(() => ratesInForce(rates, today), [rates, today])

  function handleSaved(rate: Rate) {
    setFormOpen(false)
    setFeedback({
      type: 'success',
      text: `Tarifa criada: ${formatAmount(rate.amount, rate.currency)} a partir de ${formatDate(rate.valid_from)}.`,
    })
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  return (
    <section>
      <div className="records-toolbar">
        <div>
          <h2 className="page-title">Tarifas</h2>
          {!loading && !loadError && !unavailable && <p className="record-card-meta">{rates.length} registos</p>}
        </div>
        <SelectField
          label="Tipo de tarefa"
          name="rate-task-type"
          value={taskType}
          options={rateTaskTypes}
          placeholder="Todos"
          onChange={(_, value) => {
            setLoading(true)
            setTaskType(value as RateTaskType | '')
          }}
        />
        <SelectField
          label="Imóvel"
          name="rate-scope"
          value={scope}
          options={scopeOptions}
          placeholder="Todos"
          onChange={(_, value) => {
            setLoading(true)
            setScope(value)
          }}
        />
        <Button onClick={() => setFormOpen(true)} disabled={unavailable}>+ Nova tarifa</Button>
      </div>

      <p className="form-hint">
        Histórico de tarifas. Cada serviço concluído usa a tarifa em vigor na data do serviço; criar uma tarifa nova
        não altera serviços já lançados.
      </p>

      {feedback && <Message type={feedback.type}>{feedback.text}</Message>}

      {loading ? (
        <Message type="info">A carregar tarifas...</Message>
      ) : unavailable ? (
        <Message type="info">As tarifas ainda não estão disponíveis nesta versão da API.</Message>
      ) : loadError ? (
        <Message type="error">{loadError}</Message>
      ) : rates.length === 0 ? (
        <Message type="info">Não há tarifas para mostrar.</Message>
      ) : (
        <div className="rates-table-wrapper">
          <table className="rates-table">
            <thead>
              <tr>
                <th scope="col">A partir de</th>
                <th scope="col">Imóvel</th>
                <th scope="col">Tipo de tarefa</th>
                <th scope="col" className="rates-amount">Valor</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => {
                const future = rate.valid_from > today
                const current = inForce.has(rate.id)

                return (
                  <tr key={rate.id}>
                    <td>{formatDate(rate.valid_from)}</td>
                    <td>{propertyName(rate.property_id)}</td>
                    <td>{rateTaskTypeLabel(rate.task_type)}</td>
                    <td className="rates-amount">{formatAmount(rate.amount, rate.currency)}</td>
                    <td>
                      {current && <span className="rate-status rate-status-current">Em vigor</span>}
                      {future && <span className="rate-status rate-status-future">Agendada</span>}
                      {!current && !future && <span className="rate-status">Histórico</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <RateForm
          propertyOptions={propertyOptions}
          today={today}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </section>
  )
}
