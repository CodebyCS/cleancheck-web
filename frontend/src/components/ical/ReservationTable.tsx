import type { ReservationStatus } from '../../services/reservations'
import './ical.css'

export type ReservationRow = {
  externalUid: string
  checkIn: string
  checkOut: string
  status: ReservationStatus
  nights?: number
  rawSummary?: string | null
}

const statusLabels: Record<ReservationStatus, string> = {
  reserved: 'Reservada',
  blocked: 'Bloqueio',
  cancelled: 'Cancelada',
  unknown: 'Desconhecido',
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

type ReservationTableProps = {
  title: string
  rows: ReservationRow[]
  showSummary?: boolean
}

export function ReservationTable({ title, rows, showSummary = false }: ReservationTableProps) {
  if (rows.length === 0) return null

  return (
    <>
      <h4>{title}</h4>
      <table className="ical-table">
        <thead>
          <tr>
            <th>Entrada</th>
            <th>Saída</th>
            <th>Noites</th>
            <th>Estado</th>
            {showSummary && <th>Texto original</th>}
            <th>UID</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.externalUid}>
              <td>{formatDate(row.checkIn)}</td>
              <td>{formatDate(row.checkOut)}</td>
              <td>{row.nights ?? '—'}</td>
              <td>{statusLabels[row.status]}</td>
              {showSummary && <td>{row.rawSummary ?? '—'}</td>}
              <td>{row.externalUid}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}