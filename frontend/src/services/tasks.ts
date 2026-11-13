import { api } from '../api'

export type TaskSummary = {
  id: number
  property: string | null
  type: string
  scheduled_start_at: string
  status: string
  deleted_at: string | null
}

export type TaskDetail = TaskSummary & {
  property_address: string | null
  scheduled_end_at: string | null
  started_at: string | null
  completed_at: string | null
}

export type AssignmentResult = {
  id: number
  service_provider_id: number
  status: string
}

export async function listTasks(showDeleted = false): Promise<TaskSummary[]> {
  const response = await api.get<{ data: TaskSummary[] }>('/api/tasks', {
    params: showDeleted ? { deleted: 'only' } : undefined,
  })

  return response.data.data
}

export async function getTask(id: number): Promise<TaskDetail> {
  const response = await api.get<{ data: TaskDetail }>(`/api/tasks/${id}`)
  return response.data.data
}

export async function assignTask(id: number, providerId: number): Promise<AssignmentResult> {
  await api.get('/sanctum/csrf-cookie')

  const response = await api.patch<{ data: AssignmentResult }>(`/api/tasks/${id}`, {
    service_provider_id: providerId,
  })

  return response.data.data
}

export async function completeTask(id: number): Promise<TaskDetail> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<{ data: TaskDetail }>(`/api/tasks/${id}/complete`)
  return response.data.data
}

export async function cancelTask(id: number): Promise<void> {
  await api.get('/sanctum/csrf-cookie')
  await api.post(`/api/tasks/${id}/cancel`)
}

export async function restoreTask(id: number): Promise<TaskDetail> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<{ data: TaskDetail }>(`/api/tasks/${id}/restore`)
  return response.data.data
}