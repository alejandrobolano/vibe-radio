import { useEffect, useState } from 'react'
import { getCountries, getRegions, getStationsPage } from '../api/radioBrowser'
import type { Country, Region, Station, StationFilters } from '../types'
import { setCanonicalUrl, setMetaTag } from '../utils/seo'

function readDirectoryParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    query: params.get('q') ?? '',
    filters: {
      continent: params.get('continent') ?? '',
      countryCode: (params.get('country') ?? '').toUpperCase(),
      countryName: '',
      region: params.get('region') ?? '',
    } satisfies StationFilters,
  }
}

function writeDirectoryParams(term: string, filters: StationFilters) {
  const params = new URLSearchParams()
  if (term.trim()) params.set('q', term.trim())
  if (filters.continent) params.set('continent', filters.continent)
  if (filters.countryCode) params.set('country', filters.countryCode)
  if (filters.region) params.set('region', filters.region)
  window.history.replaceState(null, '', `/${params.size ? `?${params}` : ''}`)
  setMetaTag('robots', params.size ? 'noindex,follow' : 'index,follow,max-image-preview:large')
}

function createEmptyFilters(): StationFilters {
  return { continent: '', countryCode: '', countryName: '', region: '' }
}

export function useStationDirectory() {
  const [initialParams] = useState(readDirectoryParams)
  const [stations, setStations] = useState<Station[]>([])
  const [query, setQuery] = useState(initialParams.query)
  const [searched, setSearched] = useState(initialParams.query)
  const [filters, setFilters] = useState<StationFilters>(initialParams.filters)
  const [appliedFilters, setAppliedFilters] = useState<StationFilters>(initialParams.filters)
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const hasFacet = Boolean(window.location.search)
    const title = 'Radio online en directo de todo el mundo | Vibe Radio'
    const description = 'Escucha emisoras de radio online en directo de todo el mundo. Busca por nombre, género, continente, país o región y guarda tus favoritas.'
    const canonicalUrl = setCanonicalUrl('/')
    document.title = title
    setMetaTag('description', description)
    setMetaTag('robots', hasFacet ? 'noindex,follow' : 'index,follow,max-image-preview:large')
    setMetaTag('og:title', title, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:type', 'website', true)
    setMetaTag('og:url', canonicalUrl, true)
    setMetaTag('og:site_name', 'Vibe Radio', true)
    setMetaTag('og:locale', 'es_ES', true)
    setMetaTag('twitter:card', 'summary')
    setMetaTag('twitter:title', title)
    setMetaTag('twitter:description', description)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getStationsPage(initialParams.query, initialParams.filters, 0, controller.signal),
      getCountries(controller.signal),
    ]).then(([result, countryList]) => {
      setStations(result.stations)
      setHasMore(result.hasMore)
      setCountries(countryList)
      const selectedCountry = countryList.find(country => country.iso_3166_1 === initialParams.filters.countryCode)
      if (selectedCountry) {
        setFilters(current => ({ ...current, countryName: selectedCountry.name }))
        setAppliedFilters(current => ({ ...current, countryName: selectedCountry.name }))
      }
    }).catch(cause => {
      if (cause instanceof Error && cause.name !== 'AbortError') setError(cause.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [initialParams])

  useEffect(() => {
    const controller = new AbortController()
    setRegions([])
    if (!filters.countryName) return () => controller.abort()
    setLoadingRegions(true)
    getRegions(filters.countryName, controller.signal)
      .then(result => { if (!controller.signal.aborted) setRegions(result) })
      .catch(() => undefined)
      .finally(() => { if (!controller.signal.aborted) setLoadingRegions(false) })
    return () => controller.abort()
  }, [filters.countryName])

  const loadFirstPage = async (term: string, nextFilters: StationFilters) => {
    setLoading(true)
    setError('')
    setSearched(term.trim())
    setPage(0)
    setAppliedFilters(nextFilters)
    writeDirectoryParams(term, nextFilters)
    try {
      const result = await getStationsPage(term, nextFilters, 0)
      setStations(result.stations)
      setHasMore(result.hasMore)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ha ocurrido un error inesperado.')
    } finally { setLoading(false) }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const result = await getStationsPage(searched, appliedFilters, nextPage)
      setStations(current => {
        const unique = new Map(current.map(station => [station.stationuuid, station]))
        result.stations.forEach(station => unique.set(station.stationuuid, station))
        return [...unique.values()]
      })
      setPage(nextPage)
      setHasMore(result.hasMore)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar más emisoras.')
    } finally { setLoadingMore(false) }
  }

  const resetDirectory = async () => {
    const nextFilters = createEmptyFilters()
    setQuery('')
    setSearched('')
    setFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setRegions([])
    setPage(0)
    setError('')
    setLoading(true)
    writeDirectoryParams('', nextFilters)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const result = await getStationsPage('', nextFilters, 0)
      setStations(result.stations)
      setHasMore(result.hasMore)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ha ocurrido un error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return {
    stations, query, searched, filters, appliedFilters, countries, regions, loading, loadingRegions,
    loadingMore, error, hasMore, setQuery, setFilters, loadFirstPage, loadMore, resetDirectory,
  }
}
