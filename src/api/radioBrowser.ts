import type { Country, Region, Station, StationFilters, StationPage, TrackMetadata } from '../types'
import { getStationShortId, slugifyStation } from '../utils/stationUrl'
import { normalizeCountryList, normalizeRegionList, normalizeStationList, normalizeTrackMetadata } from '../domain/station'
import { fetchWithTimeout } from '../utils/http'

const API_URL = 'https://de1.api.radio-browser.info/json'
const headers = { 'User-Agent': 'VibeRadio/1.0' }
const PAGE_SIZE = 24
const COUNTRIES_PER_PAGE = 6
const STATIONS_PER_COUNTRY = 4

const CONTINENTS: Record<string, Set<string>> = {
  africa: new Set('DZ AO BJ BW BF BI CV CM CF TD KM CD CG CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW'.split(' ')),
  asia: new Set('AF AM AZ BH BD BT BN KH CN CY GE IN ID IR IQ IL JP JO KZ KW KG LA LB MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE'.split(' ')),
  europe: new Set('AL AD AT BY BE BA BG HR CZ DK EE FI FR DE GR VA HU IS IE IT LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB'.split(' ')),
  north_america: new Set('AG BS BB BZ CA CR CU DM DO SV GD GT HT HN JM MX NI PA KN LC VC TT US'.split(' ')),
  south_america: new Set('AR BO BR CL CO EC GY PY PE SR UY VE'.split(' ')),
  oceania: new Set('AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU'.split(' ')),
}

export const RITMO_957: Station = {
  stationuuid: 'verified-wrma-ritmo-957',
  name: 'Ritmo 95.7 · Cubatón y Más',
  url_resolved: 'https://liveaudio.lamusica.com/MIA_WRMA_icy',
  homepage: 'https://www.lamusica.com/stations/wrma',
  favicon: 'https://www.lamusica.com/favicon.ico',
  tags: 'cubatón,reggaetón,latin,spanish',
  country: 'The United States Of America',
  countrycode: 'US',
  state: 'Florida · Miami',
  language: 'Spanish',
  codec: 'AAC',
  bitrate: 0,
  votes: 0,
  clickcount: 0,
  email: 'ritmo957@sbsinteractive.com',
  phone: '+1 305 550 9595',
  address: '7007 NW 77th Ave, Miami, FL 33166',
  instagram: 'https://www.instagram.com/957miami',
  facebook: 'https://www.facebook.com/957miami',
}

const matchesContinent = (station: Station, continent: string) => !continent || CONTINENTS[continent]?.has(station.countrycode.toUpperCase())

export const countryBelongsToContinent = (countryCode: string, continent: string) => !continent || CONTINENTS[continent]?.has(countryCode.toUpperCase())

const matchesRitmo = (term: string) => ['ritmo', 'wrma', '95.7', 'cubaton', 'cubatón'].some(value => term.toLocaleLowerCase().includes(value))

export async function getCountries(signal?: AbortSignal): Promise<Country[]> {
  const response = await fetchWithTimeout(`${API_URL}/countries?hidebroken=true&order=name`, { headers, signal })
  if (!response.ok) throw new Error('No se pudo cargar la lista de países.')
  return normalizeCountryList(await response.json())
}

export async function getRegions(countryName: string, signal?: AbortSignal): Promise<Region[]> {
  if (!countryName) return []
  const response = await fetchWithTimeout(`${API_URL}/states/${encodeURIComponent(countryName)}?hidebroken=true&order=name`, { headers, signal })
  if (!response.ok) return []
  return normalizeRegionList(await response.json())
}

export async function getStationByUuid(stationUuid: string, signal?: AbortSignal): Promise<Station | null> {
  if (stationUuid === RITMO_957.stationuuid) return RITMO_957
  const response = await fetchWithTimeout(`${API_URL}/stations/byuuid/${encodeURIComponent(stationUuid)}`, { headers, signal })
  if (!response.ok) throw new Error('No se pudo cargar esta emisora.')
  const stations = normalizeStationList(await response.json())
  return stations[0] ?? null
}

export async function getStationBySlug(countryCode: string, slug: string, shortId: string | null, signal?: AbortSignal): Promise<Station | null> {
  if (countryCode === 'US' && slug === slugifyStation(RITMO_957.name) && (!shortId || shortId === getStationShortId(RITMO_957.stationuuid))) return RITMO_957
  const guessedName = slug.replace(/-/g, ' ')
  const params = new URLSearchParams({ name: guessedName, limit: '100', hidebroken: 'true', order: 'clickcount', reverse: 'true' })
  if (countryCode !== 'ONLINE') { params.set('countrycode', countryCode); params.set('countrycodeExact', 'true') }
  const response = await fetchWithTimeout(`${API_URL}/stations/search?${params}`, { headers, signal })
  if (!response.ok) throw new Error('No se pudo cargar esta emisora.')
  const stations = normalizeStationList(await response.json())
  const slugMatches = stations.filter(station => slugifyStation(station.name) === slug)
  if (shortId) return slugMatches.find(station => getStationShortId(station.stationuuid) === shortId) ?? null
  return slugMatches.length === 1 ? slugMatches[0] : null
}

