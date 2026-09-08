import { describe, expect, it } from 'vitest'
import { getStreamTheWorldSources, isDevelopmentHost } from './streamTheWorld'

describe('getStreamTheWorldSources', () => {
  it('creates MP3 and Shoutcast alternatives from a redirect URL', () => {
    expect(getStreamTheWorldSources('https://playerservices.streamtheworld.com/api/livestream-redirect/Los40.mp3')).toEqual({
      mp3: 'https://playerservices.streamtheworld.com/api/livestream-redirect/Los40.mp3',
      shoutcast: 'https://playerservices.streamtheworld.com/api/livestream-redirect/Los40_SC',
    })
  })

  it('normalizes a live-node Shoutcast URL', () => {
    expect(getStreamTheWorldSources('https://20103.live.streamtheworld.com/LOS40_DANCE_SC')).toEqual({
      mp3: 'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_DANCE.mp3',
      shoutcast: 'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_DANCE_SC',
    })
  })

  it('rejects unrelated and insecure URLs', () => {
    expect(getStreamTheWorldSources('https://streamtheworld.com.example.org/LOS40_SC')).toBeNull()
    expect(getStreamTheWorldSources('http://20103.live.streamtheworld.com/LOS40_SC')).toBeNull()
  })
})

describe('isDevelopmentHost', () => {
  it('recognizes only development hosts', () => {
    expect(isDevelopmentHost('dev.viberadio.net')).toBe(true)
    expect(isDevelopmentHost('viberadio-dev.alejandrobolano.workers.dev')).toBe(true)
    expect(isDevelopmentHost('viberadio.net')).toBe(false)
    expect(isDevelopmentHost('viberadio.alejandrobolano.workers.dev')).toBe(false)
  })
})
