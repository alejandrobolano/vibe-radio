import { useEffect, useState } from 'react'
import { WEBCAM_FRAME_REFRESH_INTERVAL } from '../domain/webcam'

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

    setFrameUrl(sourceUrl)
    setFrameRevision(0)
    setLastChangedAt(null)

    const refresh = async () => {
      if (inFlight) return
      inFlight = true
      setChecking(true)

      try {
        const response = await fetch(sourceUrl, { cache: 'no-store', signal: controller.signal })
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
        if (active) setChecking(false)
      }
    }

    void refresh()
    const interval = window.setInterval(() => void refresh(), WEBCAM_FRAME_REFRESH_INTERVAL)

    return () => {
      active = false
      controller.abort()
      window.clearInterval(interval)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [sourceUrl])

  return { frameUrl, frameRevision, checking, lastChangedAt }
}
