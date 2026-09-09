const TDT_CHANNELS_RADIO_URL = 'https://www.tdtchannels.com/lists/radio.json'

const AAC_BY_MP3_CHANNEL: Readonly<Record<string, string>> = {
  LOS40: 'LOS40AAC.aac',
  LOS40_CLASSIC: 'LOS40_CLASSICAAC.aac',
  LOS40_URBAN: 'LOS40_URBANAAC.aac',
  LOS40_DANCE: 'LOS40_DANCEAAC.aac',
}

export type Los40TestSources = {
  mp3: string
  aac: string
  attributionUrl: string
}

export function getLos40TestSources(streamUrl: string): Los40TestSources | null {
  try {
    const url = new URL(streamUrl)
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'playerservices.streamtheworld.com') return null

    const filename = url.pathname.split('/').filter(Boolean).at(-1) ?? ''
    const channel = filename.replace(/\.mp3$/i, '').toUpperCase()
    const aacFilename = AAC_BY_MP3_CHANNEL[channel]
    if (!aacFilename) return null

    return {
      mp3: `https://playerservices.streamtheworld.com/api/livestream-redirect/${filename}`,
      aac: `https://playerservices.streamtheworld.com/api/livestream-redirect/${aacFilename}`,
      attributionUrl: TDT_CHANNELS_RADIO_URL,
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
