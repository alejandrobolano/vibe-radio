import { describe, expect, it } from 'vitest'
import { createCitySeo, createCountrySeo, createMomentSeo, createStationSeo, createWebcamsSeo, findStation, parseCityRoute, parseCountryRoute, parseMomentRoute, parseStationRoute } from './seo.js'

const station = {
  id: '7a3a3989',
  slug: 'rmc-fr',
  name: 'RMC FR',
  country: 'France',
  countrycode: 'FR',
  state: 'Paris',
  language: 'French',
  tags: 'news,talk',
  favicon: 'https://example.com/logo.png',
  homepage: 'https://example.com',
}

describe('Worker station SEO', () => {
  it('parses friendly station routes', () => {
    expect(parseStationRoute('/radio/fr/rmc-fr-7a3a3989')).toEqual({ countryCode: 'fr', slug: 'rmc-fr', shortId: '7a3a3989' })
    expect(parseStationRoute('/radio/fr/invalid')).toBeNull()
  })

  it('matches the route against its catalog record', () => {
    const route = parseStationRoute('/radio/fr/rmc-fr-7a3a3989')
    expect(findStation([station], route)).toEqual(station)
    expect(findStation([station], { ...route, slug: 'other' })).toBeNull()
  })

  it('creates canonical metadata and escaped fallback content', () => {
    const seo = createStationSeo({ ...station, name: 'RMC <France>' })
    expect(seo.canonicalUrl).toBe('https://viberadio.net/radio/fr/rmc-fr-7a3a3989')
    expect(seo.title).toContain('RMC <France>')
    expect(seo.initialContent).toContain('RMC &lt;France&gt;')
    expect(seo.jsonLd).toContain('BreadcrumbList')
    expect(seo.jsonLd).toContain('ListenAction')
    expect(seo.jsonLd).toContain('/pais/francia')
  })

  it('creates country hub metadata and a station list', () => {
    expect(parseCountryRoute('/pais/francia')).toBe('francia')
    const seo = createCountrySeo({ name: 'Francia', slug: 'francia', stationCount: 1, stations: [station] })
    expect(seo.canonicalUrl).toBe('https://viberadio.net/pais/francia')
    expect(seo.jsonLd).toContain('CollectionPage')
    expect(seo.initialContent).toContain('/radio/fr/rmc-fr-7a3a3989')
  })

  it('creates hierarchical city metadata with local breadcrumbs', () => {
    expect(parseCityRoute('/pais/espana/ibiza')).toEqual({ countrySlug: 'espana', citySlug: 'ibiza' })
    const seo = createCitySeo({ name: 'Ibiza', slug: 'ibiza', region: 'Ibiza', countryName: 'España', countrySlug: 'espana', countryCode: 'ES', stationCount: 12, stations: [{ ...station, countrycode: 'ES' }], relatedCities: [] })
    expect(seo.canonicalUrl).toBe('https://viberadio.net/pais/espana/ibiza')
    expect(seo.jsonLd).toContain('CollectionPage')
    expect(seo.jsonLd).toContain('City')
  })

  it('only parses closed moment-shaped routes and creates their collections', () => {
    expect(parseMomentRoute('/momento/trabajar')).toBe('trabajar')
    expect(parseMomentRoute('/momentos')).toBeNull()
    const seo = createMomentSeo({ slug: 'trabajar', name: 'Radio para trabajar', description: 'Emisoras tranquilas para concentrarse.', stationCount: 12, stations: [station] })
    expect(seo.canonicalUrl).toBe('https://viberadio.net/momento/trabajar')
    expect(seo.jsonLd).toContain('ItemList')
    expect(seo.initialContent).toContain('RMC FR')
  })

  it('creates indexable metadata for the Badalona webcams page', () => {
    const seo = createWebcamsSeo()
    expect(seo.canonicalUrl).toBe('https://viberadio.net/camaras/badalona')
    expect(seo.jsonLd).toContain('CollectionPage')
    expect(seo.jsonLd).toContain('Badalona')
    expect(seo.initialContent).toContain('Cámaras de Badalona')
  })
})
