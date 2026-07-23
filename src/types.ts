export type Station = {
  stationuuid: string
  name: string
  url_resolved: string
  homepage: string
  favicon: string
  tags: string
  country: string
  countrycode: string
  state: string
  language: string
  codec: string
  bitrate: number
  votes: number
  clickcount: number
  clicktrend?: number
  hls?: number
  lastcheckok?: number
  lastchecktime_iso8601?: string
  lastcheckoktime_iso8601?: string
  has_extended_info?: boolean
  email?: string
  phone?: string
  address?: string
  instagram?: string
  facebook?: string
}

export type Country = {
  name: string
  iso_3166_1: string
  stationcount: number
}

export type Region = {
  name: string
  country: string
  stationcount: number
}

export type StationFilters = {
  continent: string
  countryCode: string
  countryName: string
  region: string
}

export type StationPage = {
  stations: Station[]
  hasMore: boolean
}

export type TrackMetadata = {
  title: string
  artist?: string
  artwork?: string
}

export type ListeningHistoryEntry = {
  id: string
  station: Station
  listenedAt: string
  track?: TrackMetadata
}

export type WeatherSnapshot = {
  city: string
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  description: string
  conditionId: number
}

export type CityGuideSummary = {
  name: string
  slug: string
  countryName: string
  countrySlug: string
  countryCode: string
  stationCount: number
}

export type CityGuide = CityGuideSummary & {
  region: string
  relatedCities: CityGuideSummary[]
}
