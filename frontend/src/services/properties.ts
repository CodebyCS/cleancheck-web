import { api } from '../api'

export type Property = {
  id: number
  name: string
  address: string
  postal_code: string
  city: string
  access_instructions: string | null
  responsible_service_provider_id: number | null
  base_cleaning_amount: string | null
  default_check_in_time: string | null
  default_check_out_time: string | null
  // IANA identifier, e.g. 'Europe/Lisbon' or 'America/Sao_Paulo'
  timezone: string
  is_active: boolean
}

export type PropertyInput = {
  name: string
  address: string
  postal_code: string
  city: string
  access_instructions: string
  responsible_service_provider_id?: number | null
  base_cleaning_amount?: number | null
  default_check_in_time?: string | null
  default_check_out_time?: string | null
  timezone?: string
}

export type ActiveFilter = 'all' | 'active' | 'inactive'

function activeParams(filter: ActiveFilter): { active?: number } {
  if (filter === 'active') return { active: 1 }
  if (filter === 'inactive') return { active: 0 }
  return {}
}

export async function listProperties(filter: ActiveFilter = 'all'): Promise<Property[]> {
  const response = await api.get<{ data: Property[] }>('/api/properties', {
    params: activeParams(filter),
  })
  return response.data.data
}

export async function createProperty(input: PropertyInput): Promise<Property> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<{ data: Property }>('/api/properties', input)
  return response.data.data
}

export async function updateProperty(id: number, input: PropertyInput): Promise<Property> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.put<{ data: Property }>(`/api/properties/${id}`, input)
  return response.data.data
}

export async function setPropertyActive(id: number, active: boolean): Promise<Property> {
  await api.get('/sanctum/csrf-cookie')
  const action = active ? 'activate' : 'deactivate'
  const response = await api.patch<{ data: Property }>(`/api/properties/${id}/${action}`)
  return response.data.data
}
