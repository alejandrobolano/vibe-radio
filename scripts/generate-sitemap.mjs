import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'

const API_HOSTS = [
  'https://de1.api.radio-browser.info/json',
  'https://nl1.api.radio-browser.info/json',
]
const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '')
const pageSize = 5_000
const maxUrlsPerFile = 10_000
const requestTimeout = 60_000
const useExistingCatalog = process.env.USE_EXISTING_CATALOG === 'true'
const curatedStations = [{
  stationuuid: 'verified-wrma-ritmo-957',
  name: 'Ritmo 95.7 Cubatón y más',
  country: 'United States',
  countrycode: 'US',
  state: 'Miami, Florida',
  language: 'Spanish',
  tags: 'cubatón,latin,reggaeton,urban',
  favicon: 'https://www.lamusica.com/favicon.ico',
  homepage: 'https://www.lamusica.com/stations/wrma',
}]
const cityGuideSeeds = [
  { countryCode: 'AR', name: 'Buenos Aires', region: 'Buenos Aires' },
  { countryCode: 'AR', name: 'Córdoba', region: 'Córdoba' },
  { countryCode: 'AU', name: 'Sydney', region: 'Sydney NSW' },
  { countryCode: 'BR', name: 'Río de Janeiro', region: 'Rio de Janeiro' },
  { countryCode: 'BR', name: 'São Paulo', region: 'São Paulo' },
  { countryCode: 'DE', name: 'Berlín', region: 'Berlin' },
  { countryCode: 'DE', name: 'Colonia', region: 'Cologne' },
  { countryCode: 'DE', name: 'Hamburgo', region: 'Hamburg' },
  { countryCode: 'DE', name: 'Múnich', region: 'München' },
  { countryCode: 'AE', name: 'Dubái', region: 'Dubai' },
  { countryCode: 'ES', name: 'Barcelona', region: 'Barcelona' },
  { countryCode: 'ES', name: 'Ibiza', region: 'Ibiza' },
  { countryCode: 'ES', name: 'Madrid', region: 'Madrid' },
  { countryCode: 'ES', name: 'Málaga', region: 'Málaga' },
  { countryCode: 'ES', name: 'Sevilla', region: 'Sevilla' },
  { countryCode: 'ES', name: 'Valencia', region: 'Valencia' },
  { countryCode: 'FR', name: 'París', region: 'Paris' },
  { countryCode: 'GB', name: 'Londres', region: 'London' },
  { countryCode: 'GB', name: 'Manchester', region: 'Manchester' },
  { countryCode: 'GR', name: 'Atenas', region: 'Athens' },
  { countryCode: 'GR', name: 'Tesalónica', region: 'Thessaloniki' },
  { countryCode: 'IT', name: 'Milán', region: 'Milano' },
  { countryCode: 'IT', name: 'Roma', region: 'Roma' },
  { countryCode: 'MX', name: 'Ciudad de México', region: 'Ciudad de México' },
]
const minimumCityStations = 10
const momentGuideSeeds = [
  { slug: 'trabajar', name: 'Radio para trabajar', description: 'Emisoras de lofi, jazz suave y música instrumental para acompañar sesiones de trabajo o estudio.', tags: ['lofi', 'jazz', 'instrumental'] },
  { slug: 'relajarse', name: 'Radio para relajarse', description: 'Emisoras de chillout, lounge y sonidos tranquilos para descansar y desconectar.', tags: ['chillout', 'lounge', 'relax'] },
  { slug: 'entrenar', name: 'Radio para entrenar', description: 'Emisoras de dance, electrónica y grandes éxitos para mantener la energía durante el entrenamiento.', tags: ['dance', 'workout', 'fitness'] },
  { slug: 'conducir', name: 'Radio para conducir', description: 'Emisoras de pop y grandes éxitos para viajes, desplazamientos diarios y rutas por carretera.', tags: ['hits', 'pop', 'classic hits'] },
  { slug: 'dormir', name: 'Radio para dormir', description: 'Emisoras de ambient y música relajante para crear una atmósfera tranquila antes de dormir.', tags: ['ambient', 'sleep', 'relaxing'] },
  { slug: 'fiesta', name: 'Radio para fiestas', description: 'Emisoras de música latina, dance y fiesta para animar reuniones y celebraciones.', tags: ['party', 'dance', 'latin'] },
]
const minimumMomentStations = 12

