export type TaskWeekRange = {
  start: Date
  end: Date
  from: string
  to: string
}

function toDateParameter(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getTaskWeekRange(anchor: Date): TaskWeekRange {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())
  const daysFromMonday = (start.getDay() + 6) % 7

  start.setDate(start.getDate() - daysFromMonday)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return {
    start,
    end,
    from: toDateParameter(start),
    to: toDateParameter(end),
  }
}

export function shiftTaskWeek(anchor: Date, weeks: number): Date {
  const shifted = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())
  shifted.setDate(shifted.getDate() + weeks * 7)

  return shifted
}