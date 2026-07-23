import { useEffect, useState } from 'react'
import type { Station } from '../types'
import { normalizeStationList } from '../domain/station'

const STORAGE_KEY = 'vibe-radio:favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Station[]>(() => {
    try { return normalizeStationList(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')) }
    catch { return [] }
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)) }
    catch { return }
  }, [favorites])

  const toggle = (station: Station) => setFavorites(current =>
    current.some(item => item.stationuuid === station.stationuuid)
      ? current.filter(item => item.stationuuid !== station.stationuuid)
      : [station, ...current],
  )

  return { favorites, toggle, isFavorite: (uuid: string) => favorites.some(item => item.stationuuid === uuid) }
}

export type FavoritesController = ReturnType<typeof useFavorites>
