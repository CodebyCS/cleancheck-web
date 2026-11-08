import type { SelectOption } from '../components/SelectField'

// Same default as the API when no timezone is sent.
export const DEFAULT_TIMEZONE = 'Europe/Lisbon'

export const TIMEZONE_OPTIONS: SelectOption[] = [
  { value: 'Europe/Lisbon', label: 'Portugal continental (Europe/Lisbon)' },
  { value: 'Atlantic/Madeira', label: 'Madeira (Atlantic/Madeira)' },
  { value: 'Atlantic/Azores', label: 'Açores (Atlantic/Azores)' },
  { value: 'America/Sao_Paulo', label: 'Brasil — Brasília (America/Sao_Paulo)' },
  { value: 'America/Manaus', label: 'Brasil — Amazonas (America/Manaus)' },
  { value: 'America/Recife', label: 'Brasil — Nordeste (America/Recife)' },
  { value: 'America/Noronha', label: 'Brasil — Fernando de Noronha (America/Noronha)' },
  { value: 'Europe/Madrid', label: 'Espanha (Europe/Madrid)' },
  { value: 'Europe/London', label: 'Reino Unido (Europe/London)' },
  { value: 'Europe/Paris', label: 'França (Europe/Paris)' },
]

// Keeps a timezone saved in the API selectable even if it is not in the list above.
export function timezoneOptionsWith(current: string): SelectOption[] {
  if (!current || TIMEZONE_OPTIONS.some((option) => option.value === current)) {
    return TIMEZONE_OPTIONS
  }

  return [{ value: current, label: current }, ...TIMEZONE_OPTIONS]
}

export function timezoneLabel(value: string): string {
  return TIMEZONE_OPTIONS.find((option) => option.value === value)?.label ?? value
}
