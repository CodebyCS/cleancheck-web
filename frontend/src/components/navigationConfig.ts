export type Page =
  | 'dashboard'
  | 'properties'
  | 'serviceProviders'
  | 'icalImport'
  | 'icalSources'
  | 'tasks'
  | 'notices'
  | 'rates'

export const pageTitles: Record<Page, string> = {
  dashboard: 'Visão geral',
  tasks: 'Tarefas',
  serviceProviders: 'Funcionários',
  properties: 'Apartamentos',
  icalImport: 'Calendário e reservas',
  icalSources: 'Fontes iCal',
  notices: 'Avisos',
  rates: 'Tarifas',
}