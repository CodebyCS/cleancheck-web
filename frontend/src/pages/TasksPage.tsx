import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Message } from '../components/Message'
import { listActiveServiceProviders } from '../services/serviceProviders'
import type { ServiceProvider } from '../services/serviceProviders'
import { assignTask, getTask, listTasks, cancelTask, completeTask, restoreTask, completeTasks } from '../services/tasks'
import type { TaskDetail, TaskSummary } from '../services/tasks'
import { fieldErrors } from '../services/validation'
import { getTaskWeekRange, shiftTaskWeek } from '../utils/taskWeek'
import { ManualInspectionForm } from '../components/tasks/ManualInspectionForm'
import { TaskWeekAgenda } from '../components/tasks/TaskWeekAgenda'
import { TaskListView } from '../components/tasks/TaskListView'
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel'
import { AssignmentWarnings } from '../components/tasks/AssignmentWarnings'
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
      const firstFieldError = Object.values(fields)[0]

      return firstFieldError ?? error.response?.data?.message ?? 'Os dados enviados não são válidos.'
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

function timeLabel(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Hora inválida'
    : new Intl.DateTimeFormat('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
}

function statusLabel(status: string): string {
  if (status === 'pending') return 'Pendente'
  if (status === 'in_progress') return 'Em curso'
  if (status === 'completed') return 'Concluída'
  if (status === 'cancelled') return 'Cancelada'

  return status
}

function typeLabel(value: string): string {
  if (value === 'checkout_cleaning') return 'Limpeza após checkout'
  if (value === 'checkin_inspection') return 'Inspeção antes do check-in'
  return value
}

export function TasksPage({ onSessionExpired }: Props) {
  const [tasks, setTasks] = useState<TaskSummary[]>([])
  const [assignmentWarningTaskIds, setAssignmentWarningTaskIds] = useState<number[]>([])
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selectedIdRef = useRef<number | null>(null)
  const detailRequestRef = useRef(0)
  const [detail, setDetail] = useState<TaskDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [providerId, setProviderId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [showCompletedOnly, setShowCompletedOnly] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(() => new Set())
  const [completingSelected, setCompletingSelected] = useState(false)
  const [taskAction, setTaskAction] = useState<'complete' | 'cancel' | 'restore' | null>(null)
  const [taskActionError, setTaskActionError] = useState('')
  const [bulkActionError, setBulkActionError] = useState('')
  const [weekAnchor, setWeekAnchor] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<'list' | 'week'>('list')
  const weekRange = getTaskWeekRange(weekAnchor)
  const weekDateFormatter = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium' })
  const weekLabel = `${weekDateFormatter.format(weekRange.start)} – ${weekDateFormatter.format(weekRange.end)}` 

  const refresh = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      const [nextTasks, nextProviders] = await Promise.all([
        listTasks({
          showDeleted,
          overdue: overdueOnly,
          ...(viewMode === 'week' ? { from: weekRange.from, to: weekRange.to } : {}),
        }),
        listActiveServiceProviders(),
      ])
      setTasks(nextTasks)
      setProviders(nextProviders)
    } catch (error) {
      setListError(requestError(error, onSessionExpired))
    } finally {
      setLoading(false)
    }
  }, [onSessionExpired, showDeleted, overdueOnly, viewMode, weekRange.from, weekRange.to])

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh() }, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setSelectedTaskIds(new Set())
  }, [showCompletedOnly, overdueOnly, showDeleted, viewMode, weekRange.from, weekRange.to])

  async function openTask(id: number) {
    selectedIdRef.current = id
    const requestId = ++detailRequestRef.current
    setSelectedId(id)
    setDetail(null)
    setDetailError('')
    setProviderId('')
    setSaveError('')
    setConfirmation(null)
    setDetailLoading(true)
    try {
      const nextDetail = await getTask(id)
      if (requestId === detailRequestRef.current && selectedIdRef.current === id) {
        setDetail(nextDetail)
        setProviderId(
          nextDetail.service_provider_id === null ? '' : String(nextDetail.service_provider_id),
        )
      }
    } catch (error) {
      if (requestId === detailRequestRef.current && selectedIdRef.current === id) {
        setDetailError(requestError(error, onSessionExpired))
        if (axios.isAxiosError(error) && error.response?.status === 404) void refresh()
      }
    } finally {
      if (requestId === detailRequestRef.current && selectedIdRef.current === id) {
        setDetailLoading(false)
      }
    }
  }

  async function refreshDetail() {
    const id = selectedIdRef.current
    if (id === null) return
    const requestId = ++detailRequestRef.current
    setDetailLoading(true)
    setDetailError('')
    try {
      const nextDetail = await getTask(id)
      if (requestId === detailRequestRef.current && selectedIdRef.current === id) {
        setDetail(nextDetail)
        setProviderId(
          nextDetail.service_provider_id === null ? '' : String(nextDetail.service_provider_id),
        )
      }
    } catch (error) {
      if (requestId === detailRequestRef.current && selectedIdRef.current === id) {
        setDetailError(requestError(error, onSessionExpired))
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setDetail(null)
          void refresh()
        }
      }
    } finally {
      if (requestId === detailRequestRef.current && selectedIdRef.current === id) {
        setDetailLoading(false)
      }
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

    } catch (error) {
      setSaveError(requestError(error, onSessionExpired))
      return
    } finally {
      setSaving(false)
    }
    // A confirmação vem do PATCH; uma falha nos GET não desfaz a atribuição.
    await Promise.allSettled([refresh(), refreshDetail()])
  }

  async function handleTaskAction(action: 'complete' | 'cancel' | 'restore') {
    if (!detail) return

    if (
      action === 'cancel'
      && !window.confirm('Tem a certeza de que pretende cancelar esta tarefa?')
    ) {
      return
    }

    setTaskAction(action)
    setTaskActionError('')

    try {
      if (action === 'complete') await completeTask(detail.id)
      if (action === 'cancel') await cancelTask(detail.id)
      if (action === 'restore') await restoreTask(detail.id)

      await Promise.allSettled([refresh(), refreshDetail()])
    } catch (error) {
      setTaskActionError(requestError(error, onSessionExpired))
    } finally {
      setTaskAction(null)
    }
  }

  const taskIdsInAssignmentReview = new Set(assignmentWarningTaskIds)

  const completedTasks = tasks.filter((task) => task.status === 'completed')

  const tasksWithinDashboardWindow = tasks.filter((task) => {
    if (task.status !== 'completed') return true

    if (task.missing_evidence) return true
    if (!task.completed_at) return true

    const completedAt = Date.parse(task.completed_at)
    if (!Number.isFinite(completedAt)) return true

    return currentTime - completedAt <= 30 * 60 * 1000
  })

  const tasksForCurrentView = showCompletedOnly
    ? completedTasks
    : tasksWithinDashboardWindow

  const tasksInCurrentList = tasksForCurrentView.filter(
    (task) => !taskIdsInAssignmentReview.has(task.id),
  )

  function isTaskSelectable(task: TaskSummary): boolean {
    return task.status === 'pending'
      || task.status === 'in_progress'
      || (task.status === 'completed' && task.missing_evidence)
  }

  function toggleTaskSelection(id: number) {
    const task = tasksInCurrentList.find((item) => item.id === id)
    if (!task || !isTaskSelectable(task)) return

    setSelectedTaskIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllVisibleTasks() {
    const selectableIds = tasksInCurrentList
      .filter(isTaskSelectable)
      .map((task) => task.id)

    if (selectableIds.length === 0) return

    const allSelected = selectableIds.every((id) => selectedTaskIds.has(id))

    setSelectedTaskIds((current) => {
      const next = new Set(current)

      if (allSelected) {
        selectableIds.forEach((id) => next.delete(id))
      } else {
        selectableIds.forEach((id) => next.add(id))
      }

      return next
    })
  }

  async function handleCompleteSelected(acceptMissingEvidence = false) {
    const selectedTasks = tasksInCurrentList.filter((task) =>
      selectedTaskIds.has(task.id)
      && (
        task.status === 'pending'
        || task.status === 'in_progress'
        || (task.status === 'completed' && task.missing_evidence)
      ),
    )

    if (selectedTasks.length === 0) return

    const missingEvidenceTasks = selectedTasks.filter(
      (task) => task.status === 'completed' && task.missing_evidence,
    )

    if (missingEvidenceTasks.length > 0 && !acceptMissingEvidence) {
      const taskNames = missingEvidenceTasks
        .map((task) => `Tarefa #${task.id} — ${task.property ?? 'Imóvel sem nome'}`)
        .join('\n')

      const confirmed = window.confirm(
        `Estas tarefas foram concluídas sem evidência:\n\n${taskNames}\n\nAceitar a conclusão sem evidência?`,
      )

      if (!confirmed) return

      return handleCompleteSelected(true)
    }

    setCompletingSelected(true)
    setBulkActionError('')

    try {
      await completeTasks(
        selectedTasks.map((task) => task.id),
        missingEvidenceTasks.length > 0 && acceptMissingEvidence,
      )
      setSelectedTaskIds(new Set())
      await Promise.allSettled([refresh(), refreshDetail()])
    } catch (error) {
      setBulkActionError(requestError(error, onSessionExpired))
    } finally {
      setCompletingSelected(false)
    }
  }

  return (
    <section className="tasks-page" aria-labelledby="tasks-title">
      <header className="tasks-heading">
        <div>
          <h1 id="tasks-title">Tarefas</h1>
          <p>Acompanhe as limpezas e inspeções da operação.</p>
        </div>

        <div className="tasks-actions">
          <Button
            variant="secondary"
            onClick={() => void refresh()}
            disabled={loading}
          >
            {loading ? 'A atualizar...' : 'Atualizar'}
          </Button>

          <ManualInspectionForm onCreated={() => void refresh()} />
        </div>
      </header>

      <div className="tasks-toolbar">
        <fieldset className="task-filters">
          <legend>Filtrar tarefas</legend>

          <label className="task-filter-option">
            <input
              type="checkbox"
              checked={showCompletedOnly}
              onChange={(event) => setShowCompletedOnly(event.target.checked)}
            />
            <span>Concluídas</span>
          </label>

          <label className="task-filter-option">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(event) => setOverdueOnly(event.target.checked)}
            />
            <span>Atrasadas</span>
          </label>

          <label className="task-filter-option">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(event) => setShowDeleted(event.target.checked)}
            />
            <span>Mostrar apagadas</span>
          </label>
        </fieldset>

        <div
          className="task-view-controls"
          role="group"
          aria-label="Apresentação das tarefas"
        >
          <button
            type="button"
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            Lista
          </button>

          <button
            type="button"
            aria-pressed={viewMode === 'week'}
            onClick={() => setViewMode('week')}
          >
            Semana
          </button>
        </div>
      </div>

      {viewMode === 'week' && (
        <div className="task-week-controls">
          <strong>{weekLabel}</strong>

          <div className="tasks-actions">
            <Button
              variant="secondary"
              onClick={() =>
                setWeekAnchor(shiftTaskWeek(weekAnchor, -1))
              }
            >
              Anterior
            </Button>

            <Button
              variant="secondary"
              onClick={() => setWeekAnchor(new Date())}
            >
              Hoje
            </Button>

            <Button
              variant="secondary"
              onClick={() =>
                setWeekAnchor(shiftTaskWeek(weekAnchor, 1))
              }
            >
              Seguinte
            </Button>
          </div>
        </div>
      )}

      <AssignmentWarnings refreshToken={tasks} onOpenTask={(id) => void openTask(id)} onSessionExpired={onSessionExpired} onTaskIdsChange={setAssignmentWarningTaskIds}/>

      {confirmation && <Message type="success">A API confirmou a atribuição da tarefa #{confirmation.taskId} a {confirmation.providerName} (prestador #{confirmation.providerId}).</Message>}

      {bulkActionError && <Message type="error">{bulkActionError}</Message>}

      <div className="tasks-actions mb-1">
        <Button
          variant="secondary"
          onClick={toggleSelectAllVisibleTasks}
          disabled={completingSelected || !tasksInCurrentList.some(isTaskSelectable)}
        >
          {tasksInCurrentList
            .filter(isTaskSelectable)
            .every((task) => selectedTaskIds.has(task.id))
            ? 'Desmarcar todas'
            : 'Selecionar todas'}
        </Button>

        {selectedTaskIds.size > 0 && (
          <>
            <Button
              onClick={() => void handleCompleteSelected()}
              loading={completingSelected}
              disabled={completingSelected}
            >
              Concluir selecionadas ({selectedTaskIds.size})
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSelectedTaskIds(new Set())}
              disabled={completingSelected}
            >
              Limpar seleção
            </Button>
          </>
        )}
      </div>

      {loading && <Message type="info">A carregar tarefas e prestadores...</Message>}
      {listError && <Message type="error">{listError} <button type="button" onClick={() => void refresh()}>Tentar novamente</button></Message>}
      {viewMode === 'list' && !loading && !listError && tasks.length === 0 && (
        detailError
          ? <Message type="error">{detailError} <button type="button" onClick={() => { void Promise.allSettled([refresh(), refreshDetail()]) }}>Tentar novamente</button></Message>
          : <Message type="info">Ainda não existem tarefas.</Message>
      )}
      {!loading && !listError && (viewMode === 'week' || tasks.length > 0) && (
        <div className={viewMode === 'week' ? 'tasks-layout tasks-layout-week' : 'tasks-layout'}>
          
          <div>
            {viewMode === 'list' ? (
              tasksInCurrentList.length === 0 ? (
                <Message type="info">
                  {tasks.length > 0
                    ? 'As tarefas que precisam de revisão aparecem apenas em “Atribuições a rever”.'
                    : 'Não há tarefas para mostrar.'}
                </Message>
              ) : (
                <TaskListView
                  tasks={tasksInCurrentList}
                  selectedId={selectedId}
                  onOpenTask={(id) => void openTask(id)}
                  dateLabel={dateLabel}
                  statusLabel={statusLabel}
                  typeLabel={typeLabel}
                  selectedTaskIds={selectedTaskIds}
                  onToggleTaskSelection={toggleTaskSelection}
                />
              )
            ) : (
              <TaskWeekAgenda
                tasks={tasksInCurrentList}
                weekStart={weekRange.start}
                selectedId={selectedId}
                onOpenTask={(id) => void openTask(id)}
                timeLabel={timeLabel}
                dateLabel={dateLabel}
                statusLabel={statusLabel}
                typeLabel={typeLabel}
                selectedTaskIds={selectedTaskIds}
                onToggleTaskSelection={toggleTaskSelection}
              />
            )}
          </div>

          <TaskDetailPanel
            selectedId={selectedId}
            detail={detail}
            detailLoading={detailLoading}
            detailError={detailError}
            onRetryDetail={() => void refreshDetail()}
            dateLabel={dateLabel}
            typeLabel={typeLabel}
            taskActionError={taskActionError}
            taskAction={taskAction}
            onTaskAction={(action) => void handleTaskAction(action)}
            saving={saving}
            providers={providers}
            providerId={providerId}
            onProviderChange={setProviderId}
            saveError={saveError}
            onAssign={(event) => void handleAssign(event)}
          />
        </div>
      )}
    </section>
  )
}