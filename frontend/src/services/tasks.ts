import { api } from '../api'

export type TaskSummary = {
  id: number
  property: string | null
  type: string
  scheduled_start_at: string
  status: string
}

export type TaskDetail = TaskSummary & {
  address: string | null
  scheduled_end_at: string | null
  started_at: string | null
  completed_at: string | null
}

export type AssignmentResult = {
  id: number
  service_provider_id: number
  status: string
}

export async function listTasks(): Promise<TaskSummary[]> {
  const response = await api.get<TaskSummary[]>('/api/tasks')
  return response.data
}

export async function getTask(id: number): Promise<TaskDetail> {
  const response = await api.get<TaskDetail>(`/api/tasks/${id}`)
  return response.data
}

export async function assignTask(id: number, providerId: number): Promise<AssignmentResult> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.patch<AssignmentResult>(`/api/tasks/${id}`, {
    service_provider_id: providerId,
  })
  return response.data
}
