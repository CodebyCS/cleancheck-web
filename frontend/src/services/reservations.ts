import axios from 'axios'
import { api, errorMessage } from '../api'

export type ReservationStatus = 'reserved' | 'blocked' | 'cancelled' | 'unknown'

export type IcalWarning = {
  uid: string | null
  code: string
  message: string
}

export type IcalEvent = {
  externalUid: string
  checkIn: string
  checkOut: string
  nights: number
  status: ReservationStatus
  sequence: number | null
  reservationUrl: string | null
  rawSummary: string | null
}

export type IcalReadResult = {
  propertyId: number
  channel: string
  events: IcalEvent[]
  warnings: IcalWarning[]
}

export type ImportedBooking = {
  bookingId: number
  externalUid: string
  checkIn: string
  checkOut: string
  nights: number
  status: ReservationStatus
}

export type NotImportedEvent = {
  externalUid: string
  checkIn: string
  checkOut: string
  status: ReservationStatus
  rawSummary: string | null
}

export type IcalImportResult = {
  propertyId: number
  channel: string
  created: ImportedBooking[]
  existing: ImportedBooking[]
  ambiguous: NotImportedEvent[]
  skipped: NotImportedEvent[]
  warnings: IcalWarning[]
}

function buildForm(file: File, propertyId: number): FormData {
  const form = new FormData()
  form.append('file', file)
  form.append('property_id', String(propertyId))
  return form
}

export async function previewIcal(file: File, propertyId: number): Promise<IcalReadResult> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<IcalReadResult>(
    '/api/reservations/ical/read',
    buildForm(file, propertyId),
  )
  return response.data
}

export async function importIcal(file: File, propertyId: number): Promise<IcalImportResult> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<IcalImportResult>(
    '/api/reservations/ical/import',
    buildForm(file, propertyId),
  )
  return response.data
}

export function icalErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.status === 422) {
    const message = error.response.data?.error?.message
    if (typeof message === 'string') {
      return message
    }
  }
  return errorMessage(error)
}