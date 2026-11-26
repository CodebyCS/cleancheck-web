// Formatting shared by the review page and the entry detail.

export function formatDate(value: string): string {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

export function formatDateTime(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

export function formatAmount(amount: string, currency: string): string {
  const value = Number(amount)
  if (Number.isNaN(value)) return `${amount} ${currency}`

  try {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(value)
  } catch {
    return `${value.toFixed(2).replace('.', ',')} ${currency}`
  }
}

// Adjustments always show their sign, so a reduction is never read as a charge.
export function formatSigned(amount: string, currency: string): string {
  const value = Number(amount)
  if (Number.isNaN(value) || value === 0) return formatAmount(amount, currency)

  return `${value > 0 ? '+' : '-'}${formatAmount(String(Math.abs(value)), currency)}`
}
