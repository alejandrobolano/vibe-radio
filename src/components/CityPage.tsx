import { MapPin } from '@phosphor-icons/react'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { getCityGuide } from '../api/cityGuides'
import { getStationsPage } from '../api/radioBrowser'
import type { FavoritesController } from '../hooks/useFavorites'
import type { Navigate } from '../hooks/useAppNavigation'
import type { RadioPlayerController } from '../hooks/useRadioPlayer'
import type { SleepTimerController } from '../hooks/useSleepTimer'
import type { CityGuide, Station, StationFilters } from '../types'
import { getCityUrl, type CityRoute } from '../utils/cityUrl'
import { getCountryUrl } from '../utils/countryUrl'
import { setCanonicalUrl, setMetaTag } from '../utils/seo'
import { getStationUrl } from '../utils/stationUrl'
import { ContentPageHeader } from './ContentPageHeader'
import { Footer } from './Footer'
import { StationResults } from './StationResults'

type CityPageProps = {
  route: CityRoute
  player: RadioPlayerController
  favorites: FavoritesController
  sleepTimer: SleepTimerController
  navigate: Navigate
}

export function CityPage({ route, player, favorites, sleepTimer, navigate }: CityPageProps) {
  const [guide, setGuide] = useState<CityGuide | null>(null)
  const [stations, setStations] = useState<Station[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const filters = useMemo<StationFilters>(() => ({
    continent: '',
    countryCode: guide?.countryCode ?? '',
    countryName: guide?.countryName ?? '',
    region: guide?.region ?? '',
  }), [guide])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    getCityGuide(route.countrySlug, route.citySlug, controller.signal)
      .then(async result => {
        if (!result) throw new Error('No encontramos suficientes emisoras verificadas en esta ubicación.')
        setGuide(result)
        const nextFilters = { continent: '', countryCode: result.countryCode, countryName: result.countryName, region: result.region }
        const stationPage = await getStationsPage('', nextFilters, 0, controller.signal)
        setStations(stationPage.stations)
        setHasMore(stationPage.hasMore)
      })
      .catch(cause => { if (cause instanceof Error && cause.name !== 'AbortError') setError(cause.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [route.citySlug, route.countrySlug])

  useEffect(() => {
    if (!guide) return
    const title = `Emisoras de radio de ${guide.name} en directo | Vibe Radio`
    const description = `Escucha ${guide.stationCount} emisoras de ${guide.name}, ${guide.countryName}, online y en directo. Música, noticias y programas locales.`
    document.title = title
    setMetaTag('description', description)
    setMetaTag('robots', 'index,follow,max-image-preview:large')
    setMetaTag('og:title', title, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:url', setCanonicalUrl(getCityUrl(guide.countrySlug, guide.slug)), true)
  }, [guide])

  const loadMore = async () => {
    if (!guide || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const result = await getStationsPage('', filters, nextPage)
      setStations(current => [...new Map([...current, ...result.stations].map(station => [station.stationuuid, station])).values()])
      setPage(nextPage)
      setHasMore(result.hasMore)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar más emisoras.')
    } finally {
      setLoadingMore(false)
    }
  }

  const go = (event: MouseEvent<HTMLAnchorElement>, destination: string) => {
    event.preventDefault()
    navigate(destination)
  }

  return (
    <div className={`flex min-h-[100dvh] flex-col bg-[#090a0b] text-zinc-100 ${player.current ? 'pb-28' : ''}`}>
      <ContentPageHeader sleepTimer={sleepTimer} navigate={navigate} />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 md:px-8 md:py-16">
        <nav aria-label="Migas de pan" className="text-sm text-zinc-600">
          <a href="/" onClick={event => go(event, '/')} className="hover:text-lime-300">Emisoras</a>
          <span className="px-2">/</span>
          {guide && <><a href={getCountryUrl(guide.countryCode, guide.countryName)} onClick={event => go(event, getCountryUrl(guide.countryCode, guide.countryName))} className="hover:text-lime-300">{guide.countryName}</a><span className="px-2">/</span></>}
          <span className="text-zinc-400">{guide?.name ?? 'Ubicación'}</span>
        </nav>

        <header className="mb-10 mt-8 max-w-3xl">
          <div className="flex items-center gap-2 text-lime-300"><MapPin size={18} weight="fill" /><span className="text-xs font-bold tracking-[.16em]">RADIO LOCAL</span></div>
          <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">Emisoras de radio de {guide?.name ?? 'esta ubicación'}</h1>
          <p className="mt-4 max-w-[65ch] text-zinc-400">Escucha emisoras que declaran emitir desde {guide?.name ?? 'esta zona'}. El orden prioriza la popularidad registrada y la disponibilidad reciente del stream.</p>
          {guide && <p className="mt-4 text-sm text-zinc-600">{guide.stationCount} emisoras en el catálogo · {guide.countryName}</p>}
        </header>

        <StationResults view="discover" stations={stations} searched={guide?.name ?? ''} loading={loading} loadingMore={loadingMore} error={error} hasMore={hasMore} currentStationUuid={player.current?.stationuuid} isFavorite={favorites.isFavorite} onOpen={station => navigate(getStationUrl(station))} onPlay={station => void player.playStation(station)} onFavorite={favorites.toggle} onRetry={() => window.location.reload()} onLoadMore={() => void loadMore()} />

        {guide && guide.relatedCities.length > 0 && (
          <section className="mt-14 border-t border-white/[.06] pt-8">
            <h2 className="text-xl font-bold">Más radio cerca de {guide.name}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {guide.relatedCities.map(city => <a key={`${city.countryCode}-${city.slug}`} href={getCityUrl(city.countrySlug, city.slug)} onClick={event => go(event, getCityUrl(city.countrySlug, city.slug))} className="rounded-xl border border-white/[.08] px-3 py-2 text-sm text-zinc-400 transition hover:border-lime-300/30 hover:text-lime-300">Radios de {city.name} <span className="text-zinc-600">{city.stationCount}</span></a>)}
            </div>
          </section>
        )}
      </main>
      <Footer navigate={navigate} />
    </div>
  )
}
