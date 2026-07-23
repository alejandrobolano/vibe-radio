import { Clock, Headphones } from '@phosphor-icons/react'
import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { getStationsPage } from '../api/radioBrowser'
import { getListeningMoment } from '../domain/listeningMoments'
import type { FavoritesController } from '../hooks/useFavorites'
import type { Navigate } from '../hooks/useAppNavigation'
import type { RadioPlayerController } from '../hooks/useRadioPlayer'
import type { SleepTimerController } from '../hooks/useSleepTimer'
import type { Station, StationFilters } from '../types'
import { getMomentUrl, MOMENTS_HUB_PATH } from '../utils/momentUrl'
import { setCanonicalUrl, setMetaTag } from '../utils/seo'
import { getStationUrl } from '../utils/stationUrl'
import { Footer } from './Footer'
import { ContentPageHeader } from './ContentPageHeader'
import { StationResults } from './StationResults'

type MomentPageProps = {
  slug: string
  player: RadioPlayerController
  favorites: FavoritesController
  sleepTimer: SleepTimerController
  navigate: Navigate
}

const filters: StationFilters = { continent: '', countryCode: '', countryName: '', region: '' }

export function MomentPage({ slug, player, favorites, sleepTimer, navigate }: MomentPageProps) {
  const moment = getListeningMoment(slug)
  const [stations, setStations] = useState<Station[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const loadFirstPage = useCallback(async (signal?: AbortSignal) => {
    if (!moment) return
    setLoading(true)
    setError('')
    try {
      const result = await getStationsPage(moment.query, filters, 0, signal)
      setStations(result.stations)
      setPage(0)
      setHasMore(result.hasMore)
    } catch (cause) {
      if (cause instanceof Error && cause.name !== 'AbortError') setError(cause.message)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [moment])

  useEffect(() => {
    const controller = new AbortController()
    void loadFirstPage(controller.signal)
    return () => controller.abort()
  }, [loadFirstPage])

  useEffect(() => {
    if (!moment) {
      document.title = 'Momento no encontrado | Vibe Radio'
      setMetaTag('robots', 'noindex,follow')
      return
    }
    const title = `${moment.name}: emisoras online en directo | Vibe Radio`
    const description = `${moment.description} Escucha gratis emisoras online en Vibe Radio.`
    document.title = title
    setMetaTag('description', description)
    setMetaTag('robots', 'index,follow,max-image-preview:large')
    setMetaTag('og:title', title, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:url', setCanonicalUrl(getMomentUrl(moment.slug)), true)
  }, [moment])

  const loadMore = async () => {
    if (!moment || loadingMore || !hasMore) return
    setLoadingMore(true)
    setError('')
    try {
      const nextPage = page + 1
      const result = await getStationsPage(moment.query, filters, nextPage)
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

  if (!moment) {
    return (
      <div className={`flex min-h-[100dvh] flex-col bg-[#090a0b] text-zinc-100 ${player.current ? 'pb-28' : ''}`}>
        <ContentPageHeader backHref={MOMENTS_HUB_PATH} backLabel="Momentos" navigate={navigate} sleepTimer={sleepTimer} />
        <main className="mx-auto grid w-full max-w-[1400px] flex-1 place-items-center px-4 py-16 text-center md:px-8"><div><Headphones size={38} className="mx-auto text-zinc-700" /><h1 className="mt-5 text-3xl font-black">Este momento no está en el dial</h1><p className="mt-3 text-zinc-500">Explora las selecciones disponibles y encuentra una que encaje contigo.</p><a href={MOMENTS_HUB_PATH} onClick={event => go(event, MOMENTS_HUB_PATH)} className="mt-7 inline-flex rounded-xl bg-lime-300 px-5 py-3 text-sm font-bold text-zinc-950">Ver todos los momentos</a></div></main>
        <Footer navigate={navigate} />
      </div>
    )
  }

  return (
    <div className={`flex min-h-[100dvh] flex-col bg-[#090a0b] text-zinc-100 ${player.current ? 'pb-28' : ''}`}>
      <ContentPageHeader backHref={MOMENTS_HUB_PATH} backLabel="Momentos" navigate={navigate} sleepTimer={sleepTimer} />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 md:px-8 md:py-16">
        <nav aria-label="Migas de pan" className="flex flex-wrap items-center text-sm text-zinc-600"><a href="/" onClick={event => go(event, '/')} className="hover:text-lime-300">Emisoras</a><span className="px-2">/</span><a href={MOMENTS_HUB_PATH} onClick={event => go(event, MOMENTS_HUB_PATH)} className="hover:text-lime-300">Momentos</a><span className="px-2">/</span><span className="text-zinc-400">{moment.name.replace('Radio para ', '')}</span></nav>
        <header className="mb-10 mt-8 max-w-3xl md:mb-14">
          <p className="text-xs font-bold tracking-[.16em] text-lime-300">{moment.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl md:text-6xl">{moment.name}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">{moment.description}</p>
          {moment.timerMinutes && (
            <button type="button" onClick={() => sleepTimer.start(moment.timerMinutes ?? 30)} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-lime-300/30 hover:text-lime-300">
              <Clock size={17} /> Temporizador recomendado: {moment.timerMinutes} min
            </button>
          )}
        </header>
        <StationResults view="discover" stations={stations} searched={moment.searchLabel} loading={loading} loadingMore={loadingMore} error={error} hasMore={hasMore} currentStationUuid={player.current?.stationuuid} isFavorite={favorites.isFavorite} onOpen={station => navigate(getStationUrl(station))} onPlay={station => void player.playStation(station)} onFavorite={favorites.toggle} onRetry={() => void loadFirstPage()} onLoadMore={() => void loadMore()} />
      </main>
      <Footer navigate={navigate} />
    </div>
  )
}
