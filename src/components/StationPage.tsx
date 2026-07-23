import { useEffect, useState, type MouseEvent } from 'react'
import { ArrowLeft, Broadcast, CursorClick, Heart, Pause, Play, ShareNetwork, TrendDown, TrendUp, WarningCircle } from '@phosphor-icons/react'
import { getStationBySlug, getStationByUuid } from '../api/radioBrowser'
import type { FavoritesController } from '../hooks/useFavorites'
import type { Navigate } from '../hooks/useAppNavigation'
import type { RadioPlayerController } from '../hooks/useRadioPlayer'
import type { SleepTimerController } from '../hooks/useSleepTimer'
import type { Station } from '../types'
import { getStationUrl, type StationRoute } from '../utils/stationUrl'
import { StationDetails } from './StationDetails'
import { StationLogo } from './StationLogo'
import { Footer } from './Footer'
import { setCanonicalUrl, setMetaTag, truncateSeoText } from '../utils/seo'
import { shareStation } from '../utils/share'
import { SleepTimerControl } from './SleepTimerControl'
import { getCountryUrl } from '../utils/countryUrl'
import { formatClicks, shouldShowClicks } from '../utils/formatClicks'
import { StationRecommendations } from './StationRecommendations'

type StationPageProps = {
  route: StationRoute
  player: RadioPlayerController
  favorites: FavoritesController
  sleepTimer: SleepTimerController
  navigate: Navigate
}

