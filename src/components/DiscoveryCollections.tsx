import { Coffee, MoonStars, MusicNotes, Newspaper, TreePalm, Waveform } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import type { StationFilters } from '../types'

export type DiscoveryPreset = {
  title: string
  description: string
  query: string
  filters?: Partial<StationFilters>
  icon: ReactNode
}

type DiscoveryCollectionsProps = {
  countryCode: string
  countryName: string
  onSelect: (preset: DiscoveryPreset) => void
  onNavigate: (destination: string) => void
}

export function DiscoveryCollections({ countryCode, countryName, onSelect, onNavigate }: DiscoveryCollectionsProps) {
  const countryFilters = { countryCode, countryName }
  const presets: DiscoveryPreset[] = [
    { title: 'Ritmos latinos', description: 'Salsa, urbano y sonidos del Caribe', query: 'latin', icon: <TreePalm size={21} /> },
    { title: 'Cubatón y reguetón', description: 'Frecuencias con pulso urbano', query: 'reggaeton', icon: <Waveform size={21} /> },
    { title: 'Jazz para trabajar', description: 'Un dial tranquilo para concentrarse', query: 'jazz', icon: <Coffee size={21} /> },
    { title: `Actualidad de ${countryName}`, description: 'Noticias y conversación en directo', query: 'news', filters: countryFilters, icon: <Newspaper size={21} /> },
    { title: `Música de ${countryName}`, description: 'Una selección variada de emisoras cercanas', query: 'music', filters: countryFilters, icon: <MusicNotes size={21} /> },
    { title: 'Electrónica nocturna', description: 'House y electrónica internacional', query: 'house', icon: <MoonStars size={21} /> },
  ]

  return (
    <section className="mb-8 min-w-0">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div><p className="text-sm font-semibold">Escucha según el momento</p><p className="mt-1 text-xs text-zinc-600">Seis accesos directos, incluidos dos adaptados a tu país.</p></div>
        <a href="/momentos" onClick={event => { event.preventDefault(); onNavigate('/momentos') }} className="shrink-0 text-xs font-semibold text-zinc-500 transition hover:text-lime-300">Ver todos</a>
      </div>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {presets.map(preset => (
          <button key={preset.title} onClick={() => onSelect(preset)} className="flex min-w-0 items-center gap-3 rounded-xl bg-zinc-900/45 p-3 text-left ring-1 ring-white/[.06] transition hover:bg-zinc-900 hover:ring-lime-300/20 active:scale-[.99]">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-lime-300/[.08] text-lime-300">{preset.icon}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{preset.title}</span>
              <span className="mt-0.5 block truncate text-xs text-zinc-600">{preset.description}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
