import { ArrowRight, Heart, Pause, Play, ShareNetwork, SpeakerHigh, SpeakerSlash, WarningCircle } from '@phosphor-icons/react'
import type { Station } from '../types'
import { DjVisualizer } from './DjVisualizer'
import { StationLogo } from './StationLogo'

type PlayerProps = {
  station: Station | null
  stationHref: string | null
  playing: boolean
  loading: boolean
  error: string
  volume: number
  favorite: boolean
  onOpenStation: () => void
  onToggle: () => void
  onVolume: (value: number) => void
  onFavorite: () => void
  onShare: () => void
}

export function Player({ station, stationHref, playing, loading, error, volume, favorite, onOpenStation, onToggle, onVolume, onFavorite, onShare }: PlayerProps) {
  if (!station) return null

  const identity = (
    <>
      <StationLogo src={station.favicon} name={station.name} className="size-12" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{station.name}</p>
        <p className={`mt-0.5 truncate text-xs ${error ? 'text-red-400' : 'text-zinc-500'}`}>{error || (loading ? 'Conectando…' : playing ? 'En directo' : 'En pausa')}</p>
      </div>
    </>
  )

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0b0c0d]/95 backdrop-blur-xl">
      <div className="mx-auto grid min-h-20 max-w-[1400px] grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 md:grid-cols-[1fr_auto_1fr] md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {stationHref ? (
            <a href={stationHref} onClick={event => { event.preventDefault(); onOpenStation() }} aria-label={`Ir a la página de ${station.name}`} className="group flex min-w-0 items-center gap-3 rounded-xl outline-none transition hover:text-lime-300 focus-visible:ring-2 focus-visible:ring-lime-300/70">
              {identity}
              <ArrowRight size={16} className="hidden shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-lime-300 min-[420px]:block" />
            </a>
          ) : <div className="flex min-w-0 items-center gap-3">{identity}</div>}
          <button onClick={onFavorite} aria-label="Cambiar favorito" className="hidden p-2 text-zinc-500 hover:text-lime-300 sm:block"><Heart size={19} weight={favorite ? 'fill' : 'regular'} className={favorite ? 'text-lime-300' : ''} /></button>
          <button onClick={onShare} aria-label="Compartir emisora" className="hidden p-2 text-zinc-500 hover:text-lime-300 sm:block"><ShareNetwork size={19} /></button>
        </div>
        <div className="flex items-center gap-2"><DjVisualizer station={station} playing={playing} loading={loading} onToggle={onToggle} /><button onClick={onToggle} disabled={loading} aria-label={playing ? 'Pausar' : 'Reproducir'} className="grid size-12 place-items-center rounded-full bg-lime-300 text-zinc-950 transition hover:bg-lime-200 active:scale-95 disabled:opacity-60">{error ? <WarningCircle size={22} /> : playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" className="translate-x-px" />}</button></div>
        <div className="hidden items-center justify-end gap-3 md:flex">{volume === 0 ? <SpeakerSlash size={18} className="text-zinc-500" /> : <SpeakerHigh size={18} className="text-zinc-500" />}<input type="range" min="0" max="1" step="0.01" value={volume} onChange={event => onVolume(Number(event.target.value))} aria-label="Volumen" className="volume-slider w-28 accent-lime-300" /><span className="w-8 text-right text-xs text-zinc-600">{Math.round(volume * 100)}</span></div>
      </div>
    </div>
  )
}
