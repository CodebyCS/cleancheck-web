import { useEffect, useState } from 'react'

/**
 * Returns a counter that goes up every `intervalMs` while the tab is visible,
 * and right away when the user comes back to the tab.
 * Effects that depend on it fetch again on each tick.
 */
export function usePollingTick(intervalMs: number, enabled = true): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!enabled) return

    // A hidden tab does not poll: no requests while nobody is looking.
    function bump() {
      if (document.visibilityState === 'visible') setTick((value) => value + 1)
    }

    const timer = window.setInterval(bump, intervalMs)
    document.addEventListener('visibilitychange', bump)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', bump)
    }
  }, [intervalMs, enabled])

  return tick
}