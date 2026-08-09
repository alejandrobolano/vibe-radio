export type Webcam = {
  id: number
  title: string
  status: 'active' | 'inactive'
  viewCount: number
  lastUpdatedOn: string
  imageUrl: string
  daylightImageUrl: string
  location: {
    city: string
    region: string
    country: string
    latitude: number | null
    longitude: number | null
  }
  categories: string[]
  detailUrl: string
}

export type WebcamDirectory = {
  total: number
  webcams: Webcam[]
  refreshedAt: string
}

export const BADALONA_WEBCAMS_PATH = '/camaras/badalona'
export const WEBCAM_REFRESH_INTERVAL = 8 * 60 * 1_000
