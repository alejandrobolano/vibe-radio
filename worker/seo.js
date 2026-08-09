const PRODUCTION_ORIGIN = 'https://viberadio.net'
const STATION_ROUTE = /^\/radio\/([a-z]{2}|online)\/([a-z0-9-]+)-([a-f0-9]{8}|v[a-z0-9]{7})\/?$/
const COUNTRY_ROUTE = /^\/pais\/([a-z0-9-]+)\/?$/
const CITY_ROUTE = /^\/pais\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/
const MOMENT_ROUTE = /^\/momento\/([a-z0-9-]+)\/?$/
const countryNames = new Intl.DisplayNames(['es'], { type: 'region' })

export function parseStationRoute(pathname) {
  const match = pathname.toLowerCase().match(STATION_ROUTE)
  if (!match) return null
  return { countryCode: match[1], slug: match[2], shortId: match[3] }
}

export function parseCountryRoute(pathname) {
  return pathname.toLowerCase().match(COUNTRY_ROUTE)?.[1] || null
}

export function parseCityRoute(pathname) {
  const match = pathname.toLowerCase().match(CITY_ROUTE)
  return match ? { countrySlug: match[1], citySlug: match[2] } : null
}

export function parseMomentRoute(pathname) {
  return pathname.toLowerCase().match(MOMENT_ROUTE)?.[1] || null
}

function slugify(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function getCountrySlug(station) {
  if (station.countrySlug) return station.countrySlug
  const code = String(station.countrycode || '').toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? slugify(countryNames.of(code) || station.country || code) : 'online'
}

export function findStation(records, route) {
  if (!Array.isArray(records)) return null
  return records.find(station => station.id === route.shortId && station.slug === route.slug && (station.countrycode || 'online').toLowerCase() === route.countryCode) || null
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

function truncate(value, length) {
  if (value.length <= length) return value
  return `${value.slice(0, length - 1).trimEnd()}…`
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}

export function createStationSeo(station) {
  const countryCode = /^[A-Z]{2}$/.test(station.countrycode) ? station.countrycode.toLowerCase() : 'online'
  const path = `/radio/${countryCode}/${station.slug}-${station.id}`
  const canonicalUrl = `${PRODUCTION_ORIGIN}${path}`
  const location = station.state || station.country || 'online'
  const title = truncate(`Escuchar ${station.name} en directo | Vibe Radio`, 60)
  const description = truncate(`Escucha ${station.name} en directo desde ${location}. Consulta su género, país, idioma, calidad de emisión y web oficial.`, 158)
  const favicon = safeHttpUrl(station.favicon)
  const homepage = safeHttpUrl(station.homepage)
  const countryUrl = `${PRODUCTION_ORIGIN}/pais/${getCountrySlug(station)}`
  const tags = station.tags.split(',').map(tag => tag.trim()).filter(Boolean).slice(0, 4)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RadioStation',
        '@id': `${canonicalUrl}#station`,
        name: station.name,
        url: canonicalUrl,
        description,
        image: favicon || undefined,
        areaServed: station.state || station.country || undefined,
        inLanguage: station.language || undefined,
        genre: tags.length ? tags : undefined,
        sameAs: homepage ? [homepage] : undefined,
        potentialAction: { '@type': 'ListenAction', target: canonicalUrl },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Emisoras', item: `${PRODUCTION_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: station.country || 'Online', item: countryUrl },
          { '@type': 'ListItem', position: 3, name: station.name, item: canonicalUrl },
        ],
      },
    ],
  }
  const facts = [station.state, station.country, station.language, ...tags].filter(Boolean)
  const initialContent = `<main><article><p>Radio en directo</p><h1>${escapeHtml(station.name)}</h1><p>${escapeHtml(description)}</p>${facts.length ? `<p>${escapeHtml(facts.join(' · '))}</p>` : ''}<p>El reproductor y la información completa se cargarán a continuación.</p></article></main>`

  return { canonicalUrl, title, description, favicon, jsonLd: serializeJsonLd(jsonLd), initialContent }
}

