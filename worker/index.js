import { createCityHubSeo, createCitySeo, createCountrySeo, createInfoSeo, createMomentsHubSeo, createMomentSeo, createStationSeo, createWebcamsSeo, findStation, parseCityRoute, parseCountryRoute, parseMomentRoute, parseStationRoute } from './seo.js'
import { handleNowPlayingRequest } from './nowPlaying.js'
import { handleWeatherRequest } from './weather.js'
import { handleBadalonaWebcamsRequest } from './webcams.js'

const WORKERS_DEV_SUFFIX = '.workers.dev'
const PRODUCTION_HOSTNAME = 'viberadio.net'
const WWW_HOSTNAME = `www.${PRODUCTION_HOSTNAME}`
const DEVELOPMENT_HOSTNAME = `dev.${PRODUCTION_HOSTNAME}`

function setMetaContent(content) {
  return { element: element => element.setAttribute('content', content) }
}

function applyRobotsHeader(response, value) {
  const headers = new Headers(response.headers)
  headers.set('X-Robots-Tag', value)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

async function loadStation(env, requestUrl, route) {
  const catalogUrl = new URL(`/seo/stations/${route.shortId.slice(0, 2)}.json`, requestUrl)
  const response = await env.ASSETS.fetch(catalogUrl)
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
  return findStation(await response.json(), route)
}

async function loadCountry(env, requestUrl, slug) {
  const response = await env.ASSETS.fetch(new URL(`/seo/countries/${slug}.json`, requestUrl))
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
  return response.json()
}

async function loadCity(env, requestUrl, route) {
  const response = await env.ASSETS.fetch(new URL(`/seo/cities/${route.countrySlug}/${route.citySlug}.json`, requestUrl))
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
  return response.json()
}

async function loadCityIndex(env, requestUrl) {
  const response = await env.ASSETS.fetch(new URL('/seo/cities/index.json', requestUrl))
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
  return response.json()
}

async function loadMoment(env, requestUrl, slug) {
  const response = await env.ASSETS.fetch(new URL(`/seo/moments/${slug}.json`, requestUrl))
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
  return response.json()
}

async function loadMomentIndex(env, requestUrl) {
  const response = await env.ASSETS.fetch(new URL('/seo/moments/index.json', requestUrl))
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
  return response.json()
}

function renderSeoPage(response, seo, schemaAttribute) {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'public, max-age=300, s-maxage=86400')
  const htmlResponse = new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  return new HTMLRewriter()
    .on('title', { element: element => element.setInnerContent(seo.title) })
    .on('meta[name="description"]', setMetaContent(seo.description))
    .on('meta[name="robots"]', setMetaContent('index,follow,max-image-preview:large'))
    .on('meta[property="og:title"]', setMetaContent(seo.title))
    .on('meta[property="og:description"]', setMetaContent(seo.description))
    .on('meta[property="og:url"]', setMetaContent(seo.canonicalUrl))
    .on('meta[name="twitter:title"]', setMetaContent(seo.title))
    .on('meta[name="twitter:description"]', setMetaContent(seo.description))
    .on('link[rel="canonical"]', { element: element => element.setAttribute('href', seo.canonicalUrl) })
    .on('#root', { element: element => element.setInnerContent(seo.initialContent, { html: true }) })
    .on('head', { element: element => element.append(`<script type="application/ld+json" ${schemaAttribute}>${seo.jsonLd}</script>`, { html: true }) })
    .transform(htmlResponse)
}

