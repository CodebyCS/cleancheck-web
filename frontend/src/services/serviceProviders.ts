import { api } from '../api'
import type { ActiveFilter } from './properties'

export type ServiceProvider = {
  id: number
  user_id: number
  name: string
  email: string
  phone: string
  address: string | null
  postal_code: string | null
  city: string | null
  photo_url: string | null
  is_active: boolean
}

export type ServiceProviderInput = {
  name: string
  email: string
  password: string
  phone: string
  address?: string
  postal_code?: string
  city?: string
}

function activeParams(filter: ActiveFilter): { active?: number } {
  if (filter === 'active') return { active: 1 }
  if (filter === 'inactive') return { active: 0 }
  return {}
}

export async function listServiceProviders(filter: ActiveFilter = 'all'): Promise<ServiceProvider[]> {
  const response = await api.get<{ data: ServiceProvider[] }>('/api/service-providers', {
    params: activeParams(filter),
  })
  return response.data.data
}

export async function createServiceProvider(input: ServiceProviderInput): Promise<ServiceProvider> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<{ data: ServiceProvider }>('/api/service-providers', input)
  return response.data.data
}

export async function updateServiceProvider(id: number, input: ServiceProviderInput): Promise<ServiceProvider> {
  await api.get('/sanctum/csrf-cookie')

  // An empty password keeps the current one on the API side.
  const { password, ...rest } = input
  const payload = password ? input : rest

  const response = await api.put<{ data: ServiceProvider }>(`/api/service-providers/${id}`, payload)
  return response.data.data
}

export async function setServiceProviderActive(id: number, active: boolean): Promise<ServiceProvider> {
  await api.get('/sanctum/csrf-cookie')
  const action = active ? 'activate' : 'deactivate'
  const response = await api.patch<{ data: ServiceProvider }>(`/api/service-providers/${id}/${action}`)
  return response.data.data
}

export async function uploadServiceProviderPhoto(id: number, photo: File): Promise<ServiceProvider> {
  await api.get('/sanctum/csrf-cookie')
  const form = new FormData()
  form.append('photo', photo)
  const response = await api.post<{ data: ServiceProvider }>(`/api/service-providers/${id}/photo`, form)
  return response.data.data
}

export async function listActiveServiceProviders(): Promise<ServiceProvider[]> {
  const response = await api.get<{ data: ServiceProvider[] }>('/api/service-providers?active=1')
  return response.data.data
}