export function createCountrySeo(country) {
  const canonicalUrl = `${PRODUCTION_ORIGIN}/pais/${country.slug}`
  const title = truncate(`Emisoras de radio de ${country.name} en directo | Vibe Radio`, 60)
  const description = truncate(`Escucha ${country.stationCount} emisoras de radio de ${country.name} online y en directo. Descubre música, noticias y programas.`, 158)
  const items = country.stations.slice(0, 100).map((station, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: station.name,
    url: `${PRODUCTION_ORIGIN}/radio/${(station.countrycode || 'online').toLowerCase()}/${station.slug}-${station.id}`,
  }))
  const cities = Array.isArray(country.cities) ? country.cities : []
  const cityItems = cities.map((city, index) => ({ '@type': 'ListItem', position: index + 1, name: city.name, url: `${PRODUCTION_ORIGIN}/pais/${city.countrySlug}/${city.slug}` }))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${canonicalUrl}#page`, name: title, url: canonicalUrl, description, inLanguage: 'es' },
      { '@type': 'ItemList', name: `Emisoras de ${country.name}`, numberOfItems: country.stationCount, itemListElement: items },
      ...(cityItems.length ? [{ '@type': 'ItemList', name: `Radio por ciudad en ${country.name}`, numberOfItems: cityItems.length, itemListElement: cityItems }] : []),
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Emisoras', item: `${PRODUCTION_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: country.name, item: canonicalUrl },
      ] },
    ],
  }
  const links = country.stations.slice(0, 100).map(station => `<li><a href="/radio/${(station.countrycode || 'online').toLowerCase()}/${station.slug}-${station.id}">${escapeHtml(station.name)}</a></li>`).join('')
  const cityLinks = cities.map(city => `<li><a href="/pais/${city.countrySlug}/${city.slug}">Radios de ${escapeHtml(city.name)}</a></li>`).join('')
  const initialContent = `<main><article><p>Radio por país</p><h1>Emisoras de radio de ${escapeHtml(country.name)}</h1><p>${escapeHtml(description)}</p><p>Directorio actualizado con ${country.stationCount} emisoras.</p><ul>${links}</ul>${cityLinks ? `<h2>Radio por ciudad y zona</h2><ul>${cityLinks}</ul>` : ''}</article></main>`
  return { canonicalUrl, title, description, jsonLd: serializeJsonLd(jsonLd), initialContent }
}

export function createCitySeo(city) {
  const canonicalUrl = `${PRODUCTION_ORIGIN}/pais/${city.countrySlug}/${city.slug}`
  const countryUrl = `${PRODUCTION_ORIGIN}/pais/${city.countrySlug}`
  const title = truncate(`Emisoras de radio de ${city.name} en directo | Vibe Radio`, 60)
  const description = truncate(`Escucha ${city.stationCount} emisoras de ${city.name}, ${city.countryName}, online y en directo. Música, noticias y programas locales.`, 158)
  const items = city.stations.slice(0, 100).map((station, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: station.name,
    url: `${PRODUCTION_ORIGIN}/radio/${(station.countrycode || 'online').toLowerCase()}/${station.slug}-${station.id}`,
  }))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${canonicalUrl}#page`, name: title, url: canonicalUrl, description, inLanguage: 'es', about: { '@type': 'City', name: city.name, containedInPlace: { '@type': 'Country', name: city.countryName } } },
      { '@type': 'ItemList', name: `Emisoras de ${city.name}`, numberOfItems: city.stationCount, itemListElement: items },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Emisoras', item: `${PRODUCTION_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: city.countryName, item: countryUrl },
        { '@type': 'ListItem', position: 3, name: city.name, item: canonicalUrl },
      ] },
    ],
  }
  const links = city.stations.slice(0, 100).map(station => `<li><a href="/radio/${(station.countrycode || 'online').toLowerCase()}/${station.slug}-${station.id}">${escapeHtml(station.name)}</a></li>`).join('')
  const related = city.relatedCities.map(item => `<li><a href="/pais/${item.countrySlug}/${item.slug}">Radios de ${escapeHtml(item.name)}</a></li>`).join('')
  const initialContent = `<main><article><p>Radio local</p><h1>Emisoras de radio de ${escapeHtml(city.name)}</h1><p>${escapeHtml(description)}</p><ul>${links}</ul>${related ? `<h2>Otras ciudades de ${escapeHtml(city.countryName)}</h2><ul>${related}</ul>` : ''}</article></main>`
  return { canonicalUrl, title, description, jsonLd: serializeJsonLd(jsonLd), initialContent }
}

