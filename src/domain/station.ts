import type { Country, Region, Station, TrackMetadata } from '../types'
import { getSafeHttpUrl } from '../utils/safeUrl'

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value)
const stringValue = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const numberValue = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0
const optionalString = (value: unknown) => {
  const normalized = stringValue(value)
  return normalized || undefined
}
const optionalEmail = (value: unknown) => {
  const normalized = stringValue(value)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : undefined
}
const optionalPhone = (value: unknown) => {
  const normalized = stringValue(value)
  return /^[+()\d\s.-]{5,30}$/.test(normalized) ? normalized : undefined
}
const optionalUrl = (value: unknown) => getSafeHttpUrl(value) ?? undefined
const optionalDate = (value: unknown) => {
  const normalized = stringValue(value)
  return normalized && !Number.isNaN(Date.parse(normalized)) ? new Date(normalized).toISOString() : undefined
}

export function normalizeStation(value: unknown): Station | null {
  if (!isRecord(value)) return null
  const stationuuid = stringValue(value.stationuuid)
  const name = stringValue(value.name)
  const streamUrl = getSafeHttpUrl(value.url_resolved)
  if (!stationuuid || !name || !streamUrl) return null

  return {
    stationuuid,
    name,
    url_resolved: streamUrl,
    homepage: getSafeHttpUrl(value.homepage) ?? '',
    favicon: getSafeHttpUrl(value.favicon) ?? '',
    tags: stringValue(value.tags),
    country: stringValue(value.country),
    countrycode: /^[A-Z]{2}$/.test(stringValue(value.countrycode).toUpperCase()) ? stringValue(value.countrycode).toUpperCase() : '',
    state: stringValue(value.state),
    language: stringValue(value.language),
    codec: stringValue(value.codec),
    bitrate: numberValue(value.bitrate),
    votes: numberValue(value.votes),
    clickcount: numberValue(value.clickcount),
    clicktrend: numberValue(value.clicktrend),
    hls: numberValue(value.hls),
    lastcheckok: numberValue(value.lastcheckok),
    lastchecktime_iso8601: optionalDate(value.lastchecktime_iso8601),
    lastcheckoktime_iso8601: optionalDate(value.lastcheckoktime_iso8601),
    has_extended_info: typeof value.has_extended_info === 'boolean' ? value.has_extended_info : undefined,
    email: optionalEmail(value.email),
    phone: optionalPhone(value.phone),
    address: optionalString(value.address),
    instagram: optionalUrl(value.instagram),
    facebook: optionalUrl(value.facebook),
  }
}

export function normalizeStationList(value: unknown): Station[] {
  if (!Array.isArray(value)) return []
  return value.map(normalizeStation).filter((station): station is Station => station !== null)
}

export function normalizeCountryList(value: unknown): Country[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (!isRecord(item)) return []
    const name = stringValue(item.name)
    const countryCode = stringValue(item.iso_3166_1).toUpperCase()
    if (!name || !/^[A-Z]{2}$/.test(countryCode)) return []
    return [{ name, iso_3166_1: countryCode, stationcount: numberValue(item.stationcount) }]
  })
}

export function normalizeRegionList(value: unknown): Region[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (!isRecord(item)) return []
    const name = stringValue(item.name)
    if (!name) return []
    return [{ name, country: stringValue(item.country), stationcount: numberValue(item.stationcount) }]
  })
}

export function normalizeTrackMetadata(value: unknown): TrackMetadata | null {
  if (!isRecord(value)) return null
  const title = stringValue(value.title).slice(0, 300)
  if (!title) return null
  return { title, artist: optionalString(value.artist)?.slice(0, 300), artwork: optionalUrl(value.artwork) }
}
