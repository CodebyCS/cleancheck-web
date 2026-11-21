import type { BookingSource, SyncRunSummary } from '../../services/bookingSources'
import { isInternalSyncError, RUN_INTERRUPTED_AFTER_MS } from '../../services/bookingSources'
import './ical.css'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })
}

function formatDuration(minutes: number): string {
  return minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`
}

type RunStatusProps = {
  run: SyncRunSummary | null
  lastSuccessAt: string | null
  interrupted: boolean
}

function RunStatus({ run, lastSuccessAt, interrupted }: RunStatusProps) {
  if (run === null) {
    return <div className="record-card-meta">Nunca sincronizada.</div>
  }

  if (run.status === 'running') {
    return (
      <div className="source-status">
        <span className={interrupted ? 'badge badge-error' : 'badge badge-running'}>
          {interrupted ? 'Interrompida' : 'Em curso'}
        </span>
        <span className="record-card-meta">
          {interrupted
            ? `Começou a ${formatDateTime(run.startedAt)} e não terminou. A próxima sincronização fecha esta tentativa.`
            : `Desde ${formatDateTime(run.startedAt)}`}
        </span>
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
        <div className="record-card-meta">
          {lastSuccessAt
            ? `Último sucesso: ${formatDateTime(lastSuccessAt)}`
            : 'Ainda sem nenhuma sincronização com sucesso.'}
        </div>
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

type RecoveryHintProps = {
  source: BookingSource
  interrupted: boolean
}

function RecoveryHint({ source, interrupted }: RecoveryHintProps) {
  const failedRun = source.lastSync?.status === 'failed' ? source.lastSync : null

  if (!source.stale && !failedRun && !interrupted) return null

  const steps = ['Use "Sincronizar agora" para tentar outra vez.']

  if (failedRun && isInternalSyncError(failedRun.errorMessage)) {
    steps.push('Se o erro interno se repetir, envie à equipa técnica o número da tentativa indicado acima.')
  } else if (failedRun) {
    steps.push('Se o erro se repetir, confirme no Airbnb que o link de exportação do calendário continua ativo. Se mudou, use "Trocar link".')
  } else {
    steps.push('A sincronização automática corre a cada 30 minutos. Se o último sucesso não avança, peça à equipa técnica para confirmar que o agendador e a fila estão a correr.')
  }

  return (
    <div className="source-recovery">
      <strong>Como recuperar</strong>
      <ol>
        {steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
    </div>
  )
}

type SyncStatusProps = {
  source: BookingSource
  // When the list was loaded; used to spot runs that never finished.
  checkedAt: number
}

export function SyncStatus({ source, checkedAt }: SyncStatusProps) {
  if (source.type !== 'url') return null

  const run = source.lastSync
  const interrupted = run?.status === 'running'
    && checkedAt - Date.parse(run.startedAt) > RUN_INTERRUPTED_AFTER_MS

  return (
    <>
      {source.isActive && source.stale && (
        <div className="source-status">
          <span className="badge badge-stale">Desatualizada</span>
          <span className="record-card-meta">
            {source.lastSuccessAt
              ? `Sem sincronizar com sucesso há mais de ${formatDuration(source.staleAfterMinutes)}.`
              : 'Ainda não teve nenhuma sincronização com sucesso.'}
          </span>
        </div>
      )}
      <RunStatus run={run} lastSuccessAt={source.lastSuccessAt} interrupted={interrupted} />
      {source.isActive && <RecoveryHint source={source} interrupted={interrupted} />}
    </>
  )
}