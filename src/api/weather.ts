import type { WeatherSnapshot } from '../types'
import { fetchWithTimeout } from '../utils/http'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseWeather(value: unknown): WeatherSnapshot | null {
  const payload = asRecord(value)
  if (!payload || payload.available !== true || typeof payload.city !== 'string' || typeof payload.description !== 'string') return null
  if (!isFiniteNumber(payload.temperature) || !isFiniteNumber(payload.feelsLike) || !isFiniteNumber(payload.humidity) || !isFiniteNumber(payload.windSpeed) || !isFiniteNumber(payload.conditionId)) return null
  return {
    city: payload.city,
    temperature: payload.temperature,
    feelsLike: payload.feelsLike,
    humidity: payload.humidity,
    windSpeed: payload.windSpeed,
    description: payload.description,
    conditionId: payload.conditionId,
  }
}

export async function getVisitorWeather(signal?: AbortSignal) {
  const response = await fetchWithTimeout('/api/weather', {
    signal,
    headers: { Accept: 'application/json' },
  }, 7_000)
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
  return parseWeather(await response.json())
}