export function StationPage({ route, player, favorites, sleepTimer, navigate }: StationPageProps) {
  const [station, setStation] = useState<Station | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toggle, isFavorite } = favorites

  useEffect(() => {
    const controller = new AbortController()
    const request = route.type === 'legacy'
      ? getStationByUuid(route.stationUuid, controller.signal)
      : getStationBySlug(route.countryCode, route.slug, route.shortId, controller.signal)
    request
      .then(result => { if (!result) setError('Esta emisora ya no está disponible.'); else setStation(result) })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [route])

  useEffect(() => {
    if (!station) return
    const title = truncateSeoText(`Escuchar ${station.name} en directo | Vibe Radio`, 60)
    const location = station.state || station.country || 'online'
    const description = truncateSeoText(`Escucha ${station.name} en directo desde ${location}. Consulta género, país, calidad del stream y web oficial.`, 158)
    document.title = title
    setMetaTag('description', description)
    setMetaTag('robots', 'index,follow,max-image-preview:large')
    setMetaTag('og:title', title, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:type', 'website', true)
    setMetaTag('og:site_name', 'Vibe Radio', true)
    setMetaTag('og:locale', 'es_ES', true)
    setMetaTag('twitter:card', station.favicon ? 'summary_large_image' : 'summary')
    setMetaTag('twitter:title', title)
    setMetaTag('twitter:description', description)
    if (station.favicon) { setMetaTag('og:image', station.favicon, true); setMetaTag('twitter:image', station.favicon) }

    const canonicalUrl = setCanonicalUrl(getStationUrl(station))
    setMetaTag('og:url', canonicalUrl, true)
    if (window.location.pathname !== getStationUrl(station)) window.history.replaceState(null, '', getStationUrl(station))

    const schema = document.querySelector<HTMLScriptElement>('script[data-station-schema="true"]') ?? document.createElement('script')
    schema.type = 'application/ld+json'
    schema.dataset.stationSchema = 'true'
    const countryUrl = new URL(getCountryUrl(station.countrycode, station.country), window.location.origin).href
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'RadioStation',
          '@id': `${canonicalUrl}#station`,
          name: station.name,
          url: canonicalUrl,
          image: station.favicon || undefined,
          areaServed: station.state || station.country || undefined,
          inLanguage: station.language || undefined,
          sameAs: [station.homepage, station.instagram, station.facebook].filter(Boolean),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Emisoras', item: window.location.origin },
            { '@type': 'ListItem', position: 2, name: station.country || 'Online', item: countryUrl },
            { '@type': 'ListItem', position: 3, name: station.name, item: canonicalUrl },
          ],
        },
      ],
    })
    if (!schema.isConnected) document.head.appendChild(schema)
    return () => schema.remove()
  }, [station])

  const togglePlayback = () => {
    if (!station) return
    if (player.current?.stationuuid === station.stationuuid) void player.togglePlayback()
    else void player.playStation(station)
  }

  const isPlaying = Boolean(station && player.current?.stationuuid === station.stationuuid && player.playing)
  const formattedClicks = station ? formatClicks(station.clickcount) : '0'
  const showClicks = station ? shouldShowClicks(station.clickcount) : false
  const clickTrend = station?.clicktrend ?? 0
  const navigateFromLink = (event: MouseEvent<HTMLAnchorElement>, destination: string) => {
    event.preventDefault()
    navigate(destination)
  }

  return (
    <div className={`flex min-h-[100dvh] flex-col bg-[#090a0b] text-zinc-100 ${player.current ? 'pb-28' : ''}`}>
      <header className="border-b border-white/[.06]">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
          <a href="/" onClick={event => navigateFromLink(event, '/')} className="flex shrink-0 items-center gap-2 font-bold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-zinc-950"><Broadcast size={20} weight="bold" /></span><span className="hidden sm:inline">VIBE<span className="text-lime-300">RADIO</span></span></a>
          <div className="flex items-center gap-2">
            <SleepTimerControl timer={sleepTimer} />
            <a href="/" onClick={event => navigateFromLink(event, '/')} className="flex h-10 items-center gap-2 rounded-xl px-2 text-sm text-zinc-400 transition hover:bg-white/[.04] hover:text-white sm:px-3"><ArrowLeft size={17} /><span className="hidden sm:inline">Volver al directorio</span></a>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10 md:px-8 md:pt-16">
        {loading ? <div className="animate-pulse"><div className="h-5 w-36 rounded bg-zinc-800" /><div className="mt-8 h-56 rounded-2xl bg-zinc-900" /></div> : error || !station ? <div className="grid min-h-96 place-items-center text-center"><div><WarningCircle size={42} className="mx-auto text-zinc-600" /><h1 className="mt-5 text-2xl font-bold">No encontramos esta emisora</h1><p className="mt-2 text-zinc-500">{error}</p><a href="/" className="mt-6 inline-block rounded-xl bg-lime-300 px-5 py-3 text-sm font-bold text-zinc-950">Explorar emisoras</a></div></div> : <>
          <nav aria-label="Migas de pan" className="mb-8 text-sm text-zinc-600"><a href="/" onClick={event => navigateFromLink(event, '/')} className="hover:text-lime-300">Emisoras</a><span className="px-2">/</span><a href={getCountryUrl(station.countrycode, station.country)} onClick={event => navigateFromLink(event, getCountryUrl(station.countrycode, station.country))} className="transition hover:text-lime-300">{station.country || 'Online'}</a><span className="px-2">/</span><span className="text-zinc-400">{station.name}</span></nav>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <article><div className="flex flex-col gap-7 sm:flex-row sm:items-center"><StationLogo src={station.favicon} name={station.name} className="size-36 sm:size-44" /><div className="min-w-0"><p className="text-xs font-bold tracking-[.16em] text-lime-300">RADIO EN DIRECTO</p><h1 className="mt-3 text-4xl font-black leading-none tracking-[-.045em] sm:text-5xl">{station.name}</h1><p className="mt-4 text-zinc-400">{station.state || station.country || 'Emisora online'}{station.tags ? ` · ${station.tags.split(',').slice(0, 3).join(', ')}` : ''}</p>{showClicks && <div className="mt-4 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-lime-300/15 bg-lime-300/[.06] px-3 py-1.5 text-xs font-semibold text-lime-200"><CursorClick size={15} /> {formattedClicks} clics en las últimas 24 h</span>{clickTrend !== 0 && <span className={`inline-flex items-center gap-1 text-xs ${clickTrend > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>{clickTrend > 0 ? <TrendUp size={14} /> : <TrendDown size={14} />}{clickTrend > 0 ? '+' : ''}{clickTrend} respecto al día anterior</span>}</div>}<div className="mt-6 flex items-center gap-3"><button onClick={togglePlayback} className="flex h-12 items-center gap-2 rounded-xl bg-lime-300 px-5 font-bold text-zinc-950 transition hover:bg-lime-200 active:scale-[.98]">{isPlaying ? <Pause size={19} weight="fill" /> : <Play size={19} weight="fill" />} {isPlaying ? 'Pausar' : 'Escuchar ahora'}</button><button onClick={() => toggle(station)} aria-label="Cambiar favorito" className="grid size-12 place-items-center rounded-xl border border-white/10 text-zinc-400 transition hover:text-lime-300"><Heart size={20} weight={isFavorite(station.stationuuid) ? 'fill' : 'regular'} /></button><button onClick={() => void shareStation(station, player.track)} aria-label="Compartir emisora" className="grid size-12 place-items-center rounded-xl border border-white/10 text-zinc-400 transition hover:text-lime-300"><ShareNetwork size={20} /></button></div>{player.error && <p className="mt-4 text-sm text-red-400">{player.error}</p>}</div></div>
              <section className="mt-12 rounded-2xl bg-zinc-900/50 p-6"><h2 className="text-xl font-bold">Escuchar {station.name} online</h2><p className="mt-3 max-w-2xl leading-relaxed text-zinc-400">Sintoniza la emisión en directo de {station.name}{station.state ? ` desde ${station.state}` : ''}. El audio procede del stream público facilitado por la emisora o por el directorio Radio Browser.</p><dl className="mt-7 grid gap-5 sm:grid-cols-3"><div><dt className="text-xs text-zinc-600">País</dt><dd className="mt-1 text-sm">{station.country || 'No indicado'}</dd></div><div><dt className="text-xs text-zinc-600">Idioma</dt><dd className="mt-1 text-sm">{station.language || 'No indicado'}</dd></div><div><dt className="text-xs text-zinc-600">Calidad</dt><dd className="mt-1 text-sm">{station.codec || 'Audio online'}{station.bitrate ? ` · ${station.bitrate} kbps` : ''}</dd></div></dl></section>
            </article>
            <StationDetails station={station} track={player.track} history={player.history} />
          </div>
          <StationRecommendations station={station} player={player} favorites={favorites} navigate={navigate} />
        </>}
      </main>
      <Footer navigate={navigate} />
    </div>
  )
}
