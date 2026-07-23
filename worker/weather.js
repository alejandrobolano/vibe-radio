const WEATHER_TIMEOUT_MS = 5_000

function json(payload, status, cacheControl = 'private, no-store') {
  return Response.json(payload, { status, headers: { 'Cache-Control': cacheControl } })
}

function toFiniteNumber(value) {
  const number = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(number) ? number : null
}

export function getWeatherLocation(cf) {
  if (!cf || typeof cf !== 'object') return null
  const latitude = toFiniteNumber(cf.latitude)
  const longitude = toFiniteNumber(cf.longitude)
  if (latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  const city = typeof cf.city === 'string' ? cf.city.trim().slice(0, 100) : ''
  return { latitude, longitude, city }
}

export function normalizeWeatherPayload(payload, fallbackCity = '') {
  if (!payload || typeof payload !== 'object') return null
  const main = payload.main
  const weather = Array.isArray(payload.weather) ? payload.weather[0] : null
  const wind = payload.wind
  if (!main || typeof main !== 'object' || !weather || typeof weather !== 'object') return null

  const temperature = toFiniteNumber(main.temp)
  const feelsLike = toFiniteNumber(main.feels_like)
  const humidity = toFiniteNumber(main.humidity)
  const windSpeed = wind && typeof wind === 'object' ? toFiniteNumber(wind.speed) : null
  const conditionId = toFiniteNumber(weather.id)
  const description = typeof weather.description === 'string' ? weather.description.trim().slice(0, 100) : ''
  const upstreamCity = typeof payload.name === 'string' ? payload.name.trim().slice(0, 100) : ''
  const city = fallbackCity || upstreamCity

  if (temperature === null || feelsLike === null || humidity === null || windSpeed === null || conditionId === null || !description || !city) return null

  return {
    city,
    temperature: Math.round(temperature),
    feelsLike: Math.round(feelsLike),
    humidity: Math.round(humidity),
    windSpeed: Math.round(windSpeed * 10) / 10,
    description,
    conditionId: Math.round(conditionId),
  }
}

export async function handleWeatherRequest(request, env) {
  if (request.method !== 'GET') return json({ available: false }, 405)
  if (!env.OPENWEATHER_API_KEY) return json({ available: false }, 503)

  const location = getWeatherLocation(request.cf)
  if (!location) return json({ available: false }, 404)

  const endpoint = new URL('https://api.openweathermap.org/data/2.5/weather')
  endpoint.searchParams.set('lat', String(location.latitude))
  endpoint.searchParams.set('lon', String(location.longitude))
  endpoint.searchParams.set('appid', env.OPENWEATHER_API_KEY)
  endpoint.searchParams.set('units', 'metric')
  endpoint.searchParams.set('lang', 'es')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEATHER_TIMEOUT_MS)
  try {
    const response = await fetch(endpoint, { signal: controller.signal })
    if (!response.ok) return json({ available: false }, 502)
    const weather = normalizeWeatherPayload(await response.json(), location.city)
    if (!weather) return json({ available: false }, 502)
    return json({ available: true, ...weather }, 200, 'private, max-age=600')
  } catch {
    return json({ available: false }, 502)
  } finally {
    clearTimeout(timeout)
  }
}
