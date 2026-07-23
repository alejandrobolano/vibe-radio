import { MagnifyingGlass, X } from '@phosphor-icons/react'
import type { FormEvent } from 'react'

export function SearchBar({ value, onChange, onSubmit, loading }: { value: string; onChange: (value: string) => void; onSubmit: () => void; loading: boolean }) {
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit() }
  return (
    <form onSubmit={submit} className="relative w-full max-w-2xl">
      <MagnifyingGlass size={21} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
      <input value={value} onChange={event => onChange(event.target.value)} placeholder="Busca por emisora, género o estilo" aria-label="Buscar emisoras" className="h-14 w-full rounded-2xl border border-white/10 bg-zinc-900/80 pl-12 pr-32 text-[15px] text-white outline-none transition placeholder:text-zinc-600 focus:border-lime-300/60 focus:ring-4 focus:ring-lime-300/5" />
      {value && <button type="button" onClick={() => onChange('')} aria-label="Limpiar búsqueda" className="absolute right-[102px] top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 hover:text-white"><X size={16} /></button>}
      <button type="submit" disabled={loading || !value.trim()} className="absolute right-2 top-2 h-10 rounded-xl bg-lime-300 px-4 text-sm font-bold text-zinc-950 transition hover:bg-lime-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40">Buscar</button>
    </form>
  )
}
