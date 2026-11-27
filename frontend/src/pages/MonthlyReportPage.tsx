import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { Message } from '../components/Message'
import { SelectField } from '../components/SelectField'
import { downloadMonthlyReportCsv, getMonthlyReport } from '../services/monthlyReport'
import type { MonthlyReport, ReportTotal } from '../services/monthlyReport'
import { rateTaskTypeLabel } from '../services/rates'
import { amountSourceLabels } from '../services/serviceEntries'
import { listServiceProviders } from '../services/serviceProviders'
import type { ServiceProvider } from '../services/serviceProviders'
import { formatAmount, formatDate, formatSigned } from './serviceEntryFormat'
import './records.css'
import './RatesPage.css'
import './ServiceEntriesPage.css'
import './MonthlyReportPage.css'

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function servicesLabel(count: number): string {
  return `${count} ${count === 1 ? 'serviço' : 'serviços'}`
}

function TotalsLine({ totals }: { totals: ReportTotal[] }) {
  return (
    <>
      {totals.map((total) => (
        <span key={total.currency} className="report-provider-total">
          {servicesLabel(total.services)} · <strong>{formatAmount(total.total, total.currency)}</strong>
        </span>
      ))}
    </>
  )
}

export function MonthlyReportPage() {
  const [month, setMonth] = useState(currentMonth)
  const [serviceProviderId, setServiceProviderId] = useState('')
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [expanded, setExpanded] = useState<number[]>([])
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    let active = true

    listServiceProviders('all')
      .then((nextProviders) => {
        if (active) setProviders(nextProviders)
      })
      // The report still works without the provider filter names.
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    getMonthlyReport({ month, serviceProviderId })
      .then((nextReport) => {
        if (!active) return
        setReport(nextReport)
        setLoadError('')
        setUnavailable(false)
      })
      .catch((error: unknown) => {
        if (!active) return
        // 404: the API does not have the monthly report yet.
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setUnavailable(true)
          return
        }
        setLoadError(errorMessage(error))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [month, serviceProviderId])

  const providerOptions = useMemo(
    () => providers.map((provider) => ({ value: String(provider.id), label: provider.name })),
    [providers],
  )

  function toggle(providerId: number) {
    setExpanded((current) =>
      current.includes(providerId) ? current.filter((id) => id !== providerId) : [...current, providerId],
    )
  }

  async function handleExport() {
    setExporting(true)
    setExportError('')

    try {
      await downloadMonthlyReportCsv({ month, serviceProviderId })
    } catch (error) {
      setExportError(errorMessage(error))
    } finally {
      setExporting(false)
    }
  }

  const hasData = report !== null && report.providers.length > 0

  return (
    <section>
      <div className="records-toolbar">
        <div>
          <h2 className="page-title">Relatório mensal</h2>
          {report && !loading && !loadError && !unavailable && (
            <p className="record-card-meta">
              {formatDate(report.period.from)} a {formatDate(report.period.to)}
            </p>
          )}
        </div>
        <Field
          label="Mês"
          name="report-month"
          type="month"
          value={month}
          onChange={(_, value) => {
            if (!value) return
            setLoading(true)
            setExpanded([])
            setMonth(value)
          }}
        />
        <SelectField
          label="Prestador"
          name="report-provider"
          value={serviceProviderId}
          options={providerOptions}
          placeholder="Todos"
          onChange={(_, value) => {
            setLoading(true)
            setExpanded([])
            setServiceProviderId(value)
          }}
        />
        <Button
          variant="secondary"
          onClick={handleExport}
          loading={exporting}
          loadingText="A exportar..."
          disabled={loading || unavailable || !!loadError}
        >
          Exportar CSV
        </Button>
      </div>

      <p className="report-settlement-note">
        <strong>Valores apurados.</strong> Calculados a partir dos serviços concluídos e dos ajustes registados na
        Conferência. Não indicam se o pagamento foi feito: o sistema não regista pagamentos.
      </p>

      {exportError && <Message type="error">{exportError}</Message>}

      {loading ? (
        <Message type="info">A carregar relatório...</Message>
      ) : unavailable ? (
        <Message type="info">O relatório mensal ainda não está disponível nesta versão da API.</Message>
      ) : loadError ? (
        <Message type="error">{loadError}</Message>
      ) : !hasData ? (
        <Message type="info">Não há serviços apurados neste mês.</Message>
      ) : (
        <>
          <div className="review-totals">
            {report.totals.map((total) => (
              <div key={total.currency} className="review-total-card">
                <p className="review-total-label">Total apurado ({servicesLabel(total.services)})</p>
                <p className="review-total-value">{formatAmount(total.total, total.currency)}</p>
                <p className="review-total-parts">
                  Original {formatAmount(total.original_total, total.currency)} · Ajustes{' '}
                  {formatSigned(total.adjustments_total, total.currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="report-providers">
            {report.providers.map((provider) => {
              const open = expanded.includes(provider.service_provider_id)
              const detailId = `report-provider-${provider.service_provider_id}`

              return (
                <article key={provider.service_provider_id} className="report-provider">
                  <header className="report-provider-head">
                    <div>
                      <h3>{provider.name ?? `Prestador #${provider.service_provider_id}`}</h3>
                      <TotalsLine totals={provider.totals} />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => toggle(provider.service_provider_id)}
                      aria-expanded={open}
                      aria-controls={detailId}
                    >
                      {open ? 'Esconder detalhe' : 'Ver detalhe'}
                    </Button>
                  </header>

                  {open && (
                    <div id={detailId} className="rates-table-wrapper">
                      <table className="rates-table review-table">
                        <thead>
                          <tr>
                            <th scope="col">Data</th>
                            <th scope="col">Imóvel</th>
                            <th scope="col">Tipo de tarefa</th>
                            <th scope="col">Origem do valor</th>
                            <th scope="col" className="rates-amount">Original</th>
                            <th scope="col" className="rates-amount">Ajustes</th>
                            <th scope="col" className="rates-amount">Final</th>
                          </tr>
                        </thead>
                        <tbody>
                          {provider.entries.map((entry) => {
                            const adjusted = Number(entry.adjustments_total) !== 0

                            return (
                              <tr key={entry.id}>
                                <td>{formatDate(entry.service_date)}</td>
                                <td>{entry.property_name ?? `Imóvel #${entry.property_id}`}</td>
                                <td>{rateTaskTypeLabel(entry.task_type)}</td>
                                <td>{amountSourceLabels[entry.amount_source] ?? entry.amount_source}</td>
                                <td className="rates-amount">{formatAmount(entry.amount, entry.currency)}</td>
                                <td className={`rates-amount${adjusted ? ' review-adjusted' : ''}`}>
                                  {adjusted ? formatSigned(entry.adjustments_total, entry.currency) : '—'}
                                </td>
                                <td className="rates-amount review-final">
                                  {formatAmount(entry.final_amount, entry.currency)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          {provider.totals.map((total) => (
                            <tr key={total.currency} className="report-total-row">
                              <th scope="row" colSpan={4}>
                                Total ({servicesLabel(total.services)})
                              </th>
                              <td className="rates-amount">{formatAmount(total.original_total, total.currency)}</td>
                              <td className="rates-amount">{formatSigned(total.adjustments_total, total.currency)}</td>
                              <td className="rates-amount review-final">{formatAmount(total.total, total.currency)}</td>
                            </tr>
                          ))}
                        </tfoot>
                      </table>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
