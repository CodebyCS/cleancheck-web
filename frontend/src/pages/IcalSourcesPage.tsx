import { useEffect, useState } from 'react'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Message } from '../components/Message'
import { ImportSummary } from '../components/ical/ImportSummary'
import { SourceForm } from '../components/ical/SourceForm'
import { SyncStatus } from '../components/ical/SyncStatus'
import '../components/ical/ical.css'
import {
  listBookingSources,
  maskSourceUrl,
  syncBookingSource,
  updateBookingSource,
} from '../services/bookingSources'
import type { BookingSource } from '../services/bookingSources'
import { listProperties } from '../services/properties'
import type { Property } from '../services/properties'
import { icalErrorMessage } from '../services/reservations'
import type { IcalImportResult } from '../services/reservations'
import { fieldErrors } from '../services/validation'
import './records.css'

type Feedback = { type: 'error' | 'success'; text: string } | null
type FormTarget = { source: BookingSource | null } | null
type Busy = { id: number; action: 'sync' | 'toggle' } | null

export function IcalSourcesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [propertiesError, setPropertiesError] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [sources, setSources] = useState<BookingSource[]>([])
  const [loadingSources, setLoadingSources] = useState(false)
  const [sourcesError, setSourcesError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [formTarget, setFormTarget] = useState<FormTarget>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [result, setResult] = useState<IcalImportResult | null>(null)

  useEffect(() => {
    let active = true

    listProperties('active')
      .then((items) => {
        if (active) setProperties(items)
      })
      .catch((error: unknown) => {
        if (active) setPropertiesError(errorMessage(error))
      })
      .finally(() => {
        if (active) setLoadingProperties(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!propertyId) return

    let active = true

    listBookingSources(Number(propertyId))
      .then((items) => {
        if (!active) return
        setSources(items)
        setSourcesError('')
      })
      .catch((error: unknown) => {
        if (active) setSourcesError(errorMessage(error))
      })
      .finally(() => {
        if (active) setLoadingSources(false)
      })

    return () => {
      active = false
    }
  }, [propertyId, reloadKey])

  function reloadSources() {
    setLoadingSources(true)
    setReloadKey((key) => key + 1)
  }

  function handlePropertyChange(value: string) {
    setPropertyId(value)
    setSources([])
    setSourcesError('')
    setLoadingSources(value !== '')
    setFeedback(null)
    setResult(null)
  }

  function handleSaved() {
    const isNew = formTarget?.source === null
    setFormTarget(null)
    setFeedback({ type: 'success', text: isNew ? 'Fonte registada. Já pode sincronizar.' : 'Link atualizado.' })
    reloadSources()
  }

  async function handleSync(source: BookingSource) {
    setBusy({ id: source.id, action: 'sync' })
    setFeedback(null)
    setResult(null)

    try {
      setResult(await syncBookingSource(source.id))
      setFeedback({ type: 'success', text: 'Sincronização concluída.' })
    } catch (error) {
      setFeedback({ type: 'error', text: icalErrorMessage(error) })
    } finally {
      setBusy(null)
      // Success or failure, the attempt is recorded and the status must be refreshed.
      reloadSources()
    }
  }

  async function handleToggleActive(source: BookingSource) {
    const deactivating = source.isActive

    if (deactivating && !window.confirm(
      'Desativar esta fonte? Deixa de ser sincronizada, manual e automaticamente. As reservas já gravadas mantêm-se.',
    )) {
      return
    }

    setBusy({ id: source.id, action: 'toggle' })
    setFeedback(null)
    setResult(null)

    try {
      await updateBookingSource(source.id, { is_active: !deactivating })
      setFeedback({ type: 'success', text: deactivating ? 'Fonte desativada.' : 'Fonte ativada.' })
      reloadSources()
    } catch (error) {
      setFeedback({ type: 'error', text: fieldErrors(error).source ?? errorMessage(error) })
    } finally {
      setBusy(null)
    }
  }

  const locked = busy !== null

  return (
    <section>
      <div className="records-toolbar">
        <div>
          <h2>Fontes iCal</h2>
          <p className="record-card-meta">Calendários do Airbnb sincronizados por imóvel.</p>
        </div>
        {!loadingProperties && !propertiesError && properties.length > 0 && (
          <div className="field">
            <label htmlFor="source_property_id">Imóvel</label>
            <select
              id="source_property_id"
              value={propertyId}
              onChange={(event) => handlePropertyChange(event.target.value)}
              disabled={locked}
            >
              <option value="">Escolha um imóvel</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {propertyId && (
          <Button onClick={() => setFormTarget({ source: null })} disabled={locked}>
            + Nova fonte
          </Button>
        )}
      </div>

      {feedback && <Message type={feedback.type}>{feedback.text}</Message>}

      {loadingProperties ? (
        <Message type="info">A carregar imóveis...</Message>
      ) : propertiesError ? (
        <Message type="error">{propertiesError}</Message>
      ) : properties.length === 0 ? (
        <Message type="info">Registe um imóvel ativo antes de adicionar calendários.</Message>
      ) : !propertyId ? (
        <Message type="info">Escolha um imóvel para ver as fontes.</Message>
      ) : loadingSources && sources.length === 0 ? (
        <Message type="info">A carregar fontes...</Message>
      ) : sourcesError ? (
        <Message type="error">{sourcesError}</Message>
      ) : sources.length === 0 ? (
        <Message type="info">Este imóvel ainda não tem fontes. Registe o link do calendário do Airbnb.</Message>
      ) : (
        <ul className="records-list">
          {sources.map((source) => (
            <li
              key={source.id}
              className={source.isActive ? 'record-card source-card' : 'record-card source-card inactive'}
            >
              <span className="record-card-title">
                {source.type === 'url' ? 'Calendário Airbnb' : 'Ficheiros importados'}
                {!source.isActive && <span className="badge badge-inactive">Inativa</span>}
              </span>
              <div className="record-card-meta">
                {source.url ? maskSourceUrl(source.url) : 'Importação manual de ficheiros .ics'}
              </div>

              <SyncStatus source={source} />

              {source.type === 'url' && (
                <div className="detail-actions source-actions">
                  {source.isActive && (
                    <Button
                      loading={busy?.id === source.id && busy.action === 'sync'}
                      loadingText="A sincronizar..."
                      disabled={locked}
                      onClick={() => void handleSync(source)}
                    >
                      Sincronizar agora
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    disabled={locked}
                    onClick={() => setFormTarget({ source })}
                  >
                    Trocar link
                  </Button>
                  <Button
                    variant="secondary"
                    className={source.isActive ? 'btn-danger' : undefined}
                    loading={busy?.id === source.id && busy.action === 'toggle'}
                    loadingText="A atualizar..."
                    disabled={locked}
                    onClick={() => void handleToggleActive(source)}
                  >
                    {source.isActive ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {result && <ImportSummary data={result} title="Resultado da sincronização" />}

      {formTarget && (
        <SourceForm
          propertyId={Number(propertyId)}
          source={formTarget.source}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  )
}