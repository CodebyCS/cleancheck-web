import { api } from '../api'
import type { ReservationStatus } from './reservations'

export type NoticeType =
  | 'booking_updated'
  | 'booking_cancelled'
  | 'task_assigned'
  | 'task_unassigned'
  | 'task_cancelled'

export type BookingNotice = {
  id: number
  type: NoticeType
  read: boolean
  readAt: string | null
  notifiedAt: string
  booking: {
    id: number
    status: ReservationStatus
    checkIn: string
    checkOut: string
  }
  property: { id: number; name: string }
  // Staff notices come with task null; task notices are for providers (mobile).
  task: {
    id: number
    available: boolean
    scheduledStart: string | null
    scheduledEnd: string | null
  } | null
}

export type NoticePage = {
  notices: BookingNotice[]
  page: number
  lastPage: number
  unreadCount: number
}

type NoticeListResponse = {
  data: BookingNotice[]
  meta: { current_page: number; last_page: number; unreadCount: number }
}

export const noticeLabels: Record<NoticeType, string> = {
  booking_updated: 'Datas da reserva alteradas',
  booking_cancelled: 'Reserva cancelada',
  task_assigned: 'Tarefa atribuída',
  task_unassigned: 'Tarefa retirada',
  task_cancelled: 'Tarefa cancelada',
}

export async function listNotices(page = 1, onlyUnread = false): Promise<NoticePage> {
  const response = await api.get<NoticeListResponse>('/api/booking-notices', {
    params: onlyUnread ? { page, unread: 1 } : { page },
  })
  const { data, meta } = response.data

  return {
    notices: data,
    page: meta.current_page,
    lastPage: meta.last_page,
    unreadCount: meta.unreadCount,
  }
}

export async function markNoticeAsRead(id: number): Promise<BookingNotice> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.patch<{ data: BookingNotice }>(`/api/booking-notices/${id}/read`)
  return response.data.data
}