import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { ArrowRight, MapPin } from '@phosphor-icons/react'
import { getPopularStationsByCountry } from '../api/radioBrowser'
import { getNearbyCountries } from '../domain/nearbyCountries'
import type { FavoritesController } from '../hooks/useFavorites'
import type { Navigate } from '../hooks/useAppNavigation'
import type { RadioPlayerController } from '../hooks/useRadioPlayer'
import type { Station } from '../types'
import { getCountryName, getCountryUrl } from '../utils/countryUrl'
import { getStationUrl } from '../utils/stationUrl'
import { StationCard } from './StationCard'

type StationRecommendationsProps = {
  station: Station
  player: RadioPlayerController
  favorites: FavoritesController
  navigate: Navigate
}

export function StationRecommendations({ station, player, favorites, navigate }: StationRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Station[]>([])
  const [loading, setLoading] = useState(false)
  const nearbyCountries = useMemo(() => getNearbyCountries(station.countrycode), [station.countrycode])
  const countryName = getCountryName(station.countrycode, station.country)

  useEffect(() => {
    const controller = new AbortController()
    setRecommendations([])
    setLoading(true)
    getPopularStationsByCountry(station.countrycode, station.stationuuid, controller.signal)
      .then(setRecommendations)
      .catch(error => { if (error.name !== 'AbortError') setRecommendations([]) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [station.countrycode, station.stationuuid])

  const go = (event: MouseEvent<HTMLAnchorElement>, destination: string) => {
    event.preventDefault()
    navigate(destination)
  }

  return (
    <div className="mt-16 border-t border-white/[.07] pt-12">
      {(loading || recommendations.length > 0) && (
        <section aria-labelledby="related-stations-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[.16em] text-lime-300">SIGUE DESCUBRIENDO</p>
              <h2 id="related-stations-title" className="mt-3 text-2xl font-black tracking-[-.035em] sm:text-3xl">Emisoras populares de {countryName}</h2>
              <p className="mt-2 text-sm text-zinc-500">Seleccionadas por los clics recientes registrados en Radio Browser.</p>
            </div>
            <a href={getCountryUrl(station.countrycode, station.country)} onClick={event => go(event, getCountryUrl(station.countrycode, station.country))} className="flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-lime-300">
              Ver todas las emisoras <ArrowRight size={16} />
            </a>
          </div>

          {loading ? (
            <div className="mt-7 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4" aria-label="Cargando emisoras recomendadas">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="aspect-[1.35] animate-pulse rounded-2xl bg-zinc-900 sm:aspect-[.82]" />)}
            </div>
          ) : (
            <div className="mt-7 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
              {recommendations.map(recommendation => (
                <StationCard
                  key={recommendation.stationuuid}
                  station={recommendation}
                  favorite={favorites.isFavorite(recommendation.stationuuid)}
                  active={player.current?.stationuuid === recommendation.stationuuid}
                  onOpen={() => navigate(getStationUrl(recommendation))}
                  onPlay={() => void player.playStation(recommendation)}
                  onFavorite={() => favorites.toggle(recommendation)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {nearbyCountries.length > 0 && (
        <section aria-labelledby="nearby-countries-title" className={loading || recommendations.length > 0 ? 'mt-12' : ''}>
          <div className="flex items-center gap-2 text-zinc-200">
            <MapPin size={19} className="text-lime-300" />
            <h2 id="nearby-countries-title" className="font-bold">Explora radios de países cercanos</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {nearbyCountries.map(country => {
              const countryUrl = getCountryUrl(country.code, country.name)
              return <a key={country.code} href={countryUrl} onClick={event => go(event, countryUrl)} className="rounded-full border border-white/[.08] bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400 transition hover:border-lime-300/30 hover:text-lime-300">Emisoras de {country.name}</a>
            })}
          </div>
        </section>
      )}
    </div>
  )
}
