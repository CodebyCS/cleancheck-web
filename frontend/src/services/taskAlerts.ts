import { api } from '../api'

export type AlertType = 'late_start' | 'deadline_at_risk'
export type AlertPriority = 'medium' | 'high'
export type AlertAction = 'contact_provider' | 'reassign_or_help'
export type AlertResolution =
  | 'task_started'
  | 'task_completed'
  | 'task_cancelled'
  | 'rescheduled'
  | 'expired'
  | 'manual'
export type AlertStatus = 'active' | 'resolved'

export type TaskAlert = {
  id: number
  type: AlertType
  priority: AlertPriority
  action: AlertAction
  reason: string
  active: boolean
  detectedAt: string
  resolvedAt: string | null
  resolution: AlertResolution | null
  resolutionNote: string | null
  resolvedBy: { id: number; name: string } | null
  task: {
    id: number
    type: string
    status: string
    scheduledStart: string | null
    scheduledEnd: string | null
    available: boolean
  } | null
  property: { id: number; name: string } | null
  provider: { id: number; name: string | null } | null
}

export type AlertCounts = { active: number; high: number }

export type TaskAlertFilters = {
  status: AlertStatus
  priority: AlertPriority | null
  page: number
}

export type TaskAlertPage = {
  alerts: TaskAlert[]
  page: number
  lastPage: number
  counts: AlertCounts
}

type TaskAlertListResponse = {
  data: TaskAlert[]
  meta: { current_page: number; last_page: number; activeCount: number; highCount: number }
}

// The API detects alerts every minute; 30 s keeps the panel at most ~90 s behind.
export const ALERT_POLL_INTERVAL_MS = 30_000

export const alertTypeLabels: Record<AlertType, string> = {
  late_start: 'Tarefa sem início',
  deadline_at_risk: 'Prazo em risco',
}

export const priorityLabels: Record<AlertPriority, string> = {
  high: 'Alta',
  medium: 'Média',
}

export const actionLabels: Record<AlertAction, string> = {
  contact_provider: 'Contactar o prestador para confirmar que está a caminho.',
  reassign_or_help: 'Enviar ajuda ou reatribuir a tarefa antes da chegada do hóspede.',
}

export const resolutionLabels: Record<AlertResolution, string> = {
  task_started: 'Resolvido: tarefa iniciada',
  task_completed: 'Resolvido: tarefa concluída',
  task_cancelled: 'Resolvido: tarefa cancelada',
  rescheduled: 'Resolvido: tarefa reagendada',
  expired: 'Expirado',
  manual: 'Resolvido manualmente',
}

export const taskTypeLabels: Record<string, string> = {
  checkout_cleaning: 'Limpeza após check-out',
  checkin_inspection: 'Inspeção antes do check-in',
}

export async function listTaskAlerts(filters: TaskAlertFilters): Promise<TaskAlertPage> {
  const params: Record<string, string | number> = { status: filters.status, page: filters.page }
  if (filters.priority) params.priority = filters.priority

  const response = await api.get<TaskAlertListResponse>('/api/task-alerts', { params })
  const { data, meta } = response.data

  return {
    alerts: data,
    page: meta.current_page,
    lastPage: meta.last_page,
    counts: { active: meta.activeCount, high: meta.highCount },
  }
}

export async function getTaskAlertCounts(): Promise<AlertCounts> {
  const result = await listTaskAlerts({ status: 'active', priority: null, page: 1 })
  return result.counts
}

export async function resolveTaskAlert(id: number, reason: string): Promise<TaskAlert> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.patch<{ data: TaskAlert }>(`/api/task-alerts/${id}/resolve`, { reason })
  return response.data.data
}