if (!siteUrl) throw new Error('Define SITE_URL, por ejemplo: SITE_URL=https://viberadio.net npm run generate:sitemap')
if (!/^https:\/\//i.test(siteUrl)) throw new Error('SITE_URL debe usar https')

const slugify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80)
const shortId = value => {
  const uuidPrefix = value.match(/^[a-f0-9]{8}/i)?.[0]
  if (uuidPrefix) return uuidPrefix.toLowerCase()
  let hash = 2166136261
  for (const character of value) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619) }
  return `v${(hash >>> 0).toString(36).padStart(7, '0').slice(-7)}`
}
const escapeXml = value => value.replace(/[<>&'"]/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character])
const stationPath = station => `/radio/${(station.countrycode || 'online').toLowerCase()}/${station.slug || slugify(station.name)}-${station.id || shortId(station.stationuuid)}`
const countryDisplayNames = new Intl.DisplayNames(['es'], { type: 'region' })
const getCountry = station => {
  const code = /^[A-Z]{2}$/.test(station.countrycode) ? station.countrycode : 'XX'
  const name = code === 'XX' ? 'Emisoras online' : countryDisplayNames.of(code) || station.country || code
  return { code, name, slug: code === 'XX' ? 'online' : slugify(name) }
}
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

async function fetchStationPage(offset) {
  const query = new URLSearchParams({ hidebroken: 'true', order: 'name', limit: String(pageSize), offset: String(offset) })
  let lastError

  for (let attempt = 0; attempt < API_HOSTS.length * 2; attempt += 1) {
    const host = API_HOSTS[attempt % API_HOSTS.length]
    try {
      const response = await fetch(`${host}/stations?${query}`, {
        headers: { 'User-Agent': 'VibeRadioSitemap/2.0' },
        signal: AbortSignal.timeout(requestTimeout),
      })
      if (!response.ok) throw new Error(`${host} respondió ${response.status}`)
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) throw new Error(`${host} no devolvió JSON`)
      const stations = await response.json()
      if (!Array.isArray(stations)) throw new Error(`${host} devolvió un formato inesperado`)
      return stations
    } catch (error) {
      lastError = error
      await wait(750 * (attempt + 1))
    }
  }

  throw lastError
}

async function fetchExpectedStationCount() {
  let lastError
  for (let attempt = 0; attempt < API_HOSTS.length * 2; attempt += 1) {
    const host = API_HOSTS[attempt % API_HOSTS.length]
    try {
      const response = await fetch(`${host}/stats`, {
        headers: { 'User-Agent': 'VibeRadioSitemap/2.0' },
        signal: AbortSignal.timeout(requestTimeout),
      })
      if (!response.ok) throw new Error(`${host} respondió ${response.status}`)
      const stats = await response.json()
      const total = Number(stats.stations) - Number(stats.stations_broken)
      if (!Number.isInteger(total) || total < 1) throw new Error(`${host} devolvió estadísticas inválidas`)
      return total
    } catch (error) {
      lastError = error
      await wait(750 * (attempt + 1))
    }
  }
  throw lastError
}

async function fetchAllStations() {
  const expectedCount = await fetchExpectedStationCount()
  const stations = []
  for (let offset = 0; ; offset += pageSize) {
    const page = await fetchStationPage(offset)
    stations.push(...page)
    console.log(`Descargadas ${stations.length} emisoras...`)
    if (page.length < pageSize) {
      if (stations.length < expectedCount - 100) throw new Error(`La API entregó un catálogo incompleto: ${stations.length} de unas ${expectedCount} emisoras`)
      return stations
    }
  }
}

async function loadExistingStations() {
  const names = (await readdir('public/seo/stations')).filter(name => name.endsWith('.json'))
  const shards = await Promise.all(names.map(async name => JSON.parse(await readFile(`public/seo/stations/${name}`, 'utf8'))))
  const stations = shards.flat()
  if (stations.length < 50_000) throw new Error(`El catálogo existente está incompleto: ${stations.length} emisoras`)
  return stations
}

function toSeoStation(station) {
  const country = getCountry(station)
  return {
    id: shortId(station.stationuuid),
    slug: slugify(station.name),
    name: String(station.name || '').trim(),
    country: String(station.country || '').trim(),
    countrycode: String(station.countrycode || '').trim().toUpperCase(),
    countrySlug: country.slug,
    state: String(station.state || '').trim(),
    language: String(station.language || '').trim(),
    tags: String(station.tags || '').trim(),
    favicon: String(station.favicon || '').trim(),
    homepage: String(station.homepage || '').trim(),
    clickcount: Number(station.clickcount) || 0,
    votes: Number(station.votes) || 0,
    lastcheckok: Number(station.lastcheckok) || 0,
    lastmod: String(station.lastchangetime_iso8601 || station.lastchecktime_iso8601 || '').slice(0, 10),
  }
}

async function removeGeneratedFiles(preserveCatalog) {
  const publicFiles = await readdir('public')
  await Promise.all(publicFiles.filter(name => /^sitemap-stations-\d+\.xml$/.test(name)).map(name => rm(`public/${name}`)))
  await rm('public/sitemaps', { recursive: true, force: true })
  await rm('public/seo/countries', { recursive: true, force: true })
  await rm('public/seo/cities', { recursive: true, force: true })
  await rm('public/seo/moments', { recursive: true, force: true })
  if (!preserveCatalog) await rm('public/seo/stations', { recursive: true, force: true })
}

let stations
if (useExistingCatalog) {
  stations = await loadExistingStations()
  stations = stations.map(station => ({ ...station, countrySlug: getCountry(station).slug }))
} else {
  const apiStations = await fetchAllStations()
  const uniqueStations = new Map()
  for (const station of [...apiStations, ...curatedStations]) {
    if (!station.stationuuid || !station.name) continue
    const normalized = toSeoStation(station)
    if (!normalized.slug) continue
    uniqueStations.set(station.stationuuid, normalized)
  }
  stations = [...uniqueStations.values()]
}
const homeUrl = `${siteUrl}/`

await removeGeneratedFiles(useExistingCatalog)
await mkdir('public/seo/stations', { recursive: true })
await mkdir('public/seo/countries', { recursive: true })
await mkdir('public/seo/cities', { recursive: true })
await mkdir('public/seo/moments', { recursive: true })
await mkdir('public/sitemaps', { recursive: true })

let shardCount
if (useExistingCatalog) {
  shardCount = (await readdir('public/seo/stations')).filter(name => name.endsWith('.json')).length
} else {
  const shards = new Map()
  for (const station of stations) {
    const key = station.id.slice(0, 2)
    const shard = shards.get(key) || []
    shard.push(station)
    shards.set(key, shard)
  }
  await Promise.all([...shards].map(([key, records]) => writeFile(`public/seo/stations/${key}.json`, JSON.stringify(records))))
  shardCount = shards.size
}

const generatedAt = new Date().toISOString()
const today = generatedAt.slice(0, 10)
const countries = new Map()
for (const station of stations) {
  const country = getCountry(station)
  const group = countries.get(country.code) || { ...country, stations: [] }
  group.stations.push(station)
  countries.set(country.code, group)
}

const sitemapFiles = []
const writeUrlset = async (filename, entries) => {
  const body = entries.map(entry => `  <url><loc>${escapeXml(entry.url)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}</url>`).join('\n')
  await writeFile(`public/sitemaps/${filename}`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`)
  sitemapFiles.push(filename)
}

const sortedCountries = [...countries.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'))
const cityCandidates = cityGuideSeeds.map(seed => {
  const cityStations = stations.filter(station => station.countrycode === seed.countryCode && station.state.toLocaleLowerCase('es') === seed.region.toLocaleLowerCase('es'))
  const tags = new Set(cityStations.flatMap(station => station.tags.split(',').map(tag => tag.trim().toLocaleLowerCase('es')).filter(Boolean)))
  if (cityStations.length < minimumCityStations || tags.size < 3) return null
  const country = getCountry(cityStations[0])
  cityStations.sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0) || (b.votes || 0) - (a.votes || 0) || a.name.localeCompare(b.name, 'es'))
  return {
    name: seed.name,
    slug: slugify(seed.name),
    region: seed.region,
    countryName: country.name,
    countrySlug: country.slug,
    countryCode: seed.countryCode,
    stationCount: cityStations.length,
    stations: cityStations.slice(0, 100),
  }
}).filter(Boolean)

const citySummaries = cityCandidates
  .map(city => ({
    name: city.name,
    slug: city.slug,
    countryName: city.countryName,
    countrySlug: city.countrySlug,
    countryCode: city.countryCode,
    stationCount: city.stationCount,
  }))
  .sort((a, b) => b.stationCount - a.stationCount || a.name.localeCompare(b.name, 'es'))

for (const city of cityCandidates) {
  const relatedCities = citySummaries.filter(candidate => candidate.countryCode === city.countryCode && candidate.slug !== city.slug).slice(0, 5)
  await mkdir(`public/seo/cities/${city.countrySlug}`, { recursive: true })
  await writeFile(`public/seo/cities/${city.countrySlug}/${city.slug}.json`, JSON.stringify({ ...city, relatedCities }))
}
await writeFile('public/seo/cities/index.json', JSON.stringify(citySummaries))

const momentGuides = momentGuideSeeds.map(moment => {
  const momentStations = stations.filter(station => {
    const tags = station.tags.toLocaleLowerCase('es')
    return moment.tags.some(tag => tags.includes(tag))
  })
  if (momentStations.length < minimumMomentStations) return null
  momentStations.sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0) || (b.votes || 0) - (a.votes || 0) || a.name.localeCompare(b.name, 'es'))
  return { ...moment, stationCount: momentStations.length, stations: momentStations.slice(0, 100) }
}).filter(Boolean)
const momentSummaries = momentGuides.map(moment => ({ slug: moment.slug, name: moment.name, description: moment.description, stationCount: moment.stationCount }))
for (const moment of momentGuides) await writeFile(`public/seo/moments/${moment.slug}.json`, JSON.stringify(moment))
await writeFile('public/seo/moments/index.json', JSON.stringify(momentSummaries))

await writeUrlset('sitemap-core.xml', [
  { url: homeUrl, lastmod: today },
  { url: `${siteUrl}/acerca-de`, lastmod: today },
  { url: `${siteUrl}/metodologia`, lastmod: today },
  { url: `${siteUrl}/ciudades`, lastmod: today },
  { url: `${siteUrl}/momentos`, lastmod: today },
  { url: `${siteUrl}/camaras/badalona`, lastmod: today },
  ...sortedCountries.map(country => ({ url: `${siteUrl}/pais/${country.slug}`, lastmod: today })),
])
await writeUrlset('sitemap-cities.xml', citySummaries.map(city => ({ url: `${siteUrl}/pais/${city.countrySlug}/${city.slug}`, lastmod: today })))
await writeUrlset('sitemap-moments.xml', momentSummaries.map(moment => ({ url: `${siteUrl}/momento/${moment.slug}`, lastmod: today })))

for (const country of sortedCountries) {
  country.stations.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  await writeFile(`public/seo/countries/${country.slug}.json`, JSON.stringify({
    code: country.code === 'XX' ? '' : country.code,
    name: country.name,
    slug: country.slug,
    stationCount: country.stations.length,
    stations: country.stations.slice(0, 100),
    cities: citySummaries.filter(city => city.countryCode === country.code).slice(0, 12),
  }))
  const chunks = Array.from({ length: Math.ceil(country.stations.length / maxUrlsPerFile) }, (_, index) => country.stations.slice(index * maxUrlsPerFile, (index + 1) * maxUrlsPerFile))
  for (const [index, chunk] of chunks.entries()) {
    const suffix = chunks.length > 1 ? `-${index + 1}` : ''
    await writeUrlset(`sitemap-stations-${country.code.toLowerCase()}${suffix}.xml`, chunk.map(station => ({
      url: `${siteUrl}${stationPath(station)}`,
      lastmod: /^\d{4}-\d{2}-\d{2}$/.test(station.lastmod) ? station.lastmod : '',
    })))
  }
}

const sitemapIndex = sitemapFiles.map(filename => `  <sitemap><loc>${escapeXml(`${siteUrl}/sitemaps/${filename}`)}</loc><lastmod>${generatedAt}</lastmod></sitemap>`).join('\n')
await writeFile('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapIndex}\n</sitemapindex>\n`)
await writeFile('public/robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /seo/\n\nUser-agent: OAI-SearchBot\nAllow: /\nDisallow: /api/\nDisallow: /seo/\n\nUser-agent: ChatGPT-User\nAllow: /\nDisallow: /api/\nDisallow: /seo/\n\nUser-agent: Claude-SearchBot\nAllow: /\nDisallow: /api/\nDisallow: /seo/\n\nUser-agent: Claude-User\nAllow: /\nDisallow: /api/\nDisallow: /seo/\n\nUser-agent: PerplexityBot\nAllow: /\nDisallow: /api/\nDisallow: /seo/\n\nUser-agent: Google-Extended\nAllow: /\nDisallow: /api/\nDisallow: /seo/\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
await writeFile('public/seo/catalog.json', JSON.stringify({ generatedAt, stationCount: stations.length, countryCount: countries.size, cityCount: citySummaries.length, sitemapCount: sitemapFiles.length }))
console.log(`Generadas ${stations.length + countries.size + citySummaries.length + momentSummaries.length + 6} URLs en ${sitemapFiles.length} sitemaps y ${shardCount} fragmentos SEO.`)
