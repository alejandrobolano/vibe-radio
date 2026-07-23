import { ArrowLeft, Broadcast, MapPin } from '@phosphor-icons/react'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { getCountries, getStationsPage } from '../api/radioBrowser'
import { getCityGuideIndex } from '../api/cityGuides'
import type { FavoritesController } from '../hooks/useFavorites'
import type { Navigate } from '../hooks/useAppNavigation'
import type { RadioPlayerController } from '../hooks/useRadioPlayer'
import type { SleepTimerController } from '../hooks/useSleepTimer'
import type { CityGuideSummary, Country, Station, StationFilters } from '../types'
import { getCityUrl } from '../utils/cityUrl'
import { getCountryName, getCountryUrl } from '../utils/countryUrl'
import { setCanonicalUrl, setMetaTag } from '../utils/seo'
import { getStationUrl, slugifyStation } from '../utils/stationUrl'
import { Footer } from './Footer'
import { SleepTimerControl } from './SleepTimerControl'
import { StationResults } from './StationResults'

type CountryPageProps = {
  slug: string
  player: RadioPlayerController
  favorites: FavoritesController
  sleepTimer: SleepTimerController
  navigate: Navigate
}

export function CountryPage({ slug, player, favorites, sleepTimer, navigate }: CountryPageProps) {
  const [country, setCountry] = useState<Country | null>(null)
  const [stations, setStations] = useState<Station[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [cities, setCities] = useState<CityGuideSummary[]>([])
  const filters = useMemo<StationFilters>(() => ({ continent: '', countryCode: country?.iso_3166_1 ?? '', countryName: country?.name ?? '', region: '' }), [country])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    getCountries(controller.signal)
      .then(list => {
        const match = list.find(item => slugifyStation(getCountryName(item.iso_3166_1, item.name)) === slug)
        if (!match) throw new Error('No encontramos este país en el directorio.')
        setCountry(match)
        return getStationsPage('', { continent: '', countryCode: match.iso_3166_1, countryName: match.name, region: '' }, 0, controller.signal)
      })
      .then(result => { setStations(result.stations); setHasMore(result.hasMore) })
      .catch(cause => { if (cause instanceof Error && cause.name !== 'AbortError') setError(cause.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [slug])

  useEffect(() => {
    if (!country) return
    const controller = new AbortController()
    getCityGuideIndex(controller.signal)
      .then(items => setCities(items.filter(city => city.countryCode === country.iso_3166_1).slice(0, 12)))
      .catch(() => undefined)
    return () => controller.abort()
  }, [country])

  useEffect(() => {
    if (!country) return
    const name = getCountryName(country.iso_3166_1, country.name)
    const title = `Emisoras de radio de ${name} en directo | Vibe Radio`
    const description = `Escucha emisoras de radio de ${name} online y en directo. Descubre música, noticias y programas, y guarda tus favoritas.`
    document.title = title
    setMetaTag('description', description)
    setMetaTag('robots', 'index,follow,max-image-preview:large')
    setMetaTag('og:title', title, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:url', setCanonicalUrl(getCountryUrl(country.iso_3166_1, country.name)), true)
  }, [country])

  const loadMore = async () => {
    if (!country || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const result = await getStationsPage('', filters, nextPage)
      setStations(current => [...new Map([...current, ...result.stations].map(station => [station.stationuuid, station])).values()])
      setPage(nextPage)
      setHasMore(result.hasMore)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar más emisoras.')
    } finally { setLoadingMore(false) }
  }

  const go = (event: MouseEvent<HTMLAnchorElement>, destination: string) => { event.preventDefault(); navigate(destination) }
  const countryName = country ? getCountryName(country.iso_3166_1, country.name) : ''

  return (
    <div className={`flex min-h-[100dvh] flex-col bg-[#090a0b] text-zinc-100 ${player.current ? 'pb-28' : ''}`}>
      <header className="border-b border-white/[.06]"><div className="mx-auto flex h-18 max-w-[1400px] items-center justify-between px-4 md:px-8"><a href="/" onClick={event => go(event, '/')} className="flex items-center gap-2 font-bold"><span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-zinc-950"><Broadcast size={20} weight="bold" /></span>VIBE<span className="-ml-2 text-lime-300">RADIO</span></a><div className="flex items-center gap-2"><SleepTimerControl timer={sleepTimer} /><a href="/" onClick={event => go(event, '/')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={17} />Directorio</a></div></div></header>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 md:px-8 md:py-16">
        <nav aria-label="Migas de pan" className="text-sm text-zinc-600"><a href="/" onClick={event => go(event, '/')} className="hover:text-lime-300">Emisoras</a><span className="px-2">/</span><span className="text-zinc-400">{countryName || 'País'}</span></nav>
        <header className="mb-10 mt-8 max-w-3xl"><p className="text-xs font-bold tracking-[.16em] text-lime-300">RADIO POR PAÍS</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">Emisoras de radio de {countryName || 'todo el mundo'}</h1><p className="mt-4 text-zinc-400">Escucha en directo música, noticias y programas de {countryName || 'este país'}. La disponibilidad depende del stream público de cada emisora.</p></header>
        <StationResults view="discover" stations={stations} searched="" loading={loading} loadingMore={loadingMore} error={error} hasMore={hasMore} currentStationUuid={player.current?.stationuuid} isFavorite={favorites.isFavorite} onOpen={station => navigate(getStationUrl(station))} onPlay={station => void player.playStation(station)} onFavorite={favorites.toggle} onRetry={() => window.location.reload()} onLoadMore={() => void loadMore()} />
        {cities.length > 0 && <section className="mt-14 border-t border-white/[.06] pt-8"><div className="flex items-center gap-2 text-lime-300"><MapPin size={18} weight="fill" /><h2 className="text-xl font-bold text-zinc-100">Radio por ciudad y zona</h2></div><p className="mt-2 text-sm text-zinc-500">Ubicaciones de {countryName} con al menos diez emisoras disponibles.</p><div className="mt-5 flex flex-wrap gap-2">{cities.map(city => <a key={city.slug} href={getCityUrl(city.countrySlug, city.slug)} onClick={event => go(event, getCityUrl(city.countrySlug, city.slug))} className="rounded-xl border border-white/[.08] px-3 py-2 text-sm text-zinc-400 transition hover:border-lime-300/30 hover:text-lime-300">Radios de {city.name} <span className="text-zinc-600">{city.stationCount}</span></a>)}</div></section>}
      </main>
      <Footer navigate={navigate} />
    </div>
  )
}
