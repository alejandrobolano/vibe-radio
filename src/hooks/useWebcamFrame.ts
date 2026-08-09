import { useEffect, useState } from 'react'

const DEFAULT_REFRESH_DELAY = 150_000
const MINIMUM_REFRESH_DELAY = 30_000
const MAXIMUM_REFRESH_DELAY = 5 * 60_000

function refreshDelay(cacheControl: string | null) {
  const seconds = Number(cacheControl?.match(/max-age=(\d+)/i)?.[1])
  if (!Number.isFinite(seconds) || seconds <= 0) return DEFAULT_REFRESH_DELAY
  return Math.min(MAXIMUM_REFRESH_DELAY, Math.max(MINIMUM_REFRESH_DELAY, seconds * 1_000))
}

async function fingerprint(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export function useWebcamFrame(sourceUrl: string) {
  const [frameUrl, setFrameUrl] = useState(sourceUrl)
  const [frameRevision, setFrameRevision] = useState(0)
  const [checking, setChecking] = useState(false)
  const [lastChangedAt, setLastChangedAt] = useState<Date | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    let inFlight = false
    let currentFingerprint = ''
    let objectUrl = ''
    let timeout: number | undefined

    setFrameUrl(sourceUrl)
    setFrameRevision(0)
    setLastChangedAt(null)

    const refresh = async () => {
      if (inFlight) return
      inFlight = true
      setChecking(true)
      let nextDelay = DEFAULT_REFRESH_DELAY

      try {
        const response = await fetch(sourceUrl, { cache: 'no-store', signal: controller.signal })
        nextDelay = refreshDelay(response.headers.get('cache-control'))
        const contentType = response.headers.get('content-type') || ''
        if (!response.ok || !contentType.startsWith('image/')) return

        const buffer = await response.arrayBuffer()
        const nextFingerprint = await fingerprint(buffer)
        if (!active || nextFingerprint === currentFingerprint) return

        currentFingerprint = nextFingerprint
        const nextObjectUrl = URL.createObjectURL(new Blob([buffer], { type: contentType }))
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        objectUrl = nextObjectUrl
        setFrameUrl(nextObjectUrl)
        setFrameRevision(current => current + 1)
        setLastChangedAt(new Date())
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
      } finally {
        inFlight = false
        if (active) {
          setChecking(false)
          timeout = window.setTimeout(() => void refresh(), nextDelay)
        }
      }
    }

    void refresh()

    return () => {
      active = false
      controller.abort()
      if (timeout !== undefined) window.clearTimeout(timeout)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [sourceUrl])

  return { frameUrl, frameRevision, checking, lastChangedAt }
}
