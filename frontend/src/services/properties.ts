import { api } from '../api'

export type Property = {
  id: number
  name: string
  address: string
  postal_code: string
  city: string
  access_instructions: string | null
  is_active: boolean
}

export type PropertyInput = {
  name: string
  address: string
  postal_code: string
  city: string
  access_instructions: string
}

export async function listProperties(): Promise<Property[]> {
  const response = await api.get<{ data: Property[] }>('/api/properties')
  return response.data.data
}

export async function createProperty(input: PropertyInput): Promise<Property> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<{ data: Property }>('/api/properties', input)
  return response.data.data
}
