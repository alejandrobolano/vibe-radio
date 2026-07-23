import { ClockCounterClockwise, MusicNotes, Play, ShareNetwork, Trash } from '@phosphor-icons/react'
import type { ListeningHistoryEntry, Station } from '../types'
import { StationLogo } from './StationLogo'

type ListeningHistoryProps = {
  entries: ListeningHistoryEntry[]
  onPlay: (station: Station) => void
  onShare: (entry: ListeningHistoryEntry) => void
  onClear: () => void
}

const formatDate = (value: string) => new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

export function ListeningHistory({ entries, onPlay, onShare, onClear }: ListeningHistoryProps) {
  const tracks = entries.filter(entry => entry.track)
  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><p className="text-sm font-semibold">Tu historial</p><p className="mt-1 text-xs text-zinc-600">Se guarda únicamente en este dispositivo.</p></div>
        {entries.length > 0 && <button onClick={onClear} className="flex items-center gap-2 text-xs text-zinc-500 transition hover:text-red-400"><Trash size={15} /> Borrar historial</button>}
      </div>
      {tracks.length > 0 && <div className="mb-8 rounded-2xl bg-lime-300/[.055] p-5 ring-1 ring-lime-300/10"><p className="flex items-center gap-2 text-xs font-semibold text-lime-300"><MusicNotes size={16} /> RADAR DE CANCIONES DETECTADAS</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{tracks.slice(0, 6).map(entry => <div key={`track-${entry.id}`} className="min-w-0"><p className="truncate text-sm font-medium">{entry.track?.title}</p><p className="truncate text-xs text-zinc-500">{entry.track?.artist || 'Artista no indicado'} · {entry.station.name}</p></div>)}</div></div>}
      {entries.length ? <div className="space-y-2">{entries.map(entry => <article key={entry.id} className="flex items-center gap-3 rounded-xl bg-zinc-900/55 p-3"><StationLogo src={entry.station.favicon} name={entry.station.name} className="size-12" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{entry.track ? `${entry.track.artist ? `${entry.track.artist} · ` : ''}${entry.track.title}` : entry.station.name}</p><p className="mt-1 truncate text-xs text-zinc-600">{entry.track ? entry.station.name : entry.station.state || entry.station.country} · {formatDate(entry.listenedAt)}</p></div><button onClick={() => onShare(entry)} aria-label="Compartir" className="p-2 text-zinc-500 hover:text-lime-300"><ShareNetwork size={18} /></button><button onClick={() => onPlay(entry.station)} aria-label={`Escuchar ${entry.station.name}`} className="grid size-10 place-items-center rounded-xl bg-lime-300 text-zinc-950"><Play size={17} weight="fill" /></button></article>)}</div> : <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/10 text-center"><div><ClockCounterClockwise size={36} className="mx-auto text-zinc-700" /><p className="mt-4 font-semibold">Aún no hay historial</p><p className="mt-2 text-sm text-zinc-600">Las emisoras y canciones que escuches aparecerán aquí.</p></div></div>}
    </section>
  )
}
