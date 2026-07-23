import { ArrowSquareOut, Broadcast, Envelope, FacebookLogo, Globe, Info, InstagramLogo, MapPin, MusicNotes, Phone } from '@phosphor-icons/react'
import type { Station, TrackMetadata } from '../types'
import { getSafeHttpUrl } from '../utils/safeUrl'
import { StationLogo } from './StationLogo'
import { StationTrust } from './StationTrust'

type StationDetailsProps = {
  station: Station
  track: TrackMetadata | null
  history: TrackMetadata[]
}

export function StationDetails({ station, track, history }: StationDetailsProps) {
  const homepage = getSafeHttpUrl(station.homepage)
  const instagram = getSafeHttpUrl(station.instagram)
  const facebook = getSafeHttpUrl(station.facebook)

  return (
    <aside className="rounded-2xl border border-white/[.08] bg-zinc-900/60 p-5 lg:sticky lg:top-24">
      <div className="flex items-center gap-4">
        <StationLogo src={station.favicon} name={station.name} className="size-16" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold text-lime-300"><Broadcast size={14} weight="fill" /> EN DIRECTO AHORA</p>
          <h2 className="mt-1 truncate text-lg font-bold">{station.name}</h2>
        </div>
      </div>
      <div className="mt-5"><StationTrust station={station} /></div>

      <section className="mt-7">
        <p className="text-xs font-semibold text-zinc-500">AHORA SUENA</p>
        {track ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-lime-300/[.045] p-3 ring-1 ring-lime-300/10">
            {track.artwork && <img src={track.artwork} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-12 shrink-0 rounded-lg object-cover" />}
            <div className="min-w-0">
              <p className="truncate font-semibold">{track.title}</p>
              <p className="truncate text-sm text-zinc-400">{track.artist || 'Artista no indicado'}</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex gap-3 rounded-xl bg-white/[.035] p-3 text-sm text-zinc-400">
            <Info size={20} className="shrink-0 text-zinc-500" />
            <p>Esta emisora no publica metadatos de pista compatibles.</p>
          </div>
        )}
      </section>

      <section className="mt-7">
        <p className="flex items-center gap-2 text-xs font-semibold text-zinc-500"><MusicNotes size={15} /> TOP CANCIONES DE LA SESIÓN</p>
        {history.length ? (
          <ol className="mt-3 space-y-3">
            {history.slice(0, 5).map((item, index) => (
              <li key={`${item.title}-${index}`} className="flex gap-3 text-sm">
                <span className="text-zinc-600">{String(index + 1).padStart(2, '0')}</span>
                <span className="truncate">{item.artist ? `${item.artist} · ` : ''}{item.title}</span>
              </li>
            ))}
          </ol>
        ) : <p className="mt-3 text-sm leading-relaxed text-zinc-500">El historial aparecerá cuando el stream facilite título y artista. No mostramos datos inventados.</p>}
      </section>

      <section className="mt-7 border-t border-white/[.07] pt-5">
        <p className="text-xs font-semibold text-zinc-500">CONTACTO Y DATOS</p>
        <div className="mt-3 space-y-3 text-sm text-zinc-300">
          <p className="flex items-center gap-2"><Globe size={17} className="shrink-0 text-zinc-500" /> {station.country || 'País no indicado'}{station.language ? ` · ${station.language}` : ''}</p>
          {station.address && <p className="flex items-start gap-2"><MapPin size={17} className="mt-0.5 shrink-0 text-zinc-500" /> {station.address}</p>}
          {station.email && <a href={`mailto:${station.email}`} className="flex items-center gap-2 transition hover:text-lime-300"><Envelope size={17} className="shrink-0 text-zinc-500" /> {station.email}</a>}
          {station.phone && <a href={`tel:${station.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 transition hover:text-lime-300"><Phone size={17} className="shrink-0 text-zinc-500" /> {station.phone}</a>}
          {homepage ? <a href={homepage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-lime-300 hover:text-lime-200"><ArrowSquareOut size={17} /> Web oficial</a> : <p className="text-zinc-600">Sin web de contacto publicada</p>}
          {(instagram || facebook) && (
            <div className="flex gap-2 pt-1">
              {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid size-9 place-items-center rounded-lg bg-white/[.05] text-zinc-400 transition hover:text-lime-300"><InstagramLogo size={18} /></a>}
              {facebook && <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid size-9 place-items-center rounded-lg bg-white/[.05] text-zinc-400 transition hover:text-lime-300"><FacebookLogo size={18} /></a>}
            </div>
          )}
          <a href="https://www.radio-browser.info/" target="_blank" rel="noopener noreferrer" className="block pt-2 text-xs leading-relaxed text-zinc-600 transition hover:text-lime-300">¿Gestionas esta emisora? Propón una actualización en el directorio público.</a>
        </div>
      </section>
    </aside>
  )
}
