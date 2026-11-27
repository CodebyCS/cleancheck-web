export type Page =
  | 'dashboard'
  | 'alerts'
  | 'properties'
  | 'serviceProviders'
  | 'icalImport'
  | 'icalSources'
  | 'tasks'
  | 'notices'
  | 'rates'
  | 'checklists'
  | 'serviceEntries'
  | 'monthlyReport'

export const pageTitles: Record<Page, string> = {
  dashboard: 'Visão geral',
  alerts: 'Alertas',
  tasks: 'Tarefas',
  serviceProviders: 'Funcionários',
  properties: 'Apartamentos',
  icalImport: 'Calendário e reservas',
  icalSources: 'Fontes iCal',
  notices: 'Avisos',
  rates: 'Tarifas',
  checklists: 'Checklists',
  serviceEntries: 'Conferência',
  monthlyReport: 'Relatório mensal',
}