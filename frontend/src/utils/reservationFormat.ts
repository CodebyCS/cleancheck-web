import type { ReservationStatus } from '../services/reservations'

export const statusLabels: Record<ReservationStatus, string> = {
  reserved: 'Reservada',
  blocked: 'Bloqueio',
  cancelled: 'Cancelada',
  unknown: 'Desconhecido',
}

// API dates are YYYY-MM-DD; shown as DD/MM/YYYY.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}