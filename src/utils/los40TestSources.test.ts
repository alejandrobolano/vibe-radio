import { describe, expect, it } from 'vitest'
import { getLos40TestSources, isDevelopmentHost } from './los40TestSources'

describe('getLos40TestSources', () => {
  it.each([
    ['Los40.mp3', 'LOS40AAC.aac'],
    ['LOS40_CLASSIC.mp3', 'LOS40_CLASSICAAC.aac'],
    ['LOS40_URBAN.mp3', 'LOS40_URBANAAC.aac'],
    ['LOS40_DANCE.mp3', 'LOS40_DANCEAAC.aac'],
  ])('maps %s to its TDTChannels AAC alternative', (mp3Filename, aacFilename) => {
    const sources = getLos40TestSources(`https://playerservices.streamtheworld.com/api/livestream-redirect/${mp3Filename}`)

    expect(sources?.aac).toBe(`https://playerservices.streamtheworld.com/api/livestream-redirect/${aacFilename}`)
  })

  it('rejects unrelated sources', () => {
    expect(getLos40TestSources('https://example.com/LOS40.mp3')).toBeNull()
    expect(getLos40TestSources('https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3')).toBeNull()
  })
})

describe('isDevelopmentHost', () => {
  it('keeps the test out of production', () => {
    expect(isDevelopmentHost('dev.viberadio.net')).toBe(true)
    expect(isDevelopmentHost('viberadio-dev.alejandrobolano.workers.dev')).toBe(true)
    expect(isDevelopmentHost('viberadio.net')).toBe(false)
    expect(isDevelopmentHost('viberadio.alejandrobolano.workers.dev')).toBe(false)
  })
})
