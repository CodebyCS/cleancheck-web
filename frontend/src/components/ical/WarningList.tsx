import type { IcalWarning } from '../../services/reservations'
import './ical.css'

type WarningListProps = {
  warnings: IcalWarning[]
}

export function WarningList({ warnings }: WarningListProps) {
  if (warnings.length === 0) return null

  return (
    <>
      <h4>Avisos</h4>
      <ul className="ical-warnings">
        {warnings.map((warning, index) => (
          <li key={index}>
            <strong>{warning.code}</strong>
            {warning.uid && ` (${warning.uid})`}: {warning.message}
          </li>
        ))}
      </ul>
    </>
  )
}