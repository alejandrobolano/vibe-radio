import type { Station, TrackMetadata } from '../types'
import { getStationUrl } from './stationUrl'

export async function shareStation(station: Station, track?: TrackMetadata | null) {
  const url = new URL(getStationUrl(station), window.location.origin).href
  const text = track ? `Estoy escuchando ${track.artist ? `${track.artist} · ` : ''}${track.title} en ${station.name}` : `Estoy escuchando ${station.name} en Vibe Radio`
  if (navigator.share) {
    try { await navigator.share({ title: station.name, text, url }); return true }
    catch (cause) { if (cause instanceof Error && cause.name === 'AbortError') return false }
  }
  try { await navigator.clipboard.writeText(`${text} ${url}`); return true }
  catch { return false }
}
