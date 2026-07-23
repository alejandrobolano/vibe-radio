import { Funnel, MapPin, X } from '@phosphor-icons/react'
import type { Country, Region, StationFilters as FilterValues } from '../types'

const continents = [
  { value: 'africa', label: 'África' },
  { value: 'asia', label: 'Asia' },
  { value: 'europe', label: 'Europa' },
  { value: 'north_america', label: 'Norteamérica' },
  { value: 'south_america', label: 'Sudamérica' },
  { value: 'oceania', label: 'Oceanía' },
]

type Props = {
  filters: FilterValues
  countries: Country[]
  regions: Region[]
  loadingRegions: boolean
  onChange: (filters: FilterValues) => void
  onApply: () => void
}

export function StationFilters({ filters, countries, regions, loadingRegions, onChange, onApply }: Props) {
  const active = Boolean(filters.continent || filters.countryCode || filters.region)
  const selectClass = 'h-11 min-w-0 rounded-xl border border-white/[.08] bg-zinc-900 px-3 text-sm text-zinc-200 outline-none transition focus:border-lime-300/60 focus:ring-4 focus:ring-lime-300/5 disabled:cursor-not-allowed disabled:text-zinc-600'

  const setCountry = (countryCode: string) => {
    const country = countries.find(item => item.iso_3166_1 === countryCode)
    onChange({ ...filters, countryCode, countryName: country?.name ?? '', region: '' })
  }

  const reset = () => {
    onChange({ continent: '', countryCode: '', countryName: '', region: '' })
  }

  return (
    <div className="mb-7 rounded-2xl bg-zinc-900/55 p-3 ring-1 ring-white/[.07]">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="flex items-center gap-2 text-xs font-semibold text-zinc-400"><Funnel size={15} /> Filtrar el dial</p>
        {active && <button type="button" onClick={reset} className="flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-white"><X size={14} /> Limpiar</button>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1.25fr_1.25fr_auto]">
        <select value={filters.continent} onChange={event => onChange({ ...filters, continent: event.target.value, countryCode: '', countryName: '', region: '' })} className={selectClass} aria-label="Continente">
          <option value="">Todos los continentes</option>
          {continents.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select value={filters.countryCode} onChange={event => setCountry(event.target.value)} className={selectClass} aria-label="País">
          <option value="">Todos los países</option>
          {countries.map(country => <option key={country.iso_3166_1} value={country.iso_3166_1}>{country.name} ({country.stationcount})</option>)}
        </select>
        <div className="relative">
          <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <select value={filters.region} onChange={event => onChange({ ...filters, region: event.target.value })} disabled={!filters.countryCode || loadingRegions} className={`${selectClass} w-full pl-9`} aria-label="Ciudad o región">
            <option value="">{loadingRegions ? 'Cargando ubicaciones…' : 'Todas las ciudades o regiones'}</option>
            {regions.map(region => <option key={region.name} value={region.name}>{region.name} ({region.stationcount})</option>)}
          </select>
        </div>
        <button type="button" onClick={onApply} className="h-11 whitespace-nowrap rounded-xl bg-lime-300 px-5 text-sm font-bold text-zinc-950 transition hover:bg-lime-200 active:scale-[.98]">Aplicar filtros</button>
      </div>
    </div>
  )
}