export function createCityHubSeo(cities) {
  const canonicalUrl = `${PRODUCTION_ORIGIN}/ciudades`
  const title = 'Emisoras de radio por ciudad y zona | Vibe Radio'
  const description = 'Explora emisoras de radio online por ciudad y zona. Encuentra radios locales populares y escucha sus emisiones en directo.'
  const items = cities.map((city, index) => ({ '@type': 'ListItem', position: index + 1, name: `${city.name}, ${city.countryName}`, url: `${PRODUCTION_ORIGIN}/pais/${city.countrySlug}/${city.slug}` }))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${canonicalUrl}#page`, name: title, url: canonicalUrl, description, inLanguage: 'es' },
      { '@type': 'ItemList', name: 'Radio por ciudad y zona', numberOfItems: cities.length, itemListElement: items },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Emisoras', item: `${PRODUCTION_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Ciudades y zonas', item: canonicalUrl },
      ] },
    ],
  }
  const links = cities.map(city => `<li><a href="/pais/${city.countrySlug}/${city.slug}">Radios de ${escapeHtml(city.name)}, ${escapeHtml(city.countryName)}</a></li>`).join('')
  return { canonicalUrl, title, description, jsonLd: serializeJsonLd(jsonLd), initialContent: `<main><article><h1>Radio local, ciudad a ciudad</h1><p>${description}</p><ul>${links}</ul></article></main>` }
}

export function createMomentSeo(moment) {
  const canonicalUrl = `${PRODUCTION_ORIGIN}/momento/${moment.slug}`
  const title = truncate(`${moment.name}: emisoras online en directo | Vibe Radio`, 60)
  const description = truncate(`${moment.description} Escucha gratis emisoras online en Vibe Radio.`, 158)
  const items = moment.stations.slice(0, 100).map((station, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: station.name,
    url: `${PRODUCTION_ORIGIN}/radio/${(station.countrycode || 'online').toLowerCase()}/${station.slug}-${station.id}`,
  }))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${canonicalUrl}#page`, name: title, url: canonicalUrl, description, inLanguage: 'es' },
      { '@type': 'ItemList', name: moment.name, numberOfItems: moment.stationCount, itemListElement: items },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Emisoras', item: `${PRODUCTION_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Momentos', item: `${PRODUCTION_ORIGIN}/momentos` },
        { '@type': 'ListItem', position: 3, name: moment.name, item: canonicalUrl },
      ] },
    ],
  }
  const links = moment.stations.slice(0, 100).map(station => `<li><a href="/radio/${(station.countrycode || 'online').toLowerCase()}/${station.slug}-${station.id}">${escapeHtml(station.name)}</a></li>`).join('')
  return { canonicalUrl, title, description, jsonLd: serializeJsonLd(jsonLd), initialContent: `<main><article><h1>${escapeHtml(moment.name)}</h1><p>${escapeHtml(description)}</p><p>Selección de ${moment.stationCount} emisoras disponibles.</p><ul>${links}</ul></article></main>` }
}

