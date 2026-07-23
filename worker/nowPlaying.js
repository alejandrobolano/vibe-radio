const UPSTREAM_TIMEOUT_MS = 5_000
const CACHE_CONTROL = 'public, max-age=15, s-maxage=25, stale-while-revalidate=30'

const sources = Object.freeze({
  'd1a54d2e-623e-4970-ab11-35f7b56c5ec3': {
    adapter: 'icecast',
    endpoint: 'https://icecast.walmradio.com:8443/status-json.xsl',
    mount: '/classic',
    suffix: ' - Classic Vinyl on walmradio.com',
  },
  '313046e3-b203-4b9d-bc3e-393da7d97126': {
    adapter: 'icecast',
    endpoint: 'https://icecast.walmradio.com:8443/status-json.xsl',
    mount: '/otr',
    suffix: ' - WALM - Old Time Radio on walmradio.com',
  },
  'ea8059be-d119-4de3-b27b-0d9bd6aedb17': {
    adapter: 'icecast',
    endpoint: 'https://icecast.walmradio.com:8443/status-json.xsl',
    mount: '/jazz',
    suffix: ' - Adroit Jazz Underground on walmradio.com',
  },
  '83dcfac4-b3c3-4731-afc1-a80dd271dffa': {
    adapter: 'azuracast',
    endpoint: 'https://onair.armisa.it/api/nowplaying/armisa',
  },
  '78012206-1aa1-11e9-a80b-52543be04c81': {
    adapter: 'laut',
    endpoint: 'https://api.laut.fm/station/mangoradio/current_song',
  },
  '9617a958-0601-11e8-ae97-52543be04c81': {
    adapter: 'radioParadise',
    endpoint: 'https://api.radioparadise.com/api/now_playing?chan=0',
  },
})

const isRecord = value => typeof value === 'object' && value !== null && !Array.isArray(value)
const text = value => typeof value === 'string' ? value.trim() : ''
const safeUrl = value => {
  const candidate = text(value)
  if (!candidate) return undefined
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined
  } catch {
    return undefined
  }
}

function track(title, artist, artwork) {
  const normalizedTitle = text(title).slice(0, 300)
  if (!normalizedTitle) return null
  const normalizedArtist = text(artist).slice(0, 300)
  const normalizedArtwork = safeUrl(artwork)
  return {
    title: normalizedTitle,
    ...(normalizedArtist ? { artist: normalizedArtist } : {}),
    ...(normalizedArtwork ? { artwork: normalizedArtwork } : {}),
  }
}

function sourcePath(value) {
  try {
    return new URL(value).pathname
  } catch {
    return ''
  }
}

function normalizeIcecast(payload, config) {
  if (!isRecord(payload) || !isRecord(payload.icestats)) return null
  const rawSources = payload.icestats.source
  const entries = Array.isArray(rawSources) ? rawSources : [rawSources]
  const entry = entries.find(item => isRecord(item) && sourcePath(item.listenurl) === config.mount)
  if (!entry) return null

  const rawTitle = text(entry.title)
  const cleanTitle = config.suffix && rawTitle.endsWith(config.suffix)
    ? rawTitle.slice(0, -config.suffix.length).trim()
    : rawTitle
  const separator = cleanTitle.lastIndexOf(' by ')
  return separator > 0
    ? track(cleanTitle.slice(0, separator), cleanTitle.slice(separator + 4))
    : track(cleanTitle)
}

function normalizeAzuraCast(payload) {
  if (!isRecord(payload) || !isRecord(payload.now_playing) || !isRecord(payload.now_playing.song)) return null
  const song = payload.now_playing.song
  return track(song.title, song.artist, song.art)
}

function normalizeLaut(payload) {
  if (!isRecord(payload)) return null
  const artist = isRecord(payload.artist) ? payload.artist : null
  return track(payload.title, artist?.name, artist?.image)
}

function normalizeRadioParadise(payload) {
  if (!isRecord(payload)) return null
  return track(payload.title, payload.artist, payload.cover_med || payload.cover)
}

export function normalizeNowPlaying(payload, config) {
  if (!config || typeof config !== 'object') return null
  if (config.adapter === 'icecast') return normalizeIcecast(payload, config)
  if (config.adapter === 'azuracast') return normalizeAzuraCast(payload)
  if (config.adapter === 'laut') return normalizeLaut(payload)
  if (config.adapter === 'radioParadise') return normalizeRadioParadise(payload)
  return null
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

export async function handleNowPlayingRequest(request, stationUuid) {
  if (request.method !== 'GET') return json({ available: false }, 405)
  const config = sources[stationUuid]
  if (!config) return json({ available: false }, 404, 'public, max-age=300')

  try {
    const response = await fetch(config.endpoint, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'VibeRadio/1.0 (https://viberadio.net)',
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
    if (!response.ok) return json({ available: false }, 502)
    const metadata = normalizeNowPlaying(await response.json(), config)
    return metadata ? json(metadata, 200, CACHE_CONTROL) : new Response(null, {
      status: 204,
      headers: { 'Cache-Control': CACHE_CONTROL },
    })
  } catch {
    return json({ available: false }, 502)
  }
}
