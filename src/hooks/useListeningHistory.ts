import { useEffect, useState } from 'react'
import { clearListeningHistory, HISTORY_UPDATED_EVENT, readListeningHistory } from '../domain/listeningHistory'

export function useListeningHistory() {
  const [entries, setEntries] = useState(readListeningHistory)

  useEffect(() => {
    const refresh = () => setEntries(readListeningHistory())
    window.addEventListener(HISTORY_UPDATED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(HISTORY_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const clear = () => clearListeningHistory()
  return { entries, clear }
}
