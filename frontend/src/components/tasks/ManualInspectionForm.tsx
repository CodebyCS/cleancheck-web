import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../../api'
import { Button } from '../Button'
import { Message } from '../Message'
import { listBookings } from '../../services/bookings'
import type { Booking } from '../../services/bookings'
import { createManualInspection, listTasks } from '../../services/tasks'
import type { TaskSummary } from '../../services/tasks'
import { taskWindow } from '../../utils/taskWindow'
import { fieldErrors } from '../../services/validation'
import { listProperties } from '../../services/properties'
import type { Property } from '../../services/properties'
import { DEFAULT_TIMEZONE } from '../../utils/timezones'

type Props = {
  onCreated: () => void
}

function bookingDate(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'data indisponível'
    : new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short' }).format(date)
}

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function datePartsInTimezone(date: Date, timezone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  }
}

function isBeforeInspectionDeadline(
  booking: Booking,
  property: Property,
): boolean {
  const checkIn = new Date(booking.effective.checkIn)
  if (Number.isNaN(checkIn.getTime())) return false

  const timezone = property.timezone || DEFAULT_TIMEZONE
  const checkInParts = datePartsInTimezone(checkIn, timezone)
  const nowParts = datePartsInTimezone(new Date(), timezone)
  const [hour, minute] = taskWindow(
    null,
    property.default_check_in_time,
  ).end.split(':').map(Number)

  const deadline = Date.UTC(
    checkInParts.year,
    checkInParts.month - 1,
    checkInParts.day,
    hour,
    minute,
  )
  const now = Date.UTC(
    nowParts.year,
    nowParts.month - 1,
    nowParts.day,
    nowParts.hour,
    nowParts.minute,
    nowParts.second,
  )

  return deadline >= now
}

function inspectionBookingIds(tasks: TaskSummary[]): Set<number> {
  return new Set(
    tasks
      .filter((task) => task.type === 'checkin_inspection')
      .map((task) => task.booking_id),
  )
}

export function ManualInspectionForm({ onCreated }: Props) {
  const [properties, setProperties] = useState<Property[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [propertyId, setPropertyId] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [loadingError, setLoadingError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    let active = true

    listProperties('active')
      .then((items) => {
        if (active) setProperties(items)
      })
      .catch((error: unknown) => {
        if (active) setLoadingError(errorMessage(error))
      })
      .finally(() => {
        if (active) setPropertiesLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function handlePropertyChange(nextPropertyId: string) {
    setPropertyId(nextPropertyId)
    setBookings([])
    setBookingId('')
    setLoadingError('')
    setSubmitError('')
    setSuccess('')
    setBookingsLoading(nextPropertyId !== '')
  }

  useEffect(() => {
    const numericPropertyId = Number(propertyId)
    const selectedProperty = properties.find(
      (property) => property.id === numericPropertyId,
    )

    if (!propertyId || !selectedProperty) return

    let active = true

    Promise.all([
      listBookings(numericPropertyId),
      listTasks({ propertyId: numericPropertyId }),
      listTasks({ propertyId: numericPropertyId, showDeleted: true }),
    ])
      .then(([bookingItems, activeTasks, deletedTasks]) => {
        if (!active) return

        const existingInspectionIds = inspectionBookingIds([
          ...activeTasks,
          ...deletedTasks,
        ])

        setBookings(
          bookingItems.filter(
            (booking) =>
              booking.status === 'reserved'
              && !existingInspectionIds.has(booking.id)
              && isBeforeInspectionDeadline(booking, selectedProperty),
          ),
        )
      })
      .catch((error: unknown) => {
        if (active) setLoadingError(errorMessage(error))
      })
      .finally(() => {
        if (active) setBookingsLoading(false)
      })

    return () => {
      active = false
    }
  }, [propertyId, properties])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!bookingId) return

    setSubmitting(true)
    setSubmitError('')
    setSuccess('')

    try {
      const task = await createManualInspection(Number(bookingId))
      setSuccess(`Inspeção #${task.id} criada para a reserva #${bookingId}.`)
      setBookingId('')
      onCreated()
    } catch (error) {
      const validation = fieldErrors(error)
      setSubmitError(validation.booking_id ?? errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setIsOpen(true)
          setSubmitError('')
          setSuccess('')
        }}
      >
        Criar inspeção
      </Button>

      {isOpen && (
        <div
          className="manual-inspection-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false)
          }}
        >
          <section
            className="manual-inspection-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-inspection-title"
          >
            <header className="manual-inspection-modal-header">
              <div>
                <h3 id="manual-inspection-title">Criar inspeção manual</h3>
                <p>
                  Selecione um imóvel e uma reserva ativa. A API valida se o prazo
                  permite criar a inspeção.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                Fechar
              </Button>
            </header>

            {propertiesLoading && (
              <Message type="info">A carregar imóveis...</Message>
            )}
            {loadingError && <Message type="error">{loadingError}</Message>}
            {submitError && <Message type="error">{submitError}</Message>}
            {success && <Message type="success">{success}</Message>}

            <form onSubmit={(event) => void handleSubmit(event)}>
              <label htmlFor="inspection-property">Imóvel</label>
              <select
                id="inspection-property"
                value={propertyId}
                disabled={propertiesLoading || submitting}
                onChange={(event) => handlePropertyChange(event.target.value)}
                required
              >
                <option value="">Selecione um imóvel</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>

              <label htmlFor="inspection-booking">Reserva ativa</label>
              <select
                id="inspection-booking"
                value={bookingId}
                disabled={
                  !propertyId ||
                  bookingsLoading ||
                  submitting ||
                  bookings.length === 0
                }
                onChange={(event) => setBookingId(event.target.value)}
                required
              >
                <option value="">
                  {bookingsLoading
                    ? 'A carregar reservas...'
                    : bookings.length === 0
                      ? 'Não há reservas elegíveis para inspeção neste imóvel'
                      : 'Selecione uma reserva'}
                </option>

                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    Reserva #{booking.id} · check-in{' '}
                    {bookingDate(booking.effective.checkIn)} · checkout{' '}
                    {bookingDate(booking.effective.checkOut)}
                  </option>
                ))}
              </select>

              <Button
                type="submit"
                loading={submitting}
                disabled={!bookingId || submitting}
              >
                Criar inspeção
              </Button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}