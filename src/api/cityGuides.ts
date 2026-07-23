import type { CityGuide, CityGuideSummary } from '../types'
import { fetchWithTimeout } from '../utils/http'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null
}

function isSafeText(value: unknown, maxLength = 100): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

function parseSummary(value: unknown): CityGuideSummary | null {
  const record = asRecord(value)
  if (!record || !isSafeText(record.name) || !isSafeText(record.countryName) || typeof record.slug !== 'string' || typeof record.countrySlug !== 'string' || typeof record.countryCode !== 'string' || typeof record.stationCount !== 'number') return null
  if (!/^[a-z0-9-]+$/.test(record.slug) || !/^[a-z0-9-]+$/.test(record.countrySlug) || !/^[A-Z]{2}$/.test(record.countryCode) || !Number.isInteger(record.stationCount) || record.stationCount < 10) return null
  return {
    name: record.name,
    slug: record.slug,
    countryName: record.countryName,
    countrySlug: record.countrySlug,
    countryCode: record.countryCode,
    stationCount: record.stationCount,
  }
}

function parseGuide(value: unknown): CityGuide | null {
  const record = asRecord(value)
  const summary = parseSummary(record)
  if (!record || !summary || !isSafeText(record.region) || !Array.isArray(record.relatedCities)) return null
  return {
    ...summary,
    region: record.region,
    relatedCities: record.relatedCities.map(parseSummary).filter((item): item is CityGuideSummary => item !== null),
  }
}

async function getJson(path: string, signal?: AbortSignal) {
  const response = await fetchWithTimeout(path, { signal, headers: { Accept: 'application/json' } }, 10_000)
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
  return response.json() as Promise<unknown>
}

export async function getCityGuide(countrySlug: string, citySlug: string, signal?: AbortSignal) {
  return parseGuide(await getJson(`/api/city-guide/${encodeURIComponent(countrySlug)}/${encodeURIComponent(citySlug)}`, signal))
}

export async function getCityGuideIndex(signal?: AbortSignal) {
  const payload = await getJson('/api/city-guides', signal)
  if (!Array.isArray(payload)) return []
  return payload.map(parseSummary).filter((item): item is CityGuideSummary => item !== null)
}