export function createMomentsHubSeo(moments) {
  const canonicalUrl = `${PRODUCTION_ORIGIN}/momentos`
  const title = 'Radio para cada momento: trabajar, relajarse y más | Vibe Radio'
  const description = 'Elige emisoras online para trabajar, relajarte, entrenar, conducir, dormir o celebrar. Encuentra el ambiente adecuado y escucha en directo.'
  const items = moments.map((moment, index) => ({ '@type': 'ListItem', position: index + 1, name: moment.name, url: `${PRODUCTION_ORIGIN}/momento/${moment.slug}` }))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${canonicalUrl}#page`, name: title, url: canonicalUrl, description, inLanguage: 'es' },
      { '@type': 'ItemList', name: 'Radio para cada momento', numberOfItems: moments.length, itemListElement: items },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Emisoras', item: `${PRODUCTION_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Momentos', item: canonicalUrl },
      ] },
    ],
  }
  const links = moments.map(moment => `<li><a href="/momento/${moment.slug}">${escapeHtml(moment.name)}</a></li>`).join('')
  return { canonicalUrl, title, description, jsonLd: serializeJsonLd(jsonLd), initialContent: `<main><article><h1>Radio para cada momento</h1><p>${description}</p><ul>${links}</ul></article></main>` }
}

export function createWebcamsSeo() {
  const canonicalUrl = `${PRODUCTION_ORIGIN}/camaras/badalona`
  const title = 'Cámaras de Badalona en directo | Vibe Radio'
  const description = 'Consulta cámaras y vistas actualizadas de Badalona mientras sigues escuchando tu emisora favorita en Vibe Radio.'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${canonicalUrl}#page`, name: title, url: canonicalUrl, description, inLanguage: 'es', about: { '@type': 'City', name: 'Badalona', containedInPlace: { '@type': 'Country', name: 'España' } } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Emisoras', item: `${PRODUCTION_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Cámaras de Badalona', item: canonicalUrl },
      ] },
    ],
  }
  const initialContent = `<main><article><p>Badalona ahora</p><h1>Cámaras de Badalona</h1><p>${escapeHtml(description)}</p><h2>Vistas actualizadas cerca de Badalona</h2><p>Selecciona una cámara para observar diferentes zonas sin interrumpir la emisora que estés escuchando. Las imágenes proceden de Windy y se renuevan periódicamente.</p></article></main>`
  return { canonicalUrl, title, description, jsonLd: serializeJsonLd(jsonLd), initialContent }
}

export function createInfoSeo(pathname) {
  const pages = {
    '/acerca-de': {
      title: 'Acerca de Vibe Radio | Directorio de radio online',
      description: 'Conoce Vibe Radio, el directorio independiente creado por Alejandro Bolaño para descubrir y escuchar emisoras online.',
      heading: 'Acerca de Vibe Radio',
      body: 'Vibe Radio es un directorio independiente de emisoras online. No emite audio propio: conecta al usuario con streams públicos facilitados por las emisoras y Radio Browser.',
    },
    '/metodologia': {
      title: 'Metodología y fuentes del directorio | Vibe Radio',
      description: 'Consulta cómo Vibe Radio obtiene, normaliza y actualiza la información de sus emisoras y cómo comunicarnos una corrección.',
      heading: 'Metodología y fuentes',
      body: 'El catálogo se obtiene principalmente de Radio Browser y se complementa con emisoras verificadas manualmente. Normalizamos nombres, países y URLs; excluimos registros sin identidad válida y revisamos periódicamente la disponibilidad declarada.',
    },
  }
  const page = pages[pathname]
  if (!page) return null
  const canonicalUrl = `${PRODUCTION_ORIGIN}${pathname}`
  const jsonLd = serializeJsonLd({ '@context': 'https://schema.org', '@type': 'AboutPage', name: page.heading, url: canonicalUrl, description: page.description, inLanguage: 'es', isPartOf: { '@id': `${PRODUCTION_ORIGIN}/#website` } })
  return { ...page, canonicalUrl, jsonLd, initialContent: `<main><article><h1>${page.heading}</h1><p>${page.body}</p><p>Responsable: Alejandro Bolaño · <a href="https://alejandrobolano.com">alejandrobolano.com</a></p></article></main>` }
}
