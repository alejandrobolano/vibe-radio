const WINDY_WEBCAMS_URL = 'https://api.windy.com/webcams/api/v3/webcams'
const BADALONA_QUERY = {
  lang: 'es',
  limit: '10',
  offset: '0',
  nearby: '41.4500,2.2474,5',
  include: 'categories,images,location,player,urls',
}

function record(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function text(value, maximum = 180) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : ''
}

function number(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function safeUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

function imageUrl(images) {
  const source = record(images)
  for (const key of ['full', 'player', 'preview', 'thumbnail', 'icon']) {
    const url = safeUrl(source[key])
    if (url) return url
  }
  return ''
}

function normalizeWebcam(value) {
  const webcam = record(value)
  const images = record(webcam.images)
  const location = record(webcam.location)
  const urls = record(webcam.urls)
  const id = number(webcam.webcamId)
  const currentImage = imageUrl(images.current)
  if (id === null || !text(webcam.title) || !currentImage) return null

  return {
    id,
    title: text(webcam.title),
    status: webcam.status === 'inactive' ? 'inactive' : 'active',
    viewCount: number(webcam.viewCount) || 0,
    lastUpdatedOn: text(webcam.lastUpdatedOn, 40),
    imageUrl: currentImage,
    daylightImageUrl: imageUrl(images.daylight) || currentImage,
    location: {
      city: text(location.city, 100),
      region: text(location.region, 100),
      country: text(location.country, 100),
      latitude: number(location.latitude),
      longitude: number(location.longitude),
    },
    categories: Array.isArray(webcam.categories) ? webcam.categories.map(item => text(record(item).name, 50)).filter(Boolean).slice(0, 6) : [],
    detailUrl: safeUrl(urls.detail),
  }
}

function json(payload, status, cacheControl = 'no-store') {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function handleBadalonaWebcamsRequest(request, env) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
  if (!env.WINDY_API_KEY) return json({ error: 'Webcams service is not configured' }, 503)

  const endpoint = new URL(WINDY_WEBCAMS_URL)
  Object.entries(BADALONA_QUERY).forEach(([key, value]) => endpoint.searchParams.set(key, value))

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json', 'x-windy-api-key': env.WINDY_API_KEY },
      signal: AbortSignal.timeout(8_000),
    })
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      return json({ error: 'Webcams provider unavailable' }, 502)
    }

    const payload = record(await response.json())
    const webcams = Array.isArray(payload.webcams) ? payload.webcams.map(normalizeWebcam).filter(webcam => webcam?.status === 'active') : []
    return json(
      { total: number(payload.total) || webcams.length, webcams, refreshedAt: new Date().toISOString() },
      200,
      'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
    )
  } catch {
    return json({ error: 'Webcams provider unavailable' }, 502)
  }
}