export async function getStationsPage(term: string, filters: StationFilters, page: number, signal?: AbortSignal): Promise<StationPage> {
  const continentOnly = filters.continent && !filters.countryCode
  const requestSize = continentOnly ? STATIONS_PER_COUNTRY : PAGE_SIZE
  const params = new URLSearchParams({
    limit: String(requestSize),
    offset: String(continentOnly ? 0 : page * requestSize),
    hidebroken: 'true',
    order: 'clickcount',
    reverse: 'true',
  })
  if (filters.countryCode) { params.set('countrycode', filters.countryCode); params.set('countrycodeExact', 'true') }
  if (filters.region) { params.set('state', filters.region); params.set('stateExact', 'true') }
  const trimmed = term.trim()
  const continentCodes = continentOnly ? [...CONTINENTS[filters.continent]].slice(page * COUNTRIES_PER_PAGE, (page + 1) * COUNTRIES_PER_PAGE) : []
  const countryParams = continentOnly ? continentCodes.map(countryCode => { const next = new URLSearchParams(params); next.set('countrycode', countryCode); next.set('countrycodeExact', 'true'); return next }) : [params]
  const urls = countryParams.flatMap(baseParams => trimmed
    ? ['name', 'tag'].map(field => { const next = new URLSearchParams(baseParams); next.set(field, trimmed); return `${API_URL}/stations/search?${next}` })
    : [`${API_URL}/stations/search?${baseParams}`])
  const responses = await Promise.all(urls.map(url => fetchWithTimeout(url, { headers, signal })))
  if (responses.every(response => !response.ok)) throw new Error('La búsqueda no está disponible ahora mismo.')
  const lists = await Promise.all(responses.map(response => response.ok ? response.json() : []))
  const unique = new Map<string, Station>()
  normalizeStationList(lists.flat()).filter(station => matchesContinent(station, filters.continent)).forEach(station => unique.set(station.stationuuid, station))
  if (page === 0 && matchesRitmo(trimmed) && (!filters.countryCode || filters.countryCode === 'US') && (!filters.continent || filters.continent === 'north_america')) {
    for (const [uuid, station] of unique) {
      if (station.homepage?.includes('/stations/wrma') || station.name.toLocaleLowerCase().includes('ritmo 95.7')) unique.delete(uuid)
    }
    unique.set(RITMO_957.stationuuid, RITMO_957)
  }
  const ordered = [...unique.values()].sort((a, b) => Number(b.stationuuid === RITMO_957.stationuuid) - Number(a.stationuuid === RITMO_957.stationuuid))
  const hasMore = continentOnly
    ? (page + 1) * COUNTRIES_PER_PAGE < CONTINENTS[filters.continent].size
    : lists.some(list => list.length === requestSize)
  return { stations: ordered.slice(0, PAGE_SIZE), hasMore }
}

export async function getPopularStationsByCountry(countryCode: string, excludeStationUuid: string, signal?: AbortSignal): Promise<Station[]> {
  const normalizedCountryCode = countryCode.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalizedCountryCode)) return []

  const params = new URLSearchParams({
    countrycode: normalizedCountryCode,
    countrycodeExact: 'true',
    hidebroken: 'true',
    order: 'clickcount',
    reverse: 'true',
    limit: '12',
  })
  const response = await fetchWithTimeout(`${API_URL}/stations/search?${params}`, { headers, signal })
  if (!response.ok) throw new Error('No se pudieron cargar las emisoras recomendadas.')

  return normalizeStationList(await response.json())
    .filter(station => station.stationuuid !== excludeStationUuid)
    .slice(0, 4)
}

export function registerStationClick(stationUuid: string) {
  if (stationUuid.startsWith('verified-')) return
  void fetchWithTimeout(`${API_URL}/url/${encodeURIComponent(stationUuid)}`, { headers }, 5_000).catch(() => undefined)
}

function isSuccessfulVote(value: unknown) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const result = value as Record<string, unknown>
  return result.ok === true || result.ok === 'true'
}

export async function voteForStation(stationUuid: string, signal?: AbortSignal) {
  if (stationUuid.startsWith('verified-')) throw new Error('Esta emisora no pertenece al directorio de votación.')
  const response = await fetchWithTimeout(`${API_URL}/vote/${encodeURIComponent(stationUuid)}`, { headers, signal }, 8_000)
  if (!response.ok || !isSuccessfulVote(await response.json())) throw new Error('No se pudo registrar el voto ahora mismo.')
}

export async function getNowPlaying(stationUuid: string, signal?: AbortSignal): Promise<TrackMetadata | null> {
  const response = await fetchWithTimeout(`/api/now-playing/${encodeURIComponent(stationUuid)}`, { signal }, 8_000)
  if (!response.ok) return null
  return normalizeTrackMetadata(await response.json())
}
