const STREAM_THE_WORLD_HOST = 'playerservices.streamtheworld.com'
const CHANNEL_PATTERN = /^[a-z0-9_-]{2,80}$/i

export type StreamTheWorldSources = {
  mp3: string
  shoutcast: string
}

export function getStreamTheWorldSources(streamUrl: string): StreamTheWorldSources | null {
  try {
    const url = new URL(streamUrl)
    if (url.protocol !== 'https:' || !url.hostname.toLowerCase().endsWith('.streamtheworld.com')) return null

    const rawChannel = url.pathname.split('/').filter(Boolean).at(-1) ?? ''
    const channel = decodeURIComponent(rawChannel).replace(/\.mp3$/i, '').replace(/_SC$/i, '')
    if (!CHANNEL_PATTERN.test(channel)) return null

    const baseUrl = `https://${STREAM_THE_WORLD_HOST}/api/livestream-redirect/${channel}`
    return {
      mp3: `${baseUrl}.mp3`,
      shoutcast: `${baseUrl}_SC`,
    }
  } catch {
    return null
  }
}

export function isDevelopmentHost(hostname = window.location.hostname): boolean {
  const normalizedHostname = hostname.toLowerCase()
  return normalizedHostname === 'dev.viberadio.net'
    || normalizedHostname === 'localhost'
    || normalizedHostname === '127.0.0.1'
    || /^viberadio-dev\.[a-z0-9-]+\.workers\.dev$/.test(normalizedHostname)
}
