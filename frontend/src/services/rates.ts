import { api } from '../api'

export type RateTaskType = 'checkout_cleaning' | 'checkin_inspection'

export type Rate = {
  id: number
  // null means a general rate, used when the property has no rate of its own.
  property_id: number | null
  task_type: RateTaskType
  amount: string
  currency: string
  valid_from: string
  created_by_user_id: number | null
  created_at: string | null
}

export type RateInput = {
  property_id: number | null
  task_type: RateTaskType
  // null when the field is empty, so the API answers "Indique o valor."
  amount: number | null
  currency: string
  valid_from: string
}

export type RateFilters = {
  taskType?: RateTaskType | ''
  // A property id, 'general' for general rates only, or '' for all.
  scope?: string
}

export const rateTaskTypes: { value: RateTaskType; label: string }[] = [
  { value: 'checkout_cleaning', label: 'Limpeza após checkout' },
  { value: 'checkin_inspection', label: 'Inspeção antes do check-in' },
]

export function rateTaskTypeLabel(value: string): string {
  return rateTaskTypes.find((type) => type.value === value)?.label ?? value
}

export async function listRates(filters: RateFilters = {}): Promise<Rate[]> {
  const params: Record<string, string> = {}
  if (filters.taskType) params.task_type = filters.taskType
  if (filters.scope) params.property_id = filters.scope

  const response = await api.get<{ data: Rate[] }>('/api/rates', { params })
  return response.data.data
}

export async function createRate(input: RateInput): Promise<Rate> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<{ data: Rate }>('/api/rates', input)
  return response.data.data
}

/**
 * Ids of the rates in force today: for each scope and task type, the latest one that has already started.
 */
export function ratesInForce(rates: Rate[], today: string): Set<number> {
  const best = new Map<string, Rate>()

  for (const rate of rates) {
    if (rate.valid_from > today) continue
    const key = `${rate.property_id ?? 'general'}:${rate.task_type}`
    const current = best.get(key)

    if (!current || rate.valid_from > current.valid_from || (rate.valid_from === current.valid_from && rate.id > current.id)) {
      best.set(key, rate)
    }
  }

  return new Set([...best.values()].map((rate) => rate.id))
}
