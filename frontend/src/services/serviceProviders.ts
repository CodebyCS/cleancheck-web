import { api } from '../api'

export type ServiceProvider = {
  id: number
  user_id: number
  name: string
  email: string
  phone: string
  is_active: boolean
}

export type ServiceProviderInput = {
  name: string
  email: string
  password: string
  phone: string
}

export async function listServiceProviders(): Promise<ServiceProvider[]> {
  const response = await api.get<{ data: ServiceProvider[] }>('/api/service-providers')
  return response.data.data
}

export async function createServiceProvider(input: ServiceProviderInput): Promise<ServiceProvider> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<{ data: ServiceProvider }>('/api/service-providers', input)
  return response.data.data
}
