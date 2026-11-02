import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Message } from '../components/Message'
import { listActiveServiceProviders } from '../services/serviceProviders'
import type { ServiceProvider } from '../services/serviceProviders'
import { assignTask, getTask, listTasks } from '../services/tasks'
import type { TaskDetail, TaskSummary } from '../services/tasks'
import { fieldErrors } from '../services/validation'
import './TasksPage.css'

type Props = { onSessionExpired: () => void }
type Confirmation = { taskId: number; providerId: number; providerName: string }

function requestError(error: unknown, onSessionExpired: () => void): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status === 401) {
      onSessionExpired()
      return 'A sessão terminou. Inicie sessão novamente.'
    }
    if (status === 403) return 'Não tem permissão para esta operação.'
    if (status === 404) return 'A tarefa já não está disponível. Atualize a lista.'
    if (status === 422) {
      const fields = fieldErrors(error)
      return fields.service_provider_id ?? fields.status ?? 'A atribuição não é permitida para esta tarefa ou prestador.'
    }
  }
  if (error instanceof Error && !axios.isAxiosError(error)) return error.message
  return errorMessage(error)
}

function dateLabel(value: string | null): string {
  if (!value) return 'Não definida'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Data inválida'
    : new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function typeLabel(value: string): string {
  if (value === 'checkout_cleaning') return 'Limpeza após checkout'
  if (value === 'checkin_inspection') return 'Inspeção antes do check-in'
  return value
}

export function TasksPage({ onSessionExpired }: Props) {
  const [tasks, setTasks] = useState<TaskSummary[]>([])
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<TaskDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [providerId, setProviderId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      const [nextTasks, nextProviders] = await Promise.all([
        listTasks(),
        listActiveServiceProviders(),
      ])
      setTasks(nextTasks)
      setProviders(nextProviders)
    } catch (error) {
      setListError(requestError(error, onSessionExpired))
    } finally {
      setLoading(false)
    }
  }, [onSessionExpired])

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh() }, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  async function openTask(id: number) {
    setSelectedId(id)
    setDetail(null)
    setDetailError('')
    setProviderId('')
    setSaveError('')
    setConfirmation(null)
    setDetailLoading(true)
    try {
      setDetail(await getTask(id))
    } catch (error) {
      setDetailError(requestError(error, onSessionExpired))
      if (axios.isAxiosError(error) && error.response?.status === 404) void refresh()
    } finally {
      setDetailLoading(false)
    }
  }

  async function refreshDetail() {
    if (selectedId === null) return
    setDetailLoading(true)
    setDetailError('')
    try {
      setDetail(await getTask(selectedId))
    } catch (error) {
      setDetailError(requestError(error, onSessionExpired))
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setDetail(null)
        void refresh()
      }
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!detail || !providerId) return
    const selectedProvider = providers.find((provider) => provider.id === Number(providerId))
    if (!selectedProvider) {
      setSaveError('Selecione um prestador ativo.')
      return
    }
    setSaving(true)
    setSaveError('')
    setConfirmation(null)
    try {
      const result = await assignTask(detail.id, selectedProvider.id)
      if (result.id !== detail.id || result.service_provider_id !== selectedProvider.id) {
        throw new Error('A API não confirmou a atribuição esperada.')
      }
      setConfirmation({
        taskId: result.id,
        providerId: result.service_provider_id,
        providerName: selectedProvider.name,
      })
      setProviderId('')

    } catch (error) {
      setSaveError(requestError(error, onSessionExpired))
      return
    } finally {
      setSaving(false)
    }
    // A confirmação vem do PATCH; uma falha nos GET não desfaz a atribuição.
    await Promise.allSettled([refresh(), refreshDetail()])
  }

  return (
    <section className="tasks-page">
      <div className="tasks-heading">
        <h2>Tarefas</h2>
        <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>Atualizar</Button>
      </div>
      {confirmation && <Message type="success">A API confirmou a atribuição da tarefa #{confirmation.taskId} a {confirmation.providerName} (prestador #{confirmation.providerId}).</Message>}
      {loading && <Message type="info">A carregar tarefas e prestadores...</Message>}
      {listError && <Message type="error">{listError} <button type="button" onClick={() => void refresh()}>Tentar novamente</button></Message>}
      {!loading && !listError && tasks.length === 0 && (
        detailError
          ? <Message type="error">{detailError} <button type="button" onClick={() => { void Promise.allSettled([refresh(), refreshDetail()]) }}>Tentar novamente</button></Message>
          : <Message type="info">Ainda não existem tarefas.</Message>
      )}
      {!loading && !listError && tasks.length > 0 && (
        <div className="tasks-layout">
          <div>
            <h3>Lista</h3>
            <ul className="tasks-list">
              {tasks.map((task) => (
                <li key={task.id}>
                  <button type="button" className="task-item" aria-current={selectedId === task.id ? 'true' : undefined}
                    onClick={() => void openTask(task.id)}>
                    <strong>{task.property ?? 'Imóvel sem nome'}</strong>
                    <span>{typeLabel(task.type)} · {dateLabel(task.scheduled_start_at)}</span>
                    <span>Estado: {task.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="task-detail">
            <h3>Detalhe</h3>
            {selectedId === null && <p>Selecione uma tarefa para ver o detalhe e atribuir um prestador.</p>}
            {detailLoading && <Message type="info">A carregar detalhe...</Message>}
            {detailError && <Message type="error">{detailError} <button type="button" onClick={() => void refreshDetail()}>Tentar novamente</button></Message>}
            {detail && !detailLoading && (
              <>
                <dl className="task-fields">
                  <dt>Imóvel</dt><dd>{detail.property ?? 'Imóvel sem nome'}</dd>
                  <dt>Morada</dt><dd>{detail.address ?? 'Não disponível'}</dd>
                  <dt>Tipo</dt><dd>{typeLabel(detail.type)}</dd>
                  <dt>Estado</dt><dd>{detail.status}</dd>
                  <dt>Data</dt><dd>{dateLabel(detail.scheduled_start_at)}</dd>
                  <dt>Prazo</dt><dd>{dateLabel(detail.scheduled_end_at)}</dd>
                  <dt>Início real</dt><dd>{dateLabel(detail.started_at)}</dd>
                  <dt>Conclusão real</dt><dd>{dateLabel(detail.completed_at)}</dd>
                </dl>
                <p className="task-limitation">O responsável atual e o histórico ainda não estão disponíveis nas consultas da API.</p>
                <form onSubmit={(event) => void handleAssign(event)}>
                  <label htmlFor="task-provider">Atribuir ou reatribuir a prestador ativo</label>
                  <select id="task-provider" value={providerId} required disabled={saving || providers.length === 0}
                    onChange={(event) => setProviderId(event.target.value)}>
                    <option value="">Selecione um prestador</option>
                    {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} — {provider.email}</option>)}
                  </select>
                  {providers.length === 0 && <p>Não existem prestadores ativos disponíveis.</p>}
                  {saveError && <Message type="error">{saveError}</Message>}

                  <Button type="submit" loading={saving} disabled={!providerId || providers.length === 0}>Confirmar atribuição</Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
