import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Message } from '../components/Message'
import { ImportSummary } from '../components/ical/ImportSummary'
import { PreviewResult } from '../components/ical/PreviewResult'
import '../components/ical/ical.css'
import { listProperties } from '../services/properties'
import type { Property } from '../services/properties'
import { icalErrorMessage, importIcal, previewIcal } from '../services/reservations'
import type { IcalImportResult, IcalReadResult } from '../services/reservations'

type Action = 'preview' | 'import'

export function IcalImportPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState<Action | null>(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<IcalReadResult | null>(null)
  const [result, setResult] = useState<IcalImportResult | null>(null)

  useEffect(() => {
    let active = true

    listProperties()
      .then((items) => {
        if (active) setProperties(items)
      })
      .catch((requestError: unknown) => {
        if (active) setLoadError(errorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
    setError('')
    setPreview(null)
    setResult(null)
  }

  async function run(action: Action) {
    if (!propertyId) {
      setError('Escolha um imóvel.')
      return
    }
    if (!file) {
      setError('Escolha um ficheiro .ics.')
      return
    }

    setBusy(action)
    setError('')
    setPreview(null)
    setResult(null)

    try {
      if (action === 'preview') {
        setPreview(await previewIcal(file, Number(propertyId)))
      } else {
        setResult(await importIcal(file, Number(propertyId)))
      }
    } catch (requestError) {
      setError(icalErrorMessage(requestError))
    } finally {
      setBusy(null)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void run('preview')
  }

  const working = busy !== null

  return (
    <section>
      <h2>Importar reservas iCal</h2>

      {loading ? (
        <Message type="info">A carregar imóveis...</Message>
      ) : loadError ? (
        <Message type="error">{loadError}</Message>
      ) : properties.length === 0 ? (
        <Message type="info">Registe um imóvel antes de importar reservas.</Message>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="property_id">
              Imóvel<span aria-hidden="true"> *</span>
            </label>
            <select
              id="property_id"
              value={propertyId}
              onChange={(event) => setPropertyId(event.target.value)}
              disabled={working}
              required
            >
              <option value="">Escolha um imóvel</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="ical_file">
              Ficheiro .ics<span aria-hidden="true"> *</span>
            </label>
            <input
              id="ical_file"
              type="file"
              accept=".ics,text/calendar"
              onChange={handleFileChange}
              disabled={working}
              required
            />
          </div>

          {error && <Message type="error">{error}</Message>}

          <div className="ical-actions">
            <Button
              type="submit"
              variant="secondary"
              loading={busy === 'preview'}
              loadingText="A ler..."
              disabled={working}
            >
              Pré-visualizar
            </Button>
            <Button
              loading={busy === 'import'}
              loadingText="A importar..."
              disabled={working}
              onClick={() => void run('import')}
            >
              Importar
            </Button>
          </div>
        </form>
      )}

      {preview && <PreviewResult data={preview} />}
      {result && <ImportSummary data={result} />}
    </section>
  )
}