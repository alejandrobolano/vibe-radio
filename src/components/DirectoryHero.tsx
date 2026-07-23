import { Sparkle } from '@phosphor-icons/react'
import { SearchBar } from './SearchBar'

type DirectoryHeroProps = {
  query: string
  loading: boolean
  onQueryChange: (query: string) => void
  onSearch: () => void
}

export function DirectoryHero({ query, loading, onQueryChange, onSearch }: DirectoryHeroProps) {
  return (
    <section className="grid gap-8 pb-10 pt-12 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:pb-14 lg:pt-16">
      <div>
        <p className="mb-5 flex items-center gap-2 text-xs font-bold tracking-[.18em] text-lime-300"><Sparkle size={15} weight="fill" /> RADIO SIN FRONTERAS</p>
        <h1 className="max-w-3xl text-5xl font-black leading-[.92] tracking-[-.055em] sm:text-6xl lg:text-7xl">Encuentra tu próxima frecuencia.</h1>
      </div>
      <div className="lg:pb-1">
        <p className="mb-6 max-w-md text-base leading-relaxed text-zinc-400">Miles de emisoras públicas, una sola señal. Busca por nombre, país o el género que te apetece escuchar.</p>
        <SearchBar value={query} onChange={onQueryChange} onSubmit={onSearch} loading={loading} />
      </div>
    </section>
  )
}
