import { ArrowSquareOut, CursorClick, Heart, Play, ThumbsUp } from '@phosphor-icons/react'
import type { Station } from '../types'
import { formatClicks, formatCompactClicks, formatCompactCount, shouldShowClicks } from '../utils/formatClicks'
import { getStationUrl } from '../utils/stationUrl'
import { StationLogo } from './StationLogo'

type StationCardProps = {
  station: Station
  favorite: boolean
  active: boolean
  onOpen: () => void
  onPlay: () => void
  onFavorite: () => void
}

export function StationCard({ station, favorite, active, onOpen, onPlay, onFavorite }: StationCardProps) {
  const tags = station.tags.split(',').filter(Boolean).slice(0, 2)
  const stationUrl = getStationUrl(station)

  return (
    <article role="link" tabIndex={0} aria-label={`Ver ${station.name}`} onClick={onOpen} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen() } }} className={`group grid min-w-0 cursor-pointer grid-cols-[6.5rem_minmax(0,1fr)] gap-3 rounded-2xl border p-3 transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-lime-300 min-[480px]:block min-[480px]:gap-0 sm:hover:-translate-y-0.5 ${active ? 'border-lime-300/50 bg-lime-300/[.06]' : 'border-white/[.07] bg-zinc-900/45 hover:border-white/15 hover:bg-zinc-900'}`}>
      <div className="relative self-start">
        <StationLogo src={station.favicon} name={station.name} className="aspect-square w-full" />
        <button onClick={event => { event.stopPropagation(); onPlay() }} aria-label={`Escuchar ${station.name}`} className="absolute bottom-2 right-2 grid size-11 place-items-center rounded-full bg-lime-300 text-zinc-950 shadow-lg shadow-black/30 transition group-hover:scale-105 active:scale-95 min-[480px]:bottom-3 min-[480px]:right-3"><Play size={18} weight="fill" /></button>
        <button onClick={event => { event.stopPropagation(); onFavorite() }} aria-label={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'} className="absolute right-2 top-2 grid size-10 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:text-lime-300 active:scale-95 min-[480px]:right-3 min-[480px]:top-3 min-[480px]:size-9"><Heart size={18} weight={favorite ? 'fill' : 'regular'} className={favorite ? 'text-lime-300' : ''} /></button>
      </div>
      <div className="min-w-0 py-1 min-[480px]:px-1 min-[480px]:pb-1 min-[480px]:pt-4">
        <h3 className="truncate font-semibold tracking-tight text-zinc-100">{station.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 min-[480px]:truncate">{station.state || station.country || 'Radio online'}{station.codec ? ` · ${station.codec} ${station.bitrate || ''}` : ''}</p>
        <div className="mt-1.5 flex min-h-4 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold">
          {shouldShowClicks(station.clickcount) && <span title={`${formatClicks(station.clickcount)} clics en las últimas 24 horas`} className="flex items-center gap-1.5 text-lime-300/80"><CursorClick size={14} /> {formatCompactClicks(station.clickcount)} clics <span className="font-normal text-zinc-600">· 24 h</span></span>}
          {station.votes > 0 && <span title={`${formatClicks(station.votes)} votos en Radio Browser`} className="flex items-center gap-1 text-zinc-500"><ThumbsUp size={13} /> {formatCompactCount(station.votes)} votos</span>}
        </div>
        <div className="mt-2 hidden min-h-6 gap-1.5 overflow-hidden min-[360px]:flex min-[480px]:mt-3">{tags.length ? tags.map(tag => <span key={tag} className="max-w-24 truncate rounded-md bg-white/[.06] px-2 py-1 text-[10px] text-zinc-400">{tag}</span>) : <span className="text-[11px] text-zinc-600">Sin género indicado</span>}</div>
        <a href={stationUrl} onClick={event => { event.preventDefault(); event.stopPropagation(); onOpen() }} className="mt-2 flex min-h-8 items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-lime-300 min-[480px]:mt-3">Ver emisora <ArrowSquareOut size={14} /></a>
      </div>
    </article>
  )
}
