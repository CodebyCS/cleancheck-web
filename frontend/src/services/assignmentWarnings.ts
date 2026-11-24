import { api } from '../api'

export type AssignmentWarningCode =
  | 'no_default_provider'
  | 'default_provider_inactive'
  | 'unassigned'
  | 'provider_inactive'
  | 'schedule_conflict'

export type AssignmentWarning = {
  code: AssignmentWarningCode
  conflicting_task_ids?: number[]
}

export type TaskAssignmentWarning = {
  task_id: number
  type: string
  status: string
  scheduled_start_at: string | null
  scheduled_end_at: string | null
  property_id: number
  property_name: string | null
  service_provider_id: number | null
  default_service_provider_id: number | null
  warnings: AssignmentWarning[]
}

// Open tasks that need a decision from management (admin/supervisor only).
export async function listAssignmentWarnings(): Promise<TaskAssignmentWarning[]> {
  const response = await api.get<{ data: TaskAssignmentWarning[] }>('/api/tasks/assignment-warnings')
  return response.data.data
}
