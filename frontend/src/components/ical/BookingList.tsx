import { useEffect, useState } from 'react'
import { errorMessage } from '../../api'
import { Button } from '../Button'
import { Message } from '../Message'
import { isAdjusted, listBookings } from '../../services/bookings'
import type { Booking } from '../../services/bookings'
import type { Property } from '../../services/properties'
import { formatDate, statusLabels } from '../../utils/reservationFormat'
import { taskWindow } from '../../utils/taskWindow'
import { BookingScheduleForm } from './BookingScheduleForm'
import './ical.css'

type BookingListProps = {
  property: Property
  refreshKey: number
}

function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

type DateCellProps = {
  effective: string
  received: string
}

function DateCell({ effective, received }: DateCellProps) {
  return (
    <>
      {formatDate(effective)}
      {effective !== received && <div className="booking-received">Airbnb: {formatDate(received)}</div>}
    </>
  )
}

export function BookingList({ property, refreshKey }: BookingListProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [showPast, setShowPast] = useState(false)
  const [editing, setEditing] = useState<Booking | null>(null)
  const [feedback, setFeedback] = useState('')
  const [today] = useState(todayIso)

  useEffect(() => {
    let active = true

    listBookings(property.id)
      .then((items) => {
        if (!active) return
        setBookings(items)
        setError('')
      })
      .catch((requestError: unknown) => {
        if (active) setError(errorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [property.id, refreshKey, reloadKey])

  function handleSaved() {
    setEditing(null)
    setFeedback('Datas da reserva atualizadas.')
    setReloadKey((key) => key + 1)
  }

  const visible = showPast ? bookings : bookings.filter((booking) => booking.effective.checkOut >= today)
  const { start, end } = taskWindow(property.default_check_out_time, property.default_check_in_time)

  return (
    <section className="bookings-section">
      <div className="bookings-toolbar">
        <h3>Reservas do imóvel</h3>
        <label className="bookings-past">
          <input
            type="checkbox"
            checked={showPast}
            onChange={(event) => setShowPast(event.target.checked)}
          />
          Mostrar passadas
        </label>
      </div>
      <p className="record-card-meta">
        Limpeza no dia de saída, das {start} às {end} (horas do imóvel). O ajuste muda só o dia.
      </p>

      {feedback && <Message type="success">{feedback}</Message>}

      {loading ? (
        <Message type="info">A carregar reservas...</Message>
      ) : error ? (
        <Message type="error">{error}</Message>
      ) : visible.length === 0 ? (
        <Message type="info">
          {bookings.length === 0 ? 'Este imóvel ainda não tem reservas.' : 'Não há reservas por terminar.'}
        </Message>
      ) : (
        <table className="ical-table">
          <thead>
            <tr>
              <th>Entrada</th>
              <th>Saída</th>
              <th>Estado</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {visible.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <DateCell effective={booking.effective.checkIn} received={booking.source.checkIn} />
                </td>
                <td>
                  <DateCell effective={booking.effective.checkOut} received={booking.source.checkOut} />
                </td>
                <td>
                  {statusLabels[booking.status]}
                  {isAdjusted(booking) && <span className="badge badge-adjusted">Ajustada</span>}
                </td>
                <td>
                  {booking.status === 'reserved' && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setFeedback('')
                        setEditing(booking)
                      }}
                    >
                      Ajustar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <BookingScheduleForm booking={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
    </section>
  )
}