import { slugifyStation } from './stationUrl'

const countryNames = new Intl.DisplayNames(['es'], { type: 'region' })

export function getCountryName(countryCode: string, fallback = '') {
  const code = countryCode.toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return fallback || 'Emisoras online'
  return countryNames.of(code) || fallback || code
}

export function getCountryUrl(countryCode: string, fallback = '') {
  const code = countryCode.toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return '/pais/online'
  return `/pais/${slugifyStation(getCountryName(code, fallback))}`
}

export function getCountrySlugFromPath(pathname: string) {
  const match = pathname.match(/^\/pais\/([a-z0-9-]+)\/?$/i)
  return match?.[1].toLowerCase() ?? null
}
