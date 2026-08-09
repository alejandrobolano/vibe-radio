import { ArrowsClockwise, Camera, ClockCounterClockwise, Eye, Globe, LinkSimple, MapPin, Tag, WarningCircle } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { getBadalonaWebcams } from '../api/webcams'
import { BADALONA_WEBCAMS_PATH, WEBCAM_REFRESH_INTERVAL, type Webcam } from '../domain/webcam'
import type { Navigate } from '../hooks/useAppNavigation'
import type { RadioPlayerController } from '../hooks/useRadioPlayer'
import type { SleepTimerController } from '../hooks/useSleepTimer'
import { useWebcamFrame } from '../hooks/useWebcamFrame'
import { setCanonicalUrl, setMetaTag } from '../utils/seo'
import { ContentPageHeader } from './ContentPageHeader'
import { Footer } from './Footer'

type BadalonaWebcamsPageProps = {
  player: RadioPlayerController
  sleepTimer: SleepTimerController
  navigate: Navigate
}

function formatUpdatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Actualización reciente'
  return `Actualizada ${new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(Math.round((date.getTime() - Date.now()) / 60_000), 'minute')}`
}

type PlayerPeriod = keyof Webcam['player']
type ViewerMode = 'current' | PlayerPeriod

const PLAYER_PERIODS: Array<{ key: PlayerPeriod; label: string }> = [
  { key: 'live', label: 'En directo' },
  { key: 'day', label: 'Últimas 24 h' },
  { key: 'month', label: 'Último mes' },
  { key: 'year', label: 'Último año' },
  { key: 'lifetime', label: 'Histórico' },
]

function initialViewerMode(webcam: Webcam): ViewerMode {
  return PLAYER_PERIODS.find(period => webcam.player[period.key])?.key || 'current'
}

