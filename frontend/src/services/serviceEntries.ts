import { api } from '../api'

export type ServiceEntryAdjustment = {
  id: number
  service_entry_id: number
  // Signed difference in the entry's currency: negative reduces, positive increases.
  amount: string
  reason: string
  created_by: { id: number; name: string } | null
  created_at: string | null
}

export type ServiceEntry = {
  id: number
  task_id: number
  service_provider_id: number
  service_provider_name?: string | null
  property_id: number
  property_name?: string | null
  task_type: string
  service_date: string
  // Original amount, never changed; final_amount includes the adjustments.
  amount: string
  adjustments_total: string
  final_amount: string
  currency: string
  amount_source: 'task_agreed_amount' | 'rate' | 'property_base' | string
  rate_id: number | null
  created_at: string | null
  // Only in the detail.
  adjustments?: ServiceEntryAdjustment[]
}

export type ServiceEntryTotal = {
  currency: string
  entries: number
  original_total: string
  adjustments_total: string
  total: string
}

export type ServiceEntryFilters = {
  month?: string
  serviceProviderId?: string
  propertyId?: string
}

export type ServiceEntryReview = {
  entries: ServiceEntry[]
  totals: ServiceEntryTotal[]
  tasksWithoutEntry: number[]
  // Entries matching the filters, which can be more than the ones on this page.
  count: number
}

export type AdjustmentInput = {
  // null when the field is empty, so the API answers "Indique o valor do ajuste."
  amount: number | null
  reason: string
}

export type AdjustmentResult = {
  adjustment: ServiceEntryAdjustment
  finalAmount: string
}

type ReviewResponse = {
  data: ServiceEntry[]
  meta: {
    total: number
    totals: ServiceEntryTotal[]
    tasks_without_entry: number[]
  }
}

export const amountSourceLabels: Record<string, string> = {
  task_agreed_amount: 'Valor acordado na tarefa',
  rate: 'Tarifa',
  property_base: 'Valor base do imóvel',
}

export async function listServiceEntries(filters: ServiceEntryFilters = {}): Promise<ServiceEntryReview> {
  const params: Record<string, string | number> = { per_page: 100 }
  if (filters.month) params.month = filters.month
  if (filters.serviceProviderId) params.service_provider_id = filters.serviceProviderId
  if (filters.propertyId) params.property_id = filters.propertyId

  const response = await api.get<ReviewResponse>('/api/service-entries', { params })

  return {
    entries: response.data.data,
    totals: response.data.meta.totals,
    tasksWithoutEntry: response.data.meta.tasks_without_entry,
    count: response.data.meta.total,
  }
}

export async function getServiceEntry(id: number): Promise<ServiceEntry> {
  const response = await api.get<{ data: ServiceEntry }>(`/api/service-entries/${id}`)
  return response.data.data
}

export async function createAdjustment(entryId: number, input: AdjustmentInput): Promise<AdjustmentResult> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<{ data: ServiceEntryAdjustment; meta: { final_amount: string } }>(
    `/api/service-entries/${entryId}/adjustments`,
    input,
  )

  return { adjustment: response.data.data, finalAmount: response.data.meta.final_amount }
}

// Retries the entry of a completed task, e.g. after creating the missing rate.
export async function retryServiceEntry(taskId: number): Promise<ServiceEntry> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<{ data: ServiceEntry }>(`/api/tasks/${taskId}/service-entry`)
  return response.data.data
}
