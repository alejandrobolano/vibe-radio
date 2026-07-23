import type { Station } from '../types'

export function slugifyStation(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
  return slug || 'radio'
}

export function getStationShortId(stationUuid: string) {
  const uuidPrefix = stationUuid.match(/^[a-f0-9]{8}/i)?.[0]
  if (uuidPrefix) return uuidPrefix.toLowerCase()
  let hash = 2166136261
  for (const character of stationUuid) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return `v${(hash >>> 0).toString(36).padStart(7, '0').slice(-7)}`
}

export function getStationUrl(station: Pick<Station, 'stationuuid' | 'countrycode' | 'name'>) {
  const country = station.countrycode?.toLowerCase() || 'online'
  return `/radio/${country}/${slugifyStation(station.name)}-${getStationShortId(station.stationuuid)}`
}

export type StationRoute =
  | { type: 'friendly'; countryCode: string; slug: string; shortId: string | null }
  | { type: 'legacy'; stationUuid: string }

export function getStationRouteFromPath(pathname: string): StationRoute | null {
  const match = pathname.match(/^\/radio\/([^/]+)(?:\/([^/]+))?\/?$/)
  if (!match) return null
  const firstPart = decodeURIComponent(match[1])
  const secondPart = match[2] ? decodeURIComponent(match[2]) : ''
  if (/^(?:[a-z]{2}|online)$/i.test(firstPart) && secondPart) {
    const idMatch = secondPart.match(/-([a-z0-9]{8})$/i)
    const shortId = idMatch?.[1].toLowerCase() ?? null
    const slug = idMatch ? secondPart.slice(0, -(idMatch[1].length + 1)) : secondPart
    return { type: 'friendly', countryCode: firstPart.toUpperCase(), slug, shortId }
  }
  return { type: 'legacy', stationUuid: firstPart }
}

export function stationRouteMatchesStation(route: StationRoute | null, station: Pick<Station, 'stationuuid' | 'countrycode' | 'name'>) {
  if (!route) return false
  if (route.type === 'legacy') return route.stationUuid === station.stationuuid

  const canonicalRoute = getStationRouteFromPath(getStationUrl(station))
  if (!canonicalRoute || canonicalRoute.type !== 'friendly') return false

  return route.countryCode === canonicalRoute.countryCode
    && route.slug === canonicalRoute.slug
    && (!route.shortId || route.shortId === canonicalRoute.shortId)
}
