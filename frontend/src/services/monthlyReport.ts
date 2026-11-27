import { api } from '../api'

// "apurado": calculated from completed services and adjustments. It is not a payment status.
export type SettlementStatus = 'apurado'

export type ReportTotal = {
  currency: string
  services: number
  original_total: string
  adjustments_total: string
  total: string
}

export type ReportEntry = {
  id: number
  task_id: number
  service_date: string
  property_id: number
  property_name: string | null
  task_type: string
  amount_source: string
  amount: string
  adjustments_total: string
  final_amount: string
  currency: string
}

export type ReportProvider = {
  service_provider_id: number
  name: string | null
  totals: ReportTotal[]
  entries: ReportEntry[]
}

export type MonthlyReport = {
  month: string
  period: { from: string; to: string }
  status: SettlementStatus
  totals: ReportTotal[]
  providers: ReportProvider[]
}

export type MonthlyReportFilters = {
  month: string
  serviceProviderId?: string
}

function params(filters: MonthlyReportFilters): Record<string, string> {
  const result: Record<string, string> = { month: filters.month }
  if (filters.serviceProviderId) result.service_provider_id = filters.serviceProviderId
  return result
}

export async function getMonthlyReport(filters: MonthlyReportFilters): Promise<MonthlyReport> {
  const response = await api.get<{ data: MonthlyReport }>('/api/reports/monthly', { params: params(filters) })
  return response.data.data
}

// Time to keep the temporary download URL alive.
const DOWNLOAD_URL_LIFETIME_MS = 60_000

// Downloads the CSV with the session cookie (a plain link would not send the auth headers).
export async function downloadMonthlyReportCsv(filters: MonthlyReportFilters): Promise<void> {
  const response = await api.get<Blob>('/api/reports/monthly/export', {
    params: params(filters),
    responseType: 'blob',
  })

  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio-mensal-${filters.month}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Some browsers start the download asynchronously, so the URL is released later, not right after the click.
  window.setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME_MS)
}
