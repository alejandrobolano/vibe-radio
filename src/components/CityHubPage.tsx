import { MapPin, MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { getCityGuideIndex } from '../api/cityGuides'
import type { Navigate } from '../hooks/useAppNavigation'
import type { RadioPlayerController } from '../hooks/useRadioPlayer'
import type { SleepTimerController } from '../hooks/useSleepTimer'
import type { CityGuideSummary } from '../types'
import { getCityUrl } from '../utils/cityUrl'
import { setCanonicalUrl, setMetaTag } from '../utils/seo'
import { ContentPageHeader } from './ContentPageHeader'
import { Footer } from './Footer'

type CityHubPageProps = {
  player: RadioPlayerController
  sleepTimer: SleepTimerController
  navigate: Navigate
}

const PAGE_SIZE = 48

export function CityHubPage({ player, sleepTimer, navigate }: CityHubPageProps) {
  const [cities, setCities] = useState<CityGuideSummary[]>([])
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const title = 'Emisoras de radio por ciudad y zona | Vibe Radio'
    const description = 'Explora emisoras de radio online por ciudad y zona. Encuentra radios locales populares y escucha sus emisiones en directo.'
    document.title = title
    setMetaTag('description', description)
    setMetaTag('robots', 'index,follow,max-image-preview:large')
    setMetaTag('og:title', title, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:url', setCanonicalUrl('/ciudades'), true)

    const controller = new AbortController()
    getCityGuideIndex(controller.signal)
      .then(setCities)
      .catch(() => setError('No pudimos cargar las ubicaciones ahora mismo.'))
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es')
    if (!term) return cities
    return cities.filter(city => `${city.name} ${city.countryName}`.toLocaleLowerCase('es').includes(term))
  }, [cities, query])
  const shown = filtered.slice(0, visibleCount)
  const go = (event: MouseEvent<HTMLAnchorElement>, destination: string) => { event.preventDefault(); navigate(destination) }

  return (
    <div className={`flex min-h-[100dvh] flex-col bg-[#090a0b] text-zinc-100 ${player.current ? 'pb-28' : ''}`}>
      <ContentPageHeader sleepTimer={sleepTimer} navigate={navigate} />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 md:px-8 md:py-16">
        <nav aria-label="Migas de pan" className="text-sm text-zinc-600"><a href="/" onClick={event => go(event, '/')} className="hover:text-lime-300">Emisoras</a><span className="px-2">/</span><span className="text-zinc-400">Ciudades y zonas</span></nav>
        <header className="mt-8 max-w-3xl"><div className="flex items-center gap-2 text-lime-300"><MapPin size={18} weight="fill" /><span className="text-xs font-bold tracking-[.16em]">EXPLORA POR UBICACIÓN</span></div><h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">Radio local, ciudad a ciudad</h1><p className="mt-4 max-w-[65ch] text-zinc-400">Guías creadas únicamente para ubicaciones con al menos diez emisoras disponibles. Busca una ciudad o una zona y descubre su radio más escuchada.</p></header>

        <label className="mt-8 flex max-w-xl items-center gap-3 rounded-xl border border-white/[.08] bg-white/[.03] px-4 focus-within:border-lime-300/40">
          <MagnifyingGlass size={19} className="text-zinc-500" aria-hidden="true" />
          <span className="sr-only">Buscar ciudad o país</span>
          <input value={query} onChange={event => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE) }} placeholder="Buscar ciudad o país" className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" />
        </label>

        {loading && <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cargando ubicaciones">{Array.from({ length: 9 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-white/[.04]" />)}</div>}
        {error && <p className="mt-10 rounded-xl border border-red-400/20 bg-red-400/[.06] p-4 text-sm text-red-300">{error}</p>}
        {!loading && !error && shown.length === 0 && <p className="mt-10 text-zinc-500">No encontramos una ubicación con ese nombre.</p>}
        {!loading && shown.length > 0 && <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shown.map(city => <a key={`${city.countryCode}-${city.slug}`} href={getCityUrl(city.countrySlug, city.slug)} onClick={event => go(event, getCityUrl(city.countrySlug, city.slug))} className="group flex min-w-0 items-center justify-between rounded-xl border border-white/[.07] bg-white/[.025] px-4 py-4 transition hover:border-lime-300/25 hover:bg-lime-300/[.035]"><span className="min-w-0"><span className="block truncate font-semibold group-hover:text-lime-300">{city.name}</span><span className="mt-1 block truncate text-xs text-zinc-600">{city.countryName}</span></span><span className="ml-4 shrink-0 text-xs text-zinc-600">{city.stationCount} radios</span></a>)}</div>}
        {visibleCount < filtered.length && <div className="mt-8 text-center"><button onClick={() => setVisibleCount(count => count + PAGE_SIZE)} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-lime-300/30 hover:text-lime-300 active:scale-[.98]">Cargar más ciudades</button></div>}
      </main>
      <Footer navigate={navigate} />
    </div>
  )
}
