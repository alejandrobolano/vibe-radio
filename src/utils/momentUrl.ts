import type { ListeningMomentSlug } from '../domain/listeningMoments'

export const MOMENTS_HUB_PATH = '/momentos'

export function getMomentUrl(slug: ListeningMomentSlug) {
  return `/momento/${slug}`
}

export function isMomentsHubPath(pathname: string) {
  return pathname === MOMENTS_HUB_PATH || pathname === `${MOMENTS_HUB_PATH}/`
}

export function getMomentSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/momento\/([a-z0-9-]+)\/?$/)
  return match?.[1] ?? null
}
