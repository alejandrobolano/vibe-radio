import { describe, expect, it } from 'vitest'
import { getCityRouteFromPath, getCityUrl } from './cityUrl'

describe('city URLs', () => {
  it('creates and parses hierarchical city routes', () => {
    expect(getCityUrl('espana', 'ibiza')).toBe('/pais/espana/ibiza')
    expect(getCityRouteFromPath('/pais/espana/ibiza')).toEqual({ countrySlug: 'espana', citySlug: 'ibiza' })
  })

  it('rejects malformed routes', () => {
    expect(getCityRouteFromPath('/pais/espana')).toBeNull()
    expect(getCityRouteFromPath('/pais/../ibiza')).toBeNull()
  })
})