function WebcamDetails({ webcam }: { webcam: Webcam }) {
  const coordinates = webcam.location.latitude !== null && webcam.location.longitude !== null
    ? `${webcam.location.latitude.toFixed(4)}, ${webcam.location.longitude.toFixed(4)}`
    : 'No disponibles'
  const location = [webcam.location.city, webcam.location.region, webcam.location.country, webcam.location.continent].filter(Boolean).join(' · ')

  return (
    <section aria-labelledby="camera-details-title" className="mt-5 rounded-2xl border border-white/[.08] bg-white/[.025] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold tracking-[.14em] text-lime-300">INFORMACIÓN DE LA CÁMARA</p><h2 id="camera-details-title" className="mt-2 text-xl font-bold">{webcam.title}</h2></div>
        <span className="rounded-full border border-lime-300/20 bg-lime-300/[.06] px-3 py-1.5 text-xs font-semibold text-lime-300">Activa</span>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="text-xs text-zinc-600">Ubicación</dt><dd className="mt-1 text-sm text-zinc-300">{location || 'No disponible'}</dd></div>
        <div><dt className="text-xs text-zinc-600">Coordenadas</dt><dd className="mt-1 text-sm text-zinc-300">{coordinates}</dd></div>
        <div><dt className="text-xs text-zinc-600">Resolución disponible</dt><dd className="mt-1 text-sm text-zinc-300">{webcam.imageWidth && webcam.imageHeight ? `${webcam.imageWidth} × ${webcam.imageHeight} px` : 'No indicada'}</dd></div>
        <div><dt className="text-xs text-zinc-600">Identificador Windy</dt><dd className="mt-1 text-sm text-zinc-300">{webcam.id}</dd></div>
      </dl>
      {webcam.categories.length > 0 && <div className="mt-6 flex flex-wrap items-center gap-2"><Tag size={16} className="text-zinc-600" />{webcam.categories.map(category => <span key={category} className="rounded-full bg-white/[.05] px-3 py-1 text-xs text-zinc-400">{category}</span>)}</div>}
      <div className="mt-6 flex flex-wrap gap-3 border-t border-white/[.06] pt-5 text-sm">
        {webcam.detailUrl && <a href={webcam.detailUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-lime-300 hover:text-lime-200"><Globe size={17} /> Ficha original en Windy</a>}
        {webcam.editUrl && <a href={webcam.editUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300"><LinkSimple size={17} /> Actualizar información</a>}
      </div>
    </section>
  )
}

function CameraViewer({ webcam }: { webcam: Webcam }) {
  const [imageFailed, setImageFailed] = useState(false)
  const preferredMode = initialViewerMode(webcam)
  const [viewerMode, setViewerMode] = useState<ViewerMode>(() => preferredMode)
  const { frameUrl, frameRevision, checking, lastChangedAt } = useWebcamFrame(webcam.imageUrl)
  const availablePeriods = PLAYER_PERIODS.filter(period => webcam.player[period.key])

  useEffect(() => {
    setImageFailed(false)
    setViewerMode(preferredMode)
  }, [webcam.id, webcam.imageUrl, preferredMode])

  return (
    <>
      <section aria-label={`Visor de ${webcam.title}`} className="overflow-hidden rounded-2xl border border-white/[.08] bg-zinc-950">
        <div className="flex gap-2 overflow-x-auto border-b border-white/[.07] p-3" aria-label="Periodo de reproducción">
          <button type="button" onClick={() => setViewerMode('current')} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${viewerMode === 'current' ? 'bg-lime-300 text-zinc-950' : 'bg-white/[.04] text-zinc-400 hover:text-white'}`}>Ahora</button>
          {availablePeriods.map(period => <button key={period.key} type="button" onClick={() => setViewerMode(period.key)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${viewerMode === period.key ? 'bg-lime-300 text-zinc-950' : 'bg-white/[.04] text-zinc-400 hover:text-white'}`}>{period.key !== 'live' && <ClockCounterClockwise size={14} className="mr-1.5 inline" />}{period.label}</button>)}
        </div>
        <div className="relative aspect-video min-h-64 overflow-hidden bg-zinc-900 sm:min-h-[32rem]">
          {viewerMode !== 'current' ? (
            <iframe key={`${webcam.id}-${viewerMode}`} src={webcam.player[viewerMode]} title={`${PLAYER_PERIODS.find(period => period.key === viewerMode)?.label} de ${webcam.title}`} className="size-full border-0" allow="autoplay; fullscreen" allowFullScreen loading="eager" referrerPolicy="strict-origin-when-cross-origin" />
          ) : !imageFailed ? (
            <a href={webcam.detailUrl || 'https://www.windy.com/webcams'} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${webcam.title} en Windy`} className="grid size-full place-items-center">
              <img key={`${webcam.id}-${frameRevision}`} src={frameUrl} width={webcam.imageWidth || undefined} height={webcam.imageHeight || undefined} onError={() => setImageFailed(true)} alt={`Vista actual de ${webcam.title}, cerca de Badalona`} className="webcam-live-image max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
              <span className="webcam-scanline" aria-hidden="true" />
            </a>
          ) : (
            <div className="grid size-full place-items-center px-6 text-center text-zinc-500"><div><WarningCircle size={38} className="mx-auto" /><p className="mt-3 text-sm">La imagen temporal de esta cámara ha caducado o no está disponible.</p></div></div>
          )}
          {viewerMode === 'current' && <><div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/65 to-transparent p-4"><span className="inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold tracking-wide text-white backdrop-blur"><span className="size-2 animate-pulse rounded-full bg-red-500" /> VISTA ACTUAL</span><span className="rounded-full bg-black/55 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur">{formatUpdatedAt(webcam.lastUpdatedOn)}</span></div><div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 pt-20"><h2 id="active-camera-title" className="text-xl font-bold text-white sm:text-2xl">{webcam.title}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-300"><MapPin size={15} weight="fill" /> {[webcam.location.city, webcam.location.region].filter(Boolean).join(', ') || 'Badalona'}</p></div></>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-zinc-500"><span className="flex items-center gap-1.5"><Eye size={15} /> {new Intl.NumberFormat('es-ES').format(webcam.viewCount)} visualizaciones en Windy</span>{viewerMode === 'current' ? <span className="flex items-center gap-1.5"><ArrowsClockwise size={14} className={checking ? 'animate-spin text-lime-300' : ''} /> {lastChangedAt ? `Fotograma renovado a las ${lastChangedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : 'Buscando el fotograma más reciente'}</span> : <span>Reproductor histórico proporcionado por Windy</span>}</div>
      </section>
      <WebcamDetails webcam={webcam} />
    </>
  )
}

export function BadalonaWebcamsPage({ player, sleepTimer, navigate }: BadalonaWebcamsPageProps) {
  const [webcams, setWebcams] = useState<Webcam[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const requestRef = useRef<AbortController | null>(null)

  const load = useCallback(async (background = false) => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    if (background) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const directory = await getBadalonaWebcams(controller.signal)
      setWebcams(directory.webcams)
      setSelectedId(current => directory.webcams.some(webcam => webcam.id === current) ? current : directory.webcams[0]?.id ?? null)
    } catch (reason) {
      if (!controller.signal.aborted && !background) setError(reason instanceof Error ? reason.message : 'No pudimos cargar las cámaras ahora mismo.')
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    const title = 'Cámaras de Badalona en directo | Vibe Radio'
    const description = 'Consulta cámaras y vistas actualizadas de Badalona mientras sigues escuchando tu emisora favorita en Vibe Radio.'
    document.title = title
    setMetaTag('description', description)
    setMetaTag('robots', 'index,follow,max-image-preview:large')
    setMetaTag('og:title', title, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:url', setCanonicalUrl(BADALONA_WEBCAMS_PATH), true)
    setMetaTag('twitter:title', title)
    setMetaTag('twitter:description', description)
  }, [])

  useEffect(() => {
    void load()
    const interval = window.setInterval(() => void load(true), WEBCAM_REFRESH_INTERVAL)
    return () => {
      window.clearInterval(interval)
      requestRef.current?.abort()
    }
  }, [load])

  const selected = useMemo(() => webcams.find(webcam => webcam.id === selectedId) || webcams[0] || null, [selectedId, webcams])
  const go = (event: MouseEvent<HTMLAnchorElement>, destination: string) => { event.preventDefault(); navigate(destination) }

  return (
    <div className={`flex min-h-[100dvh] flex-col bg-[#090a0b] text-zinc-100 ${player.current ? 'pb-28' : ''}`}>
      <ContentPageHeader sleepTimer={sleepTimer} navigate={navigate} />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 md:px-8 md:py-14">
        <nav aria-label="Migas de pan" className="text-sm text-zinc-600"><a href="/" onClick={event => go(event, '/')} className="hover:text-lime-300">Emisoras</a><span className="px-2">/</span><span className="text-zinc-400">Cámaras de Badalona</span></nav>
        <header className="mt-8 max-w-3xl">
          <div className="flex items-center gap-2 text-lime-300"><Camera size={19} weight="fill" /><span className="text-xs font-bold tracking-[.16em]">BADALONA AHORA</span></div>
          <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">Cámaras de Badalona</h1>
          <p className="mt-4 max-w-[65ch] leading-7 text-zinc-400">Observa distintas zonas de Badalona mediante imágenes actualizadas y una presentación continua, sin interrumpir la radio que estés escuchando.</p>
        </header>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block min-w-0 flex-1 sm:max-w-lg"><span className="mb-2 block text-xs font-semibold text-zinc-500">Selecciona una cámara</span><select value={selectedId ?? ''} onChange={event => setSelectedId(Number(event.target.value))} disabled={loading || webcams.length === 0} className="h-12 w-full rounded-xl border border-white/[.09] bg-zinc-900 px-4 text-sm text-white outline-none transition focus:border-lime-300/40 disabled:opacity-50">{webcams.map(webcam => <option key={webcam.id} value={webcam.id}>{webcam.title}</option>)}</select></label>
          <button type="button" onClick={() => void load(true)} disabled={loading || refreshing} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition hover:border-lime-300/30 hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-50"><ArrowsClockwise size={17} className={refreshing ? 'animate-spin' : ''} /> Actualizar vistas</button>
        </div>

        {loading && <div className="mt-6 overflow-hidden rounded-2xl border border-white/[.06] bg-white/[.025]" aria-label="Cargando cámaras"><div className="aspect-video min-h-64 animate-pulse bg-white/[.04] sm:min-h-96" /><div className="h-12 animate-pulse border-t border-white/[.05]" /></div>}
        {!loading && error && <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/[.06] p-6 text-center"><WarningCircle size={34} className="mx-auto text-red-300" /><p className="mt-3 text-sm text-red-200">{error}</p><button onClick={() => void load()} className="mt-4 rounded-xl border border-red-300/20 px-4 py-2 text-sm font-semibold text-red-100">Reintentar</button></div>}
        {!loading && !error && !selected && <p className="mt-6 rounded-2xl border border-white/[.07] p-6 text-zinc-500">Windy no ha devuelto cámaras activas dentro del radio seleccionado.</p>}
        {!loading && !error && selected && <div className="mt-6"><CameraViewer webcam={selected} /></div>}

        <section className="mt-8 grid gap-4 border-t border-white/[.06] pt-8 md:grid-cols-2">
          <div><h2 className="font-bold">Cómo funciona esta vista</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Windy facilita fotogramas recientes, no un flujo de vídeo continuo. Vibe Radio respeta el intervalo de caché indicado por Windy, muestra cada cambio real con una transición suave y renueva periódicamente los enlaces temporales.</p></div>
          <div><h2 className="font-bold">Fuente y disponibilidad</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Las imágenes y su disponibilidad dependen de cada operador. Cámaras proporcionadas por <a href="https://www.windy.com/" target="_blank" rel="noopener noreferrer" className="text-lime-300 hover:text-lime-200">Windy.com</a> · <a href="https://www.windy.com/webcams/add" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white">Añadir una cámara</a>.</p></div>
        </section>
      </main>
      <Footer navigate={navigate} />
    </div>
  )
}
