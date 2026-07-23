import { GridFour, ListBullets, Radio } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import type { Station } from '../types'
import type { DirectoryView } from './DirectoryHeader'
import { StationCard } from './StationCard'
import { StationListItem } from './StationListItem'

type ResultsLayout = 'grid' | 'list'

type StationResultsProps = {
  view: DirectoryView
  stations: Station[]
  searched: string
  loading: boolean
  loadingMore: boolean
  error: string
  hasMore: boolean
  currentStationUuid?: string
  isFavorite: (stationUuid: string) => boolean
  onOpen: (station: Station) => void
  onPlay: (station: Station) => void
  onFavorite: (station: Station) => void
  onRetry: () => void
  onLoadMore: () => void
}

const LAYOUT_STORAGE_KEY = 'vibe-radio:results-layout'
const skeletons = Array.from({ length: 8 }, (_, index) => index)

function readLayout(): ResultsLayout {
  try {
    return localStorage.getItem(LAYOUT_STORAGE_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

export function StationResults(props: StationResultsProps) {
  const { view, stations, searched, loading, loadingMore, error, hasMore, currentStationUuid, isFavorite, onOpen, onPlay, onFavorite, onRetry, onLoadMore } = props
  const [layout, setLayout] = useState<ResultsLayout>(readLayout)
  const title = view === 'favorites' ? 'Tus emisoras' : searched ? `Resultados para “${searched}”` : 'Tendencias globales'

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, layout)
    } catch {
      return
    }
  }, [layout])

  return (
    <section className="min-w-0">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-100">{title}</p>
          <p className="mt-1 text-xs text-zinc-600">{loading ? 'Consultando el dial…' : `${stations.length} emisoras disponibles`}</p>
        </div>
        <div className="flex shrink-0 rounded-xl bg-white/[.04] p-1" aria-label="Formato de resultados">
          <button type="button" onClick={() => setLayout('grid')} aria-label="Ver como tarjetas" aria-pressed={layout === 'grid'} className={`grid size-11 place-items-center rounded-lg transition active:scale-[.96] sm:size-9 ${layout === 'grid' ? 'bg-white/10 text-lime-300' : 'text-zinc-600 hover:text-white'}`}><GridFour size={17} weight={layout === 'grid' ? 'fill' : 'regular'} /></button>
          <button type="button" onClick={() => setLayout('list')} aria-label="Ver como lista" aria-pressed={layout === 'list'} className={`grid size-11 place-items-center rounded-lg transition active:scale-[.96] sm:size-9 ${layout === 'list' ? 'bg-white/10 text-lime-300' : 'text-zinc-600 hover:text-white'}`}><ListBullets size={18} weight={layout === 'list' ? 'bold' : 'regular'} /></button>
        </div>
      </div>

      {loading ? (
        <div className={layout === 'grid' ? 'grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid gap-2'}>
          {skeletons.map(index => layout === 'grid'
            ? <div key={index} className="animate-pulse rounded-2xl border border-white/[.05] bg-zinc-900/40 p-3"><div className="aspect-square rounded-2xl bg-zinc-800/70" /><div className="mt-4 h-4 w-2/3 rounded bg-zinc-800" /><div className="mt-2 h-3 w-1/2 rounded bg-zinc-800/60" /></div>
            : <div key={index} className="flex animate-pulse items-center gap-4 rounded-xl border border-white/[.05] bg-zinc-900/40 p-3"><div className="size-16 rounded-2xl bg-zinc-800/70" /><div className="flex-1"><div className="h-4 w-1/3 rounded bg-zinc-800" /><div className="mt-2 h-3 w-1/2 rounded bg-zinc-800/60" /></div></div>)}
        </div>
      ) : error && !stations.length ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[.06] p-6">
          <p className="font-semibold text-red-300">No pudimos sintonizar el directorio</p>
          <p className="mt-2 text-sm text-zinc-400">{error}</p>
          <button onClick={onRetry} className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-950">Reintentar</button>
        </div>
      ) : stations.length ? (
        <>
          <div className={layout === 'grid' ? 'grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid gap-2'}>
            {stations.map(station => layout === 'grid'
              ? <StationCard key={station.stationuuid} station={station} favorite={isFavorite(station.stationuuid)} active={currentStationUuid === station.stationuuid} onOpen={() => onOpen(station)} onPlay={() => onPlay(station)} onFavorite={() => onFavorite(station)} />
              : <StationListItem key={station.stationuuid} station={station} favorite={isFavorite(station.stationuuid)} active={currentStationUuid === station.stationuuid} onOpen={() => onOpen(station)} onPlay={() => onPlay(station)} onFavorite={() => onFavorite(station)} />)}
          </div>
          {view === 'discover' && hasMore && <div className="flex justify-center py-10"><button onClick={onLoadMore} disabled={loadingMore} className="min-w-40 rounded-xl border border-white/10 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-lime-300/40 hover:text-lime-300 active:scale-[.98] disabled:cursor-wait disabled:opacity-60">{loadingMore ? 'Cargando…' : 'Cargar más'}</button></div>}
          {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}
        </>
      ) : (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/10 text-center">
          <div><Radio size={34} className="mx-auto text-zinc-700" /><p className="mt-4 font-semibold">{view === 'favorites' ? 'Aún no tienes favoritos' : 'No encontramos emisoras'}</p><p className="mt-2 text-sm text-zinc-600">{view === 'favorites' ? 'Pulsa el corazón de una emisora para guardarla.' : 'Prueba con otro nombre, país o región.'}</p></div>
        </div>
      )}
    </section>
  )
}
