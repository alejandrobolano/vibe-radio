import { normalizeStation, normalizeTrackMetadata } from './station'
import type { ListeningHistoryEntry, Station, TrackMetadata } from '../types'

const STORAGE_KEY = 'vibe-radio:listening-history'
export const HISTORY_UPDATED_EVENT = 'vibe-radio:history-updated'
const MAX_ENTRIES = 100

function normalizeEntry(value: unknown): ListeningHistoryEntry | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const station = normalizeStation(record.station)
  const listenedAt = typeof record.listenedAt === 'string' && !Number.isNaN(Date.parse(record.listenedAt)) ? new Date(record.listenedAt).toISOString() : null
  if (!station || !listenedAt) return null
  const track = normalizeTrackMetadata(record.track)
  return { id: typeof record.id === 'string' ? record.id : `${station.stationuuid}-${listenedAt}`, station, listenedAt, track: track ?? undefined }
}

export function readListeningHistory(): ListeningHistoryEntry[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(stored) ? stored.map(normalizeEntry).filter((entry): entry is ListeningHistoryEntry => entry !== null).slice(0, MAX_ENTRIES) : []
  } catch { return [] }
}

function writeListeningHistory(entries: ListeningHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
    window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT))
  } catch { return }
}

function createEntry(station: Station, track?: TrackMetadata): ListeningHistoryEntry {
  const listenedAt = new Date().toISOString()
  const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${station.stationuuid}-${Date.now()}`
  return { id, station, listenedAt, track }
}

export function recordStationListen(station: Station) {
  const history = readListeningHistory()
  if (history[0]?.station.stationuuid === station.stationuuid && !history[0].track) return
  writeListeningHistory([createEntry(station), ...history])
}

export function recordTrackListen(station: Station, track: TrackMetadata) {
  const history = readListeningHistory()
  if (history[0]?.station.stationuuid === station.stationuuid && history[0].track?.title === track.title) return
  writeListeningHistory([createEntry(station, track), ...history])
}

export function clearListeningHistory() {
  writeListeningHistory([])
}
