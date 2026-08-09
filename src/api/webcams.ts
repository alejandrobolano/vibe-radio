import type { WebcamDirectory } from '../domain/webcam'
import { fetchWithTimeout } from '../utils/http'

function isWebcamDirectory(value: unknown): value is WebcamDirectory {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const directory = value as Record<string, unknown>
  return typeof directory.total === 'number' && Number.isFinite(directory.total) && Array.isArray(directory.webcams) && directory.webcams.every(isWebcam) && typeof directory.refreshedAt === 'string'
}

function isWebcam(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const webcam = value as Record<string, unknown>
  return typeof webcam.id === 'number' && typeof webcam.title === 'string' && typeof webcam.imageUrl === 'string' && webcam.imageUrl.startsWith('https://')
}

export async function getBadalonaWebcams(signal?: AbortSignal) {
  const response = await fetchWithTimeout('/api/webcams/badalona', { signal }, 10_000)
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok || !isWebcamDirectory(payload)) throw new Error('No pudimos cargar las cámaras de Badalona ahora mismo.')
  return payload
}
