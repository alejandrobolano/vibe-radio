import { describe, expect, it } from 'vitest'
import { getStationRouteFromPath, getStationShortId, getStationUrl, stationRouteMatchesStation } from './stationUrl'

describe('station URLs', () => {
  const station = {
    stationuuid: '7a3a3989-8f26-44f7-9ae5-fa91e5cf4f9d',
    countrycode: 'FR',
    name: 'RMC FR',
  }

  it('creates a readable and unique URL', () => {
    expect(getStationUrl(station)).toBe('/radio/fr/rmc-fr-7a3a3989')
  })

  it('parses the country, slug and stable identifier', () => {
    expect(getStationRouteFromPath(getStationUrl(station))).toEqual({ type: 'friendly', countryCode: 'FR', slug: 'rmc-fr', shortId: '7a3a3989' })
  })

  it('creates deterministic identifiers for curated stations', () => {
    expect(getStationShortId('verified-wrma-ritmo-957')).toBe(getStationShortId('verified-wrma-ritmo-957'))
    expect(getStationShortId('verified-wrma-ritmo-957')).toHaveLength(8)
  })

  it('detects whether the route belongs to a playing station', () => {
    expect(stationRouteMatchesStation(getStationRouteFromPath(getStationUrl(station)), station)).toBe(true)
    expect(stationRouteMatchesStation({ type: 'legacy', stationUuid: station.stationuuid }, station)).toBe(true)
    expect(stationRouteMatchesStation(getStationRouteFromPath('/radio/fr/otra-radio-12345678'), station)).toBe(false)
  })
})
