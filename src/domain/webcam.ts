export type Webcam = {
  id: number
  title: string
  status: 'active' | 'inactive'
  viewCount: number
  lastUpdatedOn: string
  imageUrl: string
  daylightImageUrl: string
  imageWidth: number | null
  imageHeight: number | null
  clusterSize: number
  location: {
    city: string
    region: string
    regionCode: string
    country: string
    countryCode: string
    continent: string
    continentCode: string
    latitude: number | null
    longitude: number | null
  }
  categories: string[]
  player: {
    live: string
    day: string
    month: string
    year: string
    lifetime: string
  }
  detailUrl: string
  editUrl: string
}

export type WebcamDirectory = {
  total: number
  webcams: Webcam[]
  refreshedAt: string
}

export const BADALONA_WEBCAMS_PATH = '/camaras/badalona'
export const WEBCAM_REFRESH_INTERVAL = 8 * 60 * 1_000
