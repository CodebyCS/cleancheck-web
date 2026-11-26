import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { Message } from '../components/Message'
import { SelectField } from '../components/SelectField'
import { listProperties } from '../services/properties'
import type { Property } from '../services/properties'
import { rateTaskTypeLabel } from '../services/rates'
import { listServiceEntries, retryServiceEntry } from '../services/serviceEntries'
import type { ServiceEntryReview } from '../services/serviceEntries'
import { listServiceProviders } from '../services/serviceProviders'
import type { ServiceProvider } from '../services/serviceProviders'
import { ServiceEntryDetail } from './ServiceEntryDetail'
import { formatAmount, formatDate, formatSigned } from './serviceEntryFormat'
import './records.css'
import './ServiceEntriesPage.css'

type Feedback = { type: 'error' | 'success'; text: string } | null

const emptyReview: ServiceEntryReview = { entries: [], totals: [], tasksWithoutEntry: [], count: 0 }

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function ServiceEntriesPage() {
  const [month, setMonth] = useState(currentMonth)
  const [serviceProviderId, setServiceProviderId] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [review, setReview] = useState<ServiceEntryReview>(emptyReview)
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [retrying, setRetrying] = useState<number | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([listServiceProviders('all'), listProperties('all')])
      .then(([nextProviders, nextProperties]) => {
        if (!active) return
        setProviders(nextProviders)
        setProperties(nextProperties)
      })
      // The filters still work without names; the list shows its own error if the API is down.
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    listServiceEntries({ month, serviceProviderId, propertyId })
      .then((nextReview) => {
        if (!active) return
        setReview(nextReview)
        setLoadError('')
        setUnavailable(false)
      })
      .catch((error: unknown) => {
        if (!active) return
        // 404: the API does not have the service entries review yet.
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
  }, [month, serviceProviderId, propertyId, reloadKey])

  const providerOptions = useMemo(
    () => providers.map((provider) => ({ value: String(provider.id), label: provider.name })),
    [providers],
  )

  const propertyOptions = useMemo(
    () => properties.map((property) => ({ value: String(property.id), label: property.name })),
    [properties],
  )

  function reload() {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  async function handleRetry(taskId: number) {
    setRetrying(taskId)
    setFeedback(null)

    try {
      const entry = await retryServiceEntry(taskId)
      setFeedback({
        type: 'success',
        text: `Tarefa #${taskId} lançada: ${formatAmount(entry.final_amount, entry.currency)}.`,
      })
      reload()
    } catch (error) {
      setFeedback({ type: 'error', text: `Tarefa #${taskId}: ${errorMessage(error)}` })
    } finally {
      setRetrying(null)
    }
  }

  return (
    <section>
      <div className="records-toolbar">
        <div>
          <h2 className="page-title">Conferência</h2>
          {!loading && !loadError && !unavailable && <p className="record-card-meta">{review.count} lançamentos</p>}
        </div>
        <Field
          label="Mês"
          name="review-month"
          type="month"
          value={month}
          onChange={(_, value) => {
            if (!value) return
            setLoading(true)
            setMonth(value)
          }}
        />
        <SelectField
          label="Prestador"
          name="review-provider"
          value={serviceProviderId}
          options={providerOptions}
          placeholder="Todos"
          onChange={(_, value) => {
            setLoading(true)
            setServiceProviderId(value)
          }}
        />
        <SelectField
          label="Imóvel"
          name="review-property"
          value={propertyId}
          options={propertyOptions}
          placeholder="Todos"
          onChange={(_, value) => {
            setLoading(true)
            setPropertyId(value)
          }}
        />
      </div>

      <p className="form-hint">
        Um lançamento por serviço concluído, com o valor fixado na conclusão. As correções são feitas com ajustes
        justificados; o lançamento original nunca é alterado e o valor final é o original mais os ajustes.
      </p>

      {feedback && <Message type={feedback.type}>{feedback.text}</Message>}

      {loading ? (
        <Message type="info">A carregar lançamentos...</Message>
      ) : unavailable ? (
        <Message type="info">A conferência ainda não está disponível nesta versão da API.</Message>
      ) : loadError ? (
        <Message type="error">{loadError}</Message>
      ) : (
        <>
          {review.totals.length > 0 && (
            <div className="review-totals">
              {review.totals.map((total) => (
                <div key={total.currency} className="review-total-card">
                  <p className="review-total-label">
                    Total final ({total.entries} {total.entries === 1 ? 'lançamento' : 'lançamentos'})
                  </p>
                  <p className="review-total-value">{formatAmount(total.total, total.currency)}</p>
                  <p className="review-total-parts">
                    Original {formatAmount(total.original_total, total.currency)} · Ajustes{' '}
                    {formatSigned(total.adjustments_total, total.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {review.tasksWithoutEntry.length > 0 && (
            <div className="review-missing" role="region" aria-label="Tarefas sem lançamento">
              <p>
                <strong>{review.tasksWithoutEntry.length}</strong>{' '}
                {review.tasksWithoutEntry.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'} sem lançamento.
                Normalmente falta o valor (valor acordado, tarifa ou valor base). Depois de o definir, tente lançar de
                novo.
              </p>
              <ul>
                {review.tasksWithoutEntry.map((taskId) => (
                  <li key={taskId}>
                    <span>Tarefa #{taskId}</span>
                    <Button
                      variant="secondary"
                      onClick={() => handleRetry(taskId)}
                      loading={retrying === taskId}
                      loadingText="A lançar..."
                      disabled={retrying !== null && retrying !== taskId}
                    >
                      Tentar lançar
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.entries.length === 0 ? (
            <Message type="info">Não há lançamentos para mostrar.</Message>
          ) : (
            <>
              <div className="rates-table-wrapper">
                <table className="rates-table review-table">
                  <thead>
                    <tr>
                      <th scope="col">Data</th>
                      <th scope="col">Prestador</th>
                      <th scope="col">Imóvel</th>
                      <th scope="col">Tipo de tarefa</th>
                      <th scope="col" className="rates-amount">Original</th>
                      <th scope="col" className="rates-amount">Ajustes</th>
                      <th scope="col" className="rates-amount">Final</th>
                      <th scope="col" aria-label="Ações" />
                    </tr>
                  </thead>
                  <tbody>
                    {review.entries.map((entry) => {
                      const adjusted = Number(entry.adjustments_total) !== 0

                      return (
                        <tr key={entry.id}>
                          <td>{formatDate(entry.service_date)}</td>
                          <td>{entry.service_provider_name ?? `Prestador #${entry.service_provider_id}`}</td>
                          <td>{entry.property_name ?? `Imóvel #${entry.property_id}`}</td>
                          <td>{rateTaskTypeLabel(entry.task_type)}</td>
                          <td className="rates-amount">{formatAmount(entry.amount, entry.currency)}</td>
                          <td className={`rates-amount${adjusted ? ' review-adjusted' : ''}`}>
                            {adjusted ? formatSigned(entry.adjustments_total, entry.currency) : '—'}
                          </td>
                          <td className="rates-amount review-final">{formatAmount(entry.final_amount, entry.currency)}</td>
                          <td className="review-action">
                            <Button
                              variant="secondary"
                              onClick={() => setSelectedId(entry.id)}
                              aria-label={`Ver lançamento ${entry.id}`}
                            >
                              Ver
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {review.count > review.entries.length && (
                <p className="form-hint">
                  A mostrar os {review.entries.length} lançamentos mais recentes de {review.count}. Use os filtros para
                  ver os restantes; os totais incluem todos.
                </p>
              )}
            </>
          )}
        </>
      )}

      {selectedId !== null && (
        <ServiceEntryDetail entryId={selectedId} onClose={() => setSelectedId(null)} onChanged={reload} />
      )}
    </section>
  )
}
