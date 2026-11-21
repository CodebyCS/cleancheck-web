import type { ReservationStatus } from '../../services/reservations'
import { formatDate, statusLabels } from '../../utils/reservationFormat'
import './ical.css'

export type ReservationRow = {
  externalUid: string
  checkIn: string
  checkOut: string
  status: ReservationStatus
  nights?: number
  rawSummary?: string | null
}

type ReservationTableProps = {
  title: string
  rows: ReservationRow[]
  showSummary?: boolean
}

export function ReservationTable({
  title,
  rows,
  showSummary = false,
}: ReservationTableProps) {
  if (rows.length === 0) return null

  return (
    <div
      className="reservation-table-scroll"
      role="region"
      aria-label={title}
      tabIndex={0}
    >
      <table className="reservation-table">
        <caption>{title}</caption>

        <thead>
          <tr>
            <th scope="col">Entrada</th>
            <th scope="col">Saída</th>
            <th scope="col">Noites</th>
            <th scope="col">Estado</th>
            {showSummary && <th scope="col">Texto original</th>}
            <th scope="col">UID</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.externalUid}>
              <td>{formatDate(row.checkIn)}</td>
              <td>{formatDate(row.checkOut)}</td>
              <td>{row.nights ?? '—'}</td>

              <td>
                <span className="reservation-status">
                  {statusLabels[row.status]}
                </span>
              </td>

              {showSummary && <td>{row.rawSummary ?? '—'}</td>}

              <td className="reservation-uid">
                {row.externalUid}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}