import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'vibe-radio:sleep-timer'

function readStoredEndTime() {
  try {
    const value = Number(sessionStorage.getItem(STORAGE_KEY))
    return Number.isFinite(value) && value > Date.now() ? value : null
  } catch {
    return null
  }
}

export function useSleepTimer(onExpire: () => void) {
  const [endsAt, setEndsAt] = useState<number | null>(readStoredEndTime)
  const [now, setNow] = useState(Date.now)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  const cancel = useCallback(() => {
    setEndsAt(null)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      return
    }
  }, [])

  const start = useCallback((minutes: number) => {
    const nextEndTime = Date.now() + Math.max(1, minutes) * 60_000
    setNow(Date.now())
    setEndsAt(nextEndTime)
    try {
      sessionStorage.setItem(STORAGE_KEY, String(nextEndTime))
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    if (!endsAt) return
    const update = () => {
      const nextNow = Date.now()
      setNow(nextNow)
      if (nextNow < endsAt) return
      cancel()
      onExpireRef.current()
    }
    update()
    const intervalId = window.setInterval(update, 1_000)
    return () => window.clearInterval(intervalId)
  }, [cancel, endsAt])

  return {
    active: endsAt !== null,
    remainingSeconds: endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1_000)) : 0,
    start,
    cancel,
  }
}

export type SleepTimerController = ReturnType<typeof useSleepTimer>
