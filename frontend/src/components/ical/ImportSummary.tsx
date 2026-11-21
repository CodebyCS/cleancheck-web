import { Message } from '../Message'
import type { IcalImportResult } from '../../services/reservations'
import { ReservationTable } from './ReservationTable'
import { WarningList } from './WarningList'

type ImportSummaryProps = {
  data: IcalImportResult
  title?: string
}

export function ImportSummary({ data, title = 'Resultado da importação' }: ImportSummaryProps) {
  const updated = data.updated ?? []
  const cancelled = data.cancelled ?? []

  return (
    <section>
      <h3>{title}</h3>
      <Message type="success">
        {data.created.length} criadas, {updated.length} atualizadas, {cancelled.length} canceladas,{' '}
        {data.existing.length} já existentes, {data.ambiguous.length} ambíguas, {data.skipped.length} ignoradas.
      </Message>
      <ReservationTable title="Criadas" rows={data.created} />
      <ReservationTable title="Atualizadas" rows={updated} />
      <ReservationTable title="Canceladas" rows={cancelled} />
      <ReservationTable title="Já existentes" rows={data.existing} />
      <ReservationTable title="Ambíguas (não gravadas)" rows={data.ambiguous} showSummary />
      <ReservationTable title="Ignoradas (não gravadas)" rows={data.skipped} showSummary />
      <WarningList warnings={data.warnings} />
    </section>
  )
}