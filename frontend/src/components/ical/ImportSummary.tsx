import { Message } from '../Message'
import type { IcalImportResult } from '../../services/reservations'
import { ReservationTable } from './ReservationTable'
import { WarningList } from './WarningList'

type ImportSummaryProps = {
  data: IcalImportResult
}

export function ImportSummary({ data }: ImportSummaryProps) {
  return (
    <section>
      <h3>Resultado da importação</h3>
      <Message type="success">
        {data.created.length} criadas, {data.existing.length} já existentes,{' '}
        {data.ambiguous.length} ambíguas, {data.skipped.length} ignoradas.
      </Message>
      <ReservationTable title="Criadas" rows={data.created} />
      <ReservationTable title="Já existentes" rows={data.existing} />
      <ReservationTable title="Ambíguas (não gravadas)" rows={data.ambiguous} showSummary />
      <ReservationTable title="Ignoradas (não gravadas)" rows={data.skipped} showSummary />
      <WarningList warnings={data.warnings} />
    </section>
  )
}