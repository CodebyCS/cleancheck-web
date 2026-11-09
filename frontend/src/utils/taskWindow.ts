// Mirrors the API rule in CleaningSchedule (Tasks module).
export const DEFAULT_TASK_START = '11:30'
export const DEFAULT_TASK_END = '14:30'
export const TASK_MARGIN_MINUTES = 30

function shift(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const total = (((hours * 60 + mins + minutes) % 1440) + 1440) % 1440
  const pad = (value: number) => value.toString().padStart(2, '0')

  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

// Cleaning starts 30 min after the guest leaves and ends 30 min before the next guest arrives.
// Without property hours the task uses 11:30 / 14:30.
export function taskWindow(checkOutTime: string | null, checkInTime: string | null) {
  return {
    start: checkOutTime ? shift(checkOutTime, TASK_MARGIN_MINUTES) : DEFAULT_TASK_START,
    end: checkInTime ? shift(checkInTime, -TASK_MARGIN_MINUTES) : DEFAULT_TASK_END,
  }
}
