import { describe, expect, it } from 'vitest'
import { getNearbyCountries } from './nearbyCountries'

describe('getNearbyCountries', () => {
  it('returns nearby countries without including the current country', () => {
    const countries = getNearbyCountries('ES')

    expect(countries.map(country => country.code)).toEqual(['PT', 'FR', 'AD', 'MA', 'IT'])
  })

  it('returns no links for an invalid or unknown country', () => {
    expect(getNearbyCountries('')).toEqual([])
    expect(getNearbyCountries('XX')).toEqual([])
  })

  it('falls back to the same continent when there is no curated group', () => {
    const countries = getNearbyCountries('AO')

    expect(countries).toHaveLength(5)
    expect(countries.some(country => country.code === 'AO')).toBe(false)
  })
})
