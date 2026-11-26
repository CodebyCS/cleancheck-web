import { useCallback, useEffect, useState } from 'react'
import { ALERT_POLL_INTERVAL_MS, getTaskAlertCounts } from '../services/taskAlerts'
import type { AlertCounts } from '../services/taskAlerts'
import { usePollingTick } from './usePollingTick'

/** Active alert counters for the navigation badge, refreshed every 30 s. */
export function useTaskAlertCounts(enabled: boolean) {
  const pollTick = usePollingTick(ALERT_POLL_INTERVAL_MS, enabled)
  const [manualTick, setManualTick] = useState(0)
  const [counts, setCounts] = useState<AlertCounts | null>(null)

  useEffect(() => {
    if (!enabled) return

    let active = true

    getTaskAlertCounts()
      .then((result) => {
        if (active) setCounts(result)
      })
      // A failed check keeps the last known counters; the next tick tries again.
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [enabled, pollTick, manualTick])

  const refresh = useCallback(() => setManualTick((value) => value + 1), [])

  return { counts, refresh }
}