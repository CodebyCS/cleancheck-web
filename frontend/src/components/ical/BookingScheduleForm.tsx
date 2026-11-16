import { useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../../api'
import { Button } from '../Button'
import { Field } from '../Field'
import { Message } from '../Message'
import { Modal } from '../Modal'
import { updateBookingSchedule } from '../../services/bookings'
import type { Booking } from '../../services/bookings'
import { fieldErrors } from '../../services/validation'
import type { FieldErrors } from '../../services/validation'
import { formatDate } from '../../utils/reservationFormat'

type BookingScheduleFormProps = {
  booking: Booking
  onClose: () => void
  onSaved: (saved: Booking) => void
}

export function BookingScheduleForm({ booking, onClose, onSaved }: BookingScheduleFormProps) {
  const [checkIn, setCheckIn] = useState(booking.overridden.checkIn ?? '')
  const [checkOut, setCheckOut] = useState(booking.overridden.checkOut ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleReset() {
    setCheckIn('')
    setCheckOut('')
    setErrors({})
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setError('')

    try {
      const saved = await updateBookingSchedule(booking.id, {
        check_in: checkIn || null,
        check_out: checkOut || null,
      })
      onSaved(saved)
    } catch (requestError) {
      const fields = fieldErrors(requestError)
      setErrors(fields)
      setError(
        fields.booking ??
          (Object.keys(fields).length > 0 ? 'Corrija os campos assinalados.' : errorMessage(requestError)),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Ajustar datas da reserva"
      subtitle={`Airbnb: ${formatDate(booking.source.checkIn)} → ${formatDate(booking.source.checkOut)}`}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleReset} disabled={saving}>
            Repor datas do Airbnb
          </Button>
          <Button type="submit" form="booking-schedule-form" loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="booking-schedule-form" onSubmit={handleSubmit} noValidate>
        {error && <Message type="error">{error}</Message>}
        <Field
          label="Entrada"
          name="check_in"
          type="date"
          value={checkIn}
          onChange={(_, value) => setCheckIn(value)}
          error={errors.check_in}
          disabled={saving}
        />
        <p className="form-hint">
          Recebida do Airbnb: {formatDate(booking.source.checkIn)}. Deixe vazio para usar esta data.
        </p>
        <Field
          label="Saída"
          name="check_out"
          type="date"
          value={checkOut}
          onChange={(_, value) => setCheckOut(value)}
          error={errors.check_out}
          disabled={saving}
        />
        <p className="form-hint">
          Recebida do Airbnb: {formatDate(booking.source.checkOut)}. Deixe vazio para usar esta data.
        </p>
        <p className="form-hint">
          O ajuste muda só o dia; a hora vem do imóvel. Não é enviado para o Airbnb e a sincronização não o apaga.
        </p>
      </form>
    </Modal>
  )
}