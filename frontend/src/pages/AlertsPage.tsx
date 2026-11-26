import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Message } from '../components/Message'
import { ResolveAlertModal } from '../components/alerts/ResolveAlertModal'
import { usePollingTick } from '../hooks/usePollingTick'
import {
  ALERT_POLL_INTERVAL_MS,
  actionLabels,
  alertTypeLabels,
  listTaskAlerts,
  priorityLabels,
  resolutionLabels,
  taskTypeLabels,
} from '../services/taskAlerts'
import type { AlertCounts, AlertPriority, AlertStatus, TaskAlert } from '../services/taskAlerts'
import './AlertsPage.css'

type AlertsPageProps = {
  onSessionExpired: () => void
  onAlertsChanged: () => void
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// Measured against the last check (not the clock) so render stays pure.
function openFor(detectedAt: string, checkedAt: Date): string {
  const minutes = Math.max(0, Math.round((checkedAt.getTime() - new Date(detectedAt).getTime()) / 60_000))

  if (minutes < 1) return 'aberto agora'
  if (minutes < 60) return `aberto há ${minutes} min`
  return `aberto há ${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

function taskWindow(alert: TaskAlert): string {
  const start = alert.task?.scheduledStart
  const end = alert.task?.scheduledEnd

  if (!start) return '—'
  return end ? `${formatDateTime(start)} → ${formatDateTime(end)}` : `${formatDateTime(start)} (sem check-in seguinte)`
}

export function AlertsPage({ onSessionExpired, onAlertsChanged }: AlertsPageProps) {
  const [status, setStatus] = useState<AlertStatus>('active')
  const [priority, setPriority] = useState<AlertPriority | null>(null)
  const [page, setPage] = useState(1)
  const [manualTick, setManualTick] = useState(0)
  const pollTick = usePollingTick(ALERT_POLL_INTERVAL_MS)

  const [alerts, setAlerts] = useState<TaskAlert[]>([])
  const [lastPage, setLastPage] = useState(1)
  const [counts, setCounts] = useState<AlertCounts>({ active: 0, high: 0 })
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resolving, setResolving] = useState<TaskAlert | null>(null)

  // Alerts already on screen: anything else that shows up on a later check is new.
  const seenIds = useRef<Set<number> | null>(null)
  const [newIds, setNewIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    let active = true

    listTaskAlerts({ status, priority, page })
      .then((result) => {
        if (!active) return

        if (status === 'active') {
          const seen = seenIds.current
          // On the first load everything is "seen": only later arrivals are highlighted.
          setNewIds(new Set(seen === null ? [] : result.alerts.filter((alert) => !seen.has(alert.id)).map((alert) => alert.id)))
          seenIds.current = new Set([...(seen ?? []), ...result.alerts.map((alert) => alert.id)])
        } else {
          setNewIds(new Set())
        }

        setAlerts(result.alerts)
        setLastPage(result.lastPage)
        setCounts(result.counts)
        setCheckedAt(new Date())
        setError('')
      })
      .catch((err: unknown) => {
        if (!active) return
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          onSessionExpired()
          return
        }
        // Keep the last list on screen: a failed poll must not hide alerts.
        setError(errorMessage(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [status, priority, page, pollTick, manualTick, onSessionExpired])

  // Loading is switched on in the handlers (not inside the effect), as the react-hooks lint rules require.
  function changeStatus(next: AlertStatus) {
    if (next === status) return
    seenIds.current = null
    setLoading(true)
    setSuccess('')
    setStatus(next)
    setPage(1)
  }

  function changePriority(value: string) {
    const next = value === '' ? null : (value as AlertPriority)
    if (next === priority) return
    seenIds.current = null
    setLoading(true)
    setPriority(next)
    setPage(1)
  }

  function changePage(next: number) {
    seenIds.current = null
    setLoading(true)
    setPage(next)
  }

  function refresh() {
    setLoading(true)
    setManualTick((value) => value + 1)
  }

  function handleResolved(updated: TaskAlert) {
    setResolving(null)
    setSuccess('Alerta resolvido e guardado no histórico.')
    setAlerts((current) => current.filter((alert) => alert.id !== updated.id))
    setCounts((current) => ({
      active: Math.max(0, current.active - 1),
      high: updated.priority === 'high' ? Math.max(0, current.high - 1) : current.high,
    }))
    setManualTick((value) => value + 1)
    onAlertsChanged()
  }

  function closeModal() {
    setResolving(null)
    // The alert may have changed while the modal was open (e.g. a 409): check again.
    setManualTick((value) => value + 1)
  }

  return (
    <section className="alerts-page" aria-labelledby="alerts-title">
      <header className="alerts-heading">
        <div>
          <h1 id="alerts-title">Alertas</h1>
          <p>Tarefas atrasadas ou em risco. A lista atualiza sozinha a cada 30 segundos.</p>
        </div>

        <div className="alerts-heading-actions">
          {checkedAt && <span className="alerts-checked">Verificado às {formatClock(checkedAt)}</span>}
          <Button variant="secondary" loading={loading} loadingText="A atualizar..." onClick={refresh}>
            Atualizar
          </Button>
        </div>
      </header>

      <div className="alerts-toolbar">
        <div className="alerts-tabs" role="group" aria-label="Estado dos alertas">
          <button type="button" aria-pressed={status === 'active'} onClick={() => changeStatus('active')}>
            Ativos ({counts.active})
          </button>
          <button type="button" aria-pressed={status === 'resolved'} onClick={() => changeStatus('resolved')}>
            Histórico
          </button>
        </div>

        {status === 'active' && (
          <p className="alerts-summary" role="status">
            {counts.high > 0 ? (
              <strong>{counts.high === 1 ? '1 alerta de prioridade alta' : `${counts.high} alertas de prioridade alta`}</strong>
            ) : (
              'Sem alertas de prioridade alta'
            )}
          </p>
        )}

        <label className="alerts-priority-filter">
          <span>Prioridade</span>
          <select value={priority ?? ''} onChange={(event) => changePriority(event.target.value)}>
            <option value="">Todas</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
          </select>
        </label>
      </div>

      {error && <Message type="error">{error}</Message>}
      {success && <Message type="success">{success}</Message>}

      {!loading && !error && alerts.length === 0 && (
        <div className="alerts-empty" role="status">
          <h2>{status === 'active' ? 'Nenhum alerta ativo' : 'Ainda não há alertas resolvidos'}</h2>
          <p>
            {status === 'active'
              ? 'Todas as tarefas estão dentro do horário. Os novos alertas aparecem aqui automaticamente.'
              : 'Os alertas resolvidos, à mão ou automaticamente, ficam guardados aqui.'}
          </p>
        </div>
      )}

      <ul className="alert-list">
        {alerts.map((alert) => {
          const classes = [
            'alert-card',
            alert.active ? `alert-card-${alert.priority}` : 'alert-card-resolved',
            newIds.has(alert.id) && 'alert-card-new',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <li key={alert.id} className={classes}>
              <div className="alert-card-header">
                <span className={`alert-priority alert-priority-${alert.priority}`}>
                  {priorityLabels[alert.priority]}
                </span>
                <strong>{alertTypeLabels[alert.type]}</strong>
                {newIds.has(alert.id) && <span className="alert-new">Novo</span>}
                <span className="alert-time">
                  {alert.active && checkedAt ? openFor(alert.detectedAt, checkedAt) : formatDateTime(alert.detectedAt)}
                </span>
              </div>

              <p className="alert-reason">{alert.reason}</p>

              <dl className="alert-details">
                <div>
                  <dt>Apartamento</dt>
                  <dd>{alert.property?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt>Prestador</dt>
                  <dd>{alert.provider?.name ?? 'Sem prestador atribuído'}</dd>
                </div>
                <div>
                  <dt>Tarefa</dt>
                  <dd>
                    {alert.task
                      ? `#${alert.task.id} · ${taskTypeLabels[alert.task.type] ?? alert.task.type}${alert.task.available ? '' : ' (cancelada)'}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Janela</dt>
                  <dd>{taskWindow(alert)}</dd>
                </div>
              </dl>

              {alert.active ? (
                <div className="alert-actions">
                  <p className="alert-next">
                    <strong>Próximo passo:</strong> {actionLabels[alert.action]}
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSuccess('')
                      setResolving(alert)
                    }}
                  >
                    Resolver
                  </Button>
                </div>
              ) : (
                <p className="alert-resolution">
                  {alert.resolution ? resolutionLabels[alert.resolution] : 'Resolvido'}
                  {alert.resolvedAt && ` · ${formatDateTime(alert.resolvedAt)}`}
                  {alert.resolvedBy && ` · ${alert.resolvedBy.name}`}
                  {alert.resolutionNote && (
                    <>
                      <br />
                      Motivo: {alert.resolutionNote}
                    </>
                  )}
                </p>
              )}
            </li>
          )
        })}
      </ul>

      {lastPage > 1 && (
        <div className="alerts-pagination">
          <Button variant="secondary" disabled={loading || page <= 1} onClick={() => changePage(page - 1)}>
            Anterior
          </Button>
          <span>
            Página {page} de {lastPage}
          </span>
          <Button variant="secondary" disabled={loading || page >= lastPage} onClick={() => changePage(page + 1)}>
            Seguinte
          </Button>
        </div>
      )}

      {resolving && (
        <ResolveAlertModal
          alert={resolving}
          onClose={closeModal}
          onResolved={handleResolved}
          onSessionExpired={onSessionExpired}
        />
      )}
    </section>
  )
}