function renderStationPage(response, station) {
  const seo = createStationSeo(station)
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'public, max-age=300, s-maxage=86400')
  const htmlResponse = new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  let rewriter = new HTMLRewriter()
    .on('title', { element: element => element.setInnerContent(seo.title) })
    .on('meta[name="description"]', setMetaContent(seo.description))
    .on('meta[name="robots"]', setMetaContent('index,follow,max-image-preview:large'))
    .on('meta[property="og:title"]', setMetaContent(seo.title))
    .on('meta[property="og:description"]', setMetaContent(seo.description))
    .on('meta[name="twitter:title"]', setMetaContent(seo.title))
    .on('meta[name="twitter:description"]', setMetaContent(seo.description))
    .on('meta[name="twitter:card"]', setMetaContent(seo.favicon ? 'summary_large_image' : 'summary'))
    .on('link[rel="canonical"]', { element: element => element.setAttribute('href', seo.canonicalUrl) })
    .on('meta[property="og:url"]', setMetaContent(seo.canonicalUrl))
    .on('#root', { element: element => element.setInnerContent(seo.initialContent, { html: true }) })
    .on('head', { element: element => element.append(`<script type="application/ld+json" data-station-schema="true">${seo.jsonLd}</script>`, { html: true }) })

  if (seo.favicon) {
    rewriter = rewriter.on('head', {
      element: element => element.append(`<meta property="og:image" content="${seo.favicon}"><meta name="twitter:image" content="${seo.favicon}">`, { html: true }),
    })
  }

  return rewriter.transform(htmlResponse)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const hostname = url.hostname
    const isDevelopment = hostname === DEVELOPMENT_HOSTNAME || hostname.endsWith(WORKERS_DEV_SUFFIX)

    if (hostname === WWW_HOSTNAME) {
      const destination = new URL(url.pathname + url.search, `https://${PRODUCTION_HOSTNAME}`)
      return Response.redirect(destination, 308)
    }

    if (url.pathname === '/api/visitor-country') {
      const countryCode = request.cf?.country
      return Response.json(
        { countryCode: typeof countryCode === 'string' && /^[A-Z]{2}$/.test(countryCode) ? countryCode : null },
        { headers: { 'Cache-Control': 'private, no-store' } },
      )
    }

    if (url.pathname === '/api/weather') return handleWeatherRequest(request, env)

    if (url.pathname.replace(/\/$/, '') === '/api/webcams/badalona') return handleBadalonaWebcamsRequest(request, env)

    const nowPlayingMatch = url.pathname.toLowerCase().match(/^\/api\/now-playing\/([a-z0-9-]{8,64})$/)
    if (nowPlayingMatch) return handleNowPlayingRequest(request, nowPlayingMatch[1])

    if (request.method === 'GET' && url.pathname === '/api/city-guides') {
      const cities = await loadCityIndex(env, request.url)
      return cities ? Response.json(cities, { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=86400' } }) : Response.json([], { status: 404 })
    }

    const cityApiMatch = request.method === 'GET' ? url.pathname.toLowerCase().match(/^\/api\/city-guide\/([a-z0-9-]+)\/([a-z0-9-]+)$/) : null
    if (cityApiMatch) {
      const city = await loadCity(env, request.url, { countrySlug: cityApiMatch[1], citySlug: cityApiMatch[2] })
      if (!city) return Response.json({ error: 'Not found' }, { status: 404 })
      const guide = {
        name: city.name,
        slug: city.slug,
        region: city.region,
        countryName: city.countryName,
        countrySlug: city.countrySlug,
        countryCode: city.countryCode,
        stationCount: city.stationCount,
        relatedCities: city.relatedCities,
      }
      return Response.json(guide, { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=86400' } })
    }

    if (url.pathname.startsWith('/seo/')) return new Response('Not found', { status: 404 })

    const stationRoute = request.method === 'GET' ? parseStationRoute(url.pathname) : null
    if (stationRoute) {
      const [response, station] = await Promise.all([
        env.ASSETS.fetch(request),
        loadStation(env, request.url, stationRoute),
      ])
      const notFoundResponse = new Response(response.body, { status: 404, headers: response.headers })
      const stationResponse = station ? renderStationPage(response, station) : applyRobotsHeader(notFoundResponse, 'noindex, follow')
      return isDevelopment ? applyRobotsHeader(stationResponse, 'noindex, nofollow') : stationResponse
    }

    const cityRoute = request.method === 'GET' ? parseCityRoute(url.pathname) : null
    if (cityRoute) {
      const [response, city] = await Promise.all([env.ASSETS.fetch(request), loadCity(env, request.url, cityRoute)])
      const notFoundResponse = new Response(response.body, { status: 404, headers: response.headers })
      const cityResponse = city ? renderSeoPage(response, createCitySeo(city), 'data-city-schema="true"') : applyRobotsHeader(notFoundResponse, 'noindex, follow')
      return isDevelopment ? applyRobotsHeader(cityResponse, 'noindex, nofollow') : cityResponse
    }

    const momentSlug = request.method === 'GET' ? parseMomentRoute(url.pathname) : null
    if (momentSlug) {
      const [response, moment] = await Promise.all([env.ASSETS.fetch(request), loadMoment(env, request.url, momentSlug)])
      const notFoundResponse = new Response(response.body, { status: 404, headers: response.headers })
      const momentResponse = moment ? renderSeoPage(response, createMomentSeo(moment), 'data-moment-schema="true"') : applyRobotsHeader(notFoundResponse, 'noindex, follow')
      return isDevelopment ? applyRobotsHeader(momentResponse, 'noindex, nofollow') : momentResponse
    }

    const countrySlug = request.method === 'GET' ? parseCountryRoute(url.pathname) : null
    if (countrySlug) {
      const [response, country] = await Promise.all([env.ASSETS.fetch(request), loadCountry(env, request.url, countrySlug)])
      const notFoundResponse = new Response(response.body, { status: 404, headers: response.headers })
      const countryResponse = country ? renderSeoPage(response, createCountrySeo(country), 'data-country-schema="true"') : applyRobotsHeader(notFoundResponse, 'noindex, follow')
      return isDevelopment ? applyRobotsHeader(countryResponse, 'noindex, nofollow') : countryResponse
    }

    const infoSeo = request.method === 'GET' ? createInfoSeo(url.pathname.replace(/\/$/, '')) : null
    if (infoSeo) {
      const response = renderSeoPage(await env.ASSETS.fetch(request), infoSeo, 'data-info-schema="true"')
      return isDevelopment ? applyRobotsHeader(response, 'noindex, nofollow') : response
    }

    if (request.method === 'GET' && url.pathname.replace(/\/$/, '') === '/ciudades') {
      const [response, cities] = await Promise.all([env.ASSETS.fetch(request), loadCityIndex(env, request.url)])
      const cityHubResponse = Array.isArray(cities) ? renderSeoPage(response, createCityHubSeo(cities), 'data-city-hub-schema="true"') : applyRobotsHeader(response, 'noindex, follow')
      return isDevelopment ? applyRobotsHeader(cityHubResponse, 'noindex, nofollow') : cityHubResponse
    }

    if (request.method === 'GET' && url.pathname.replace(/\/$/, '') === '/momentos') {
      const [response, moments] = await Promise.all([env.ASSETS.fetch(request), loadMomentIndex(env, request.url)])
      const momentsHubResponse = Array.isArray(moments) ? renderSeoPage(response, createMomentsHubSeo(moments), 'data-moments-hub-schema="true"') : applyRobotsHeader(response, 'noindex, follow')
      return isDevelopment ? applyRobotsHeader(momentsHubResponse, 'noindex, nofollow') : momentsHubResponse
    }

    if (request.method === 'GET' && url.pathname.replace(/\/$/, '') === '/camaras/badalona') {
      const response = renderSeoPage(await env.ASSETS.fetch(request), createWebcamsSeo(), 'data-webcams-schema="true"')
      return isDevelopment ? applyRobotsHeader(response, 'noindex, nofollow') : response
    }

    const response = await env.ASSETS.fetch(request)
    return isDevelopment ? applyRobotsHeader(response, 'noindex, nofollow') : response
  },
}
