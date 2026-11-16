import { api } from '../api'
import type { IcalImportResult } from './reservations'

export type SyncRunStatus = 'running' | 'success' | 'failed'

export type SyncRunSummary = {
  status: SyncRunStatus
  startedAt: string
  finishedAt: string | null
  createdCount: number
  updatedCount: number
  cancelledCount: number
  errorMessage: string | null
}

export type BookingSource = {
  id: number
  propertyId: number
  channel: string
  type: 'file' | 'url'
  url: string | null
  isActive: boolean
  lastSync: SyncRunSummary | null
  lastSuccessAt: string | null
}

export type BookingSourceChanges = {
  url?: string
  is_active?: boolean
}

// A sync downloads the calendar first, so it may take longer than the default 8 s.
const SYNC_TIMEOUT_MS = 70_000

export async function listBookingSources(propertyId: number): Promise<BookingSource[]> {
  const response = await api.get<{ data: BookingSource[] }>(
    `/api/properties/${propertyId}/booking-sources`,
  )
  return response.data.data
}

export async function createBookingSource(propertyId: number, url: string): Promise<BookingSource> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<{ data: BookingSource }>(
    `/api/properties/${propertyId}/booking-sources`,
    { url },
  )
  return response.data.data
}

export async function updateBookingSource(
  sourceId: number,
  changes: BookingSourceChanges,
): Promise<BookingSource> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.patch<{ data: BookingSource }>(
    `/api/booking-sources/${sourceId}`,
    changes,
  )
  return response.data.data
}

export async function syncBookingSource(sourceId: number): Promise<IcalImportResult> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<IcalImportResult>(
    `/api/booking-sources/${sourceId}/sync`,
    null,
    { timeout: SYNC_TIMEOUT_MS },
  )
  return response.data
}

// The export URL carries a private token in its query string, so it is never shown.
export function maskSourceUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.host}${parsed.pathname}`
  } catch {
    return 'URL inválido'
  }
}