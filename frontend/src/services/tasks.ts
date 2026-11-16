import { api } from '../api'

export type TaskSummary = {
  id: number
  property: string | null
  type: string
  scheduled_start_at: string
  status: string
  booking_id: number
  service_provider_id: number | null
  service_provider: string | null
  is_overdue: boolean
  completed_at: string | null
  completed_by: string | null
  updated_at: string
  deleted_at: string | null
}

export type TaskDetail = TaskSummary & {
  property_address: string | null
  scheduled_end_at: string | null
  started_at: string | null
}

export type AssignmentResult = {
  id: number
  service_provider_id: number
  status: string
}

export type TaskListOptions = {
  showDeleted?: boolean
  from?: string
  to?: string
}

type TaskListResponse = {
  data: TaskSummary[]
  meta: {
    last_page: number
  }
}

export async function listTasks(options: TaskListOptions = {}): Promise<TaskSummary[]> {
  const params: Record<string, string | number> = {
    per_page: 100,
    ...(options.showDeleted ? { deleted: 'only' } : {}),
    ...(options.from ? { from: options.from } : {}),
    ...(options.to ? { to: options.to } : {}),
  }

  const firstResponse = await api.get<TaskListResponse>('/api/tasks', {
    params: { ...params, page: 1 },
  })

  const tasks = [...firstResponse.data.data]
  const lastPage = firstResponse.data.meta.last_page

  for (let page = 2; page <= lastPage; page += 1) {
    const response = await api.get<TaskListResponse>('/api/tasks', {
      params: { ...params, page },
    })

    tasks.push(...response.data.data)
  }

  return tasks
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