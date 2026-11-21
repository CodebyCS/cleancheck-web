import { Message } from '../Message'
import type { IcalReadResult } from '../../services/reservations'
import { ReservationTable } from './ReservationTable'
import { WarningList } from './WarningList'

type PreviewResultProps = {
  data: IcalReadResult
}

export function PreviewResult({ data }: PreviewResultProps) {
  return (
    <section>
      <h3>Pré-visualização</h3>
      <Message type="info">
        {data.events.length} eventos lidos, {data.warnings.length} avisos. Nada foi gravado.
      </Message>
      <ReservationTable title="Eventos" rows={data.events} showSummary />
      <WarningList warnings={data.warnings} />
    </section>
  )
}