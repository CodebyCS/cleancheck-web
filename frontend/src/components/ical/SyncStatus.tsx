import type { BookingSource } from '../../services/bookingSources'
import './ical.css'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })
}

type SyncStatusProps = {
  source: BookingSource
}

export function SyncStatus({ source }: SyncStatusProps) {
  if (source.type !== 'url') return null

  const run = source.lastSync
  const lastSuccess = source.lastSuccessAt
    ? `Último sucesso: ${formatDateTime(source.lastSuccessAt)}`
    : 'Ainda sem nenhuma sincronização com sucesso.'

  if (run === null) {
    return <div className="record-card-meta">Nunca sincronizada.</div>
  }

  if (run.status === 'running') {
    return (
      <div className="source-status">
        <span className="badge badge-running">Em curso</span>
        <span className="record-card-meta">Desde {formatDateTime(run.startedAt)}</span>
      </div>
    )
  }

  if (run.status === 'failed') {
    return (
      <>
        <div className="source-status">
          <span className="badge badge-error">Falhou</span>
          <span className="record-card-meta">{formatDateTime(run.finishedAt ?? run.startedAt)}</span>
        </div>
        {run.errorMessage && <div className="source-error">{run.errorMessage}</div>}
        <div className="record-card-meta">{lastSuccess}</div>
      </>
    )
  }

  return (
    <div className="source-status">
      <span className="badge badge-success">Sincronizada</span>
      <span className="record-card-meta">
        {formatDateTime(run.finishedAt ?? run.startedAt)} · {run.createdCount} novas,{' '}
        {run.updatedCount} atualizadas, {run.cancelledCount} canceladas
      </span>
    </div>
  )
}