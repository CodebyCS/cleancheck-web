import { api } from '../api'
import type { ReservationStatus } from './reservations'

export type DateRange = {
  checkIn: string
  checkOut: string
}

export type Booking = {
  id: number
  propertyId: number
  bookingSourceId: number
  externalUid: string
  status: ReservationStatus
  // Dates received from Airbnb.
  source: DateRange
  // Local adjustment; null keeps the received date.
  overridden: { checkIn: string | null; checkOut: string | null }
  // What the tasks use: the adjustment when set, otherwise the received date.
  effective: DateRange
}

export type ScheduleInput = {
  check_in: string | null
  check_out: string | null
}

export async function listBookings(propertyId: number): Promise<Booking[]> {
  const response = await api.get<{ data: Booking[] }>(`/api/properties/${propertyId}/bookings`)
  return response.data.data
}

export async function updateBookingSchedule(bookingId: number, input: ScheduleInput): Promise<Booking> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.patch<{ data: Booking }>(`/api/bookings/${bookingId}/schedule`, input)
  return response.data.data
}

export function isAdjusted(booking: Booking): boolean {
  return booking.overridden.checkIn !== null || booking.overridden.checkOut !== null
}