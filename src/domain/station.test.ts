import { describe, expect, it } from 'vitest'
import { normalizeStation, normalizeStationList } from './station'

const validStation = {
  stationuuid: '7a3a3989-8f26-44f7-9ae5-fa91e5cf4f9d',
  name: 'RMC FR',
  url_resolved: 'https://example.com/stream',
  homepage: 'javascript:alert(1)',
  favicon: 'https://example.com/logo.png',
  countrycode: 'fr',
}

describe('normalizeStation', () => {
  it('normalizes trusted fields and removes an unsafe homepage', () => {
    const station = normalizeStation(validStation)
    expect(station?.countrycode).toBe('FR')
    expect(station?.homepage).toBe('')
    expect(station?.url_resolved).toBe('https://example.com/stream')
  })

  it('rejects records without a valid stream', () => {
    expect(normalizeStation({ ...validStation, url_resolved: 'javascript:alert(1)' })).toBeNull()
  })

  it('returns an empty list for corrupted persisted data', () => {
    expect(normalizeStationList({ stationuuid: 'invalid' })).toEqual([])
  })
})
