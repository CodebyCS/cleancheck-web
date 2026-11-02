import { useCallback, useEffect, useMemo, useState } from 'react'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Message } from '../components/Message'
import { SelectField } from '../components/SelectField'
import { listProperties, setPropertyActive } from '../services/properties'
import type { ActiveFilter, Property } from '../services/properties'
import { listServiceProviders } from '../services/serviceProviders'
import type { ServiceProvider } from '../services/serviceProviders'
import { PropertyForm } from './PropertyForm'
import './records.css'

type Feedback = { type: 'error' | 'success'; text: string } | null
type FormTarget = { property: Property | null } | null

const filterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
]

function formatAmount(amount: string | null): string {
  return amount === null ? '—' : `${Number(amount).toFixed(2).replace('.', ',')} €`
}

export function PropertiesPage() {
  const [items, setItems] = useState<Property[]>([])
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [filter, setFilter] = useState<ActiveFilter>('all')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formTarget, setFormTarget] = useState<FormTarget>(null)
  const [toggling, setToggling] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    Promise.all([listProperties(filter), listServiceProviders()])
      .then(([properties, serviceProviders]) => {
        if (!active) return
        setItems(properties)
        setProviders(serviceProviders)
        setLoadError('')
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
  }, [filter, reloadKey])

  function reload() {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  function handleFilterChange(value: string) {
    setLoading(true)
    setFilter(value as ActiveFilter)
  }

  // Only active providers can be chosen as responsible.
  const providerOptions = useMemo(
    () => providers.filter((p) => p.is_active).map((p) => ({ value: String(p.id), label: p.name })),
    [providers],
  )

  const providerName = useCallback(
    (id: number | null) => (id === null ? 'Sem responsável' : providers.find((p) => p.id === id)?.name ?? `#${id}`),
    [providers],
  )

  const selected = items.find((item) => item.id === selectedId) ?? null

  function handleSaved(saved: Property) {
    const isNew = formTarget?.property === null
    setFormTarget(null)
    setSelectedId(saved.id)
    setFeedback({ type: 'success', text: isNew ? 'Imóvel criado.' : 'Alterações guardadas.' })
    reload()
  }

  async function handleToggleActive(property: Property) {
    const deactivating = property.is_active

    if (deactivating && !window.confirm(
      `Desativar "${property.name}"? O imóvel deixa de estar disponível para novas reservas e tarefas. O histórico mantém-se.`,
    )) {
      return
    }

    setToggling(true)
    setFeedback(null)
    try {
      await setPropertyActive(property.id, !deactivating)
      setFeedback({ type: 'success', text: deactivating ? 'Imóvel desativado.' : 'Imóvel ativado.' })
      reload()
    } catch (error) {
      setFeedback({ type: 'error', text: errorMessage(error) })
    } finally {
      setToggling(false)
    }
  }

  return (
    <section>
      <div className="records-toolbar">
        <div>
          <h2>Imóveis</h2>
          {!loading && !loadError && <p className="record-card-meta">{items.length} registos</p>}
        </div>
        <SelectField
          label="Mostrar"
          name="active-filter"
          value={filter}
          options={filterOptions}
          onChange={(_, value) => handleFilterChange(value)}
        />
        <Button onClick={() => setFormTarget({ property: null })}>+ Novo imóvel</Button>
      </div>

      {feedback && <Message type={feedback.type}>{feedback.text}</Message>}

      <div className="records-layout">
        <div>
          {loading ? (
            <Message type="info">A carregar imóveis...</Message>
          ) : loadError ? (
            <Message type="error">{loadError}</Message>
          ) : items.length === 0 ? (
            <Message type="info">Não há imóveis para mostrar.</Message>
          ) : (
            <ul className="records-list">
              {items.map((property) => (
                <li key={property.id}>
                  <button
                    type="button"
                    className={[
                      'record-card',
                      property.id === selectedId ? 'selected' : '',
                      property.is_active ? '' : 'inactive',
                    ].filter(Boolean).join(' ')}
                    aria-pressed={property.id === selectedId}
                    onClick={() => setSelectedId(property.id)}
                  >
                    <span className="record-card-title">
                      {property.name}
                      {!property.is_active && <span className="badge badge-inactive">Inativo</span>}
                    </span>
                    <span className="record-card-meta">
                      {property.address}, {property.postal_code} {property.city}
                    </span>
                    <span className="record-card-meta">
                      Responsável: {providerName(property.responsible_service_provider_id)}
                      {' · '}
                      Entrada {property.default_check_in_time ?? '—'} / Saída {property.default_check_out_time ?? '—'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected ? (
          <aside className="detail-panel" aria-label="Detalhe do imóvel">
            <h3>
              {selected.name}
              {!selected.is_active && <span className="badge badge-inactive">Inativo</span>}
            </h3>
            <dl className="detail-rows">
              <div className="detail-row"><dt>Morada</dt><dd>{selected.address}, {selected.postal_code} {selected.city}</dd></div>
              <div className="detail-row"><dt>Responsável</dt><dd>{providerName(selected.responsible_service_provider_id)}</dd></div>
              <div className="detail-row"><dt>Valor base</dt><dd>{formatAmount(selected.base_cleaning_amount)}</dd></div>
              <div className="detail-row"><dt>Hora de entrada</dt><dd>{selected.default_check_in_time ?? '—'}</dd></div>
              <div className="detail-row"><dt>Hora de saída</dt><dd>{selected.default_check_out_time ?? '—'}</dd></div>
              <div className="detail-row"><dt>Acesso</dt><dd>{selected.access_instructions || '—'}</dd></div>
            </dl>
            <div className="detail-actions">
              <Button onClick={() => setFormTarget({ property: selected })} disabled={toggling}>Editar</Button>
              <Button
                variant="secondary"
                className={selected.is_active ? 'btn-danger' : undefined}
                loading={toggling}
                loadingText="A atualizar..."
                onClick={() => void handleToggleActive(selected)}
              >
                {selected.is_active ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </aside>
        ) : (
          <div className="detail-empty">Selecione um imóvel para ver os detalhes.</div>
        )}
      </div>

      {formTarget && (
        <PropertyForm
          property={formTarget.property}
          providerOptions={providerOptions}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  )
}
