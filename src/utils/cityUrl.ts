const CITY_ROUTE = /^\/pais\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/

export type CityRoute = {
  countrySlug: string
  citySlug: string
}

export function getCityRouteFromPath(pathname: string): CityRoute | null {
  const match = pathname.toLocaleLowerCase().match(CITY_ROUTE)
  return match ? { countrySlug: match[1], citySlug: match[2] } : null
}

export function getCityUrl(countrySlug: string, citySlug: string) {
  return `/pais/${countrySlug}/${citySlug}`
}
