import { useEffect, useState } from 'react'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Message } from '../components/Message'
import { SelectField } from '../components/SelectField'
import type { ActiveFilter } from '../services/properties'
import { listServiceProviders, setServiceProviderActive } from '../services/serviceProviders'
import type { ServiceProvider } from '../services/serviceProviders'
import { initialsOf } from '../utils/initials'
import { ServiceProviderForm } from './ServiceProviderForm'
import './records.css'

type Feedback = { type: 'error' | 'success'; text: string } | null
type FormTarget = { provider: ServiceProvider | null } | null

const filterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
]

function formatAddress(provider: ServiceProvider): string {
  const locality = [provider.postal_code, provider.city].filter(Boolean).join(' ')
  const parts = [provider.address, locality].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}

function Avatar({ provider, large = false }: { provider: ServiceProvider; large?: boolean }) {
  const className = large ? 'avatar avatar-large' : 'avatar'

  return provider.photo_url ? (
    <img className={className} src={provider.photo_url} alt={`Fotografia de ${provider.name}`} />
  ) : (
    <span className={className} aria-hidden="true">{initialsOf(provider.name)}</span>
  )
}

export function ServiceProvidersPage() {
  const [items, setItems] = useState<ServiceProvider[]>([])
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

    listServiceProviders(filter)
      .then((providers) => {
        if (!active) return
        setItems(providers)
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

  const selected = items.find((item) => item.id === selectedId) ?? null

  function handleSaved(saved: ServiceProvider, photoError?: string) {
    const isNew = formTarget?.provider === null
    setFormTarget(null)
    setSelectedId(saved.id)

    if (photoError) {
      setFeedback({ type: 'error', text: `Dados guardados, mas a fotografia não foi enviada: ${photoError}` })
    } else {
      setFeedback({
        type: 'success',
        text: isNew ? 'Prestador criado. Já pode entrar com este e-mail na web e no mobile.' : 'Alterações guardadas.',
      })
    }

    reload()
  }

  async function handleToggleActive(provider: ServiceProvider) {
    const deactivating = provider.is_active

    if (deactivating && !window.confirm(
      `Desativar ${provider.name}? Deixa de conseguir entrar e não pode receber novas tarefas. As tarefas antigas mantêm-se.`,
    )) {
      return
    }

    setToggling(true)
    setFeedback(null)
    try {
      await setServiceProviderActive(provider.id, !deactivating)
      setFeedback({ type: 'success', text: deactivating ? 'Prestador desativado.' : 'Prestador ativado.' })
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
          <h2>Prestadores</h2>
          {!loading && !loadError && <p className="record-card-meta">{items.length} registos</p>}
        </div>
        <SelectField
          label="Mostrar"
          name="active-filter"
          value={filter}
          options={filterOptions}
          onChange={(_, value) => handleFilterChange(value)}
        />
        <Button onClick={() => setFormTarget({ provider: null })}>+ Novo prestador</Button>
      </div>

      {feedback && <Message type={feedback.type}>{feedback.text}</Message>}

      <div className="records-layout">
        <div>
          {loading ? (
            <Message type="info">A carregar prestadores...</Message>
          ) : loadError ? (
            <Message type="error">{loadError}</Message>
          ) : items.length === 0 ? (
            <Message type="info">Não há prestadores para mostrar.</Message>
          ) : (
            <ul className="records-list">
              {items.map((provider) => (
                <li key={provider.id}>
                  <button
                    type="button"
                    className={[
                      'record-card',
                      provider.id === selectedId ? 'selected' : '',
                      provider.is_active ? '' : 'inactive',
                    ].filter(Boolean).join(' ')}
                    aria-pressed={provider.id === selectedId}
                    onClick={() => setSelectedId(provider.id)}
                  >
                    <span className="record-card-title">
                      <Avatar provider={provider} />
                      {provider.name}
                      {!provider.is_active && <span className="badge badge-inactive">Inativo</span>}
                    </span>
                    <span className="record-card-meta">
                      {provider.email} · {provider.phone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected ? (
          <aside className="detail-panel" aria-label="Detalhe do prestador">
            <div className="detail-header">
              <Avatar provider={selected} large />
              <h3>
                {selected.name}
                {!selected.is_active && <span className="badge badge-inactive">Inativo</span>}
              </h3>
            </div>
            <dl className="detail-rows">
              <div className="detail-row"><dt>E-mail</dt><dd>{selected.email}</dd></div>
              <div className="detail-row"><dt>Telefone</dt><dd>{selected.phone}</dd></div>
              <div className="detail-row"><dt>Morada</dt><dd>{formatAddress(selected)}</dd></div>
            </dl>
            <div className="detail-actions">
              <Button onClick={() => setFormTarget({ provider: selected })} disabled={toggling}>Editar</Button>
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
          <div className="detail-empty">Selecione um prestador para ver os detalhes.</div>
        )}
      </div>

      {formTarget && (
        <ServiceProviderForm
          provider={formTarget.provider}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  )
}
