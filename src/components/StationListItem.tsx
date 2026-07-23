import { ArrowRight, CursorClick, Heart, Play } from '@phosphor-icons/react'
import type { Station } from '../types'
import { formatClicks, formatCompactClicks, shouldShowClicks } from '../utils/formatClicks'
import { getStationUrl } from '../utils/stationUrl'
import { StationLogo } from './StationLogo'

type StationListItemProps = {
  station: Station
  favorite: boolean
  active: boolean
  onOpen: () => void
  onPlay: () => void
  onFavorite: () => void
}

export function StationListItem({ station, favorite, active, onOpen, onPlay, onFavorite }: StationListItemProps) {
  const tags = station.tags.split(',').filter(Boolean).slice(0, 3)
  const stationUrl = getStationUrl(station)

  return (
    <article className={`group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border p-2.5 transition sm:gap-4 sm:p-3 ${active ? 'border-lime-300/45 bg-lime-300/[.055]' : 'border-white/[.07] bg-zinc-900/40 hover:border-white/15 hover:bg-zinc-900/70'}`}>
      <button type="button" onClick={onPlay} aria-label={`Escuchar ${station.name}`} className="relative rounded-2xl active:scale-[.98]">
        <StationLogo src={station.favicon} name={station.name} className="size-14 sm:size-16" />
        <span className="absolute inset-0 grid place-items-center rounded-2xl bg-black/45 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><Play size={19} weight="fill" className="text-white" /></span>
      </button>
      <a href={stationUrl} onClick={event => { event.preventDefault(); onOpen() }} className="min-w-0 rounded-lg">
        <h3 className="truncate text-sm font-semibold text-zinc-100 sm:text-base">{station.name}</h3>
        <p className="mt-1 truncate text-xs text-zinc-500">{station.state || station.country || 'Radio online'}{station.codec ? ` · ${station.codec}${station.bitrate ? ` ${station.bitrate} kbps` : ''}` : ''}</p>
        {shouldShowClicks(station.clickcount) && <p title={`${formatClicks(station.clickcount)} clics en las últimas 24 horas`} className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-lime-300/75"><CursorClick size={13} /> {formatCompactClicks(station.clickcount)} clics <span className="font-normal text-zinc-600">· 24 h</span></p>}
        <div className="mt-2 hidden gap-1.5 overflow-hidden sm:flex">{tags.map(tag => <span key={tag} className="whitespace-nowrap rounded-md bg-white/[.05] px-2 py-1 text-[10px] text-zinc-500">{tag}</span>)}</div>
      </a>
      <div className="flex flex-col items-center sm:flex-row sm:gap-1">
        <button type="button" onClick={onFavorite} aria-label={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'} className="grid size-11 place-items-center rounded-xl text-zinc-500 transition hover:bg-white/[.05] hover:text-lime-300 active:scale-[.96] sm:size-10"><Heart size={18} weight={favorite ? 'fill' : 'regular'} className={favorite ? 'text-lime-300' : ''} /></button>
        <button type="button" onClick={onOpen} aria-label={`Ver ${station.name}`} className="grid size-11 place-items-center rounded-xl text-zinc-500 transition hover:bg-white/[.05] hover:text-white active:scale-[.96] sm:size-10"><ArrowRight size={18} /></button>
      </div>
    </article>
  )
}
