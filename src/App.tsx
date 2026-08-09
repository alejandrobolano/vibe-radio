import { useMemo, useState } from 'react'
import { countryBelongsToContinent } from './api/radioBrowser'
import { DirectoryHeader, type DirectoryView } from './components/DirectoryHeader'
import { DirectoryHero } from './components/DirectoryHero'
import { DiscoveryCollections, type DiscoveryPreset } from './components/DiscoveryCollections'
import { Footer } from './components/Footer'
import { ListeningHistory } from './components/ListeningHistory'
import { Player } from './components/Player'
import { StationDetails } from './components/StationDetails'
import { StationFilters } from './components/StationFilters'
import { StationPage } from './components/StationPage'
import { CountryPage } from './components/CountryPage'
import { CityHubPage } from './components/CityHubPage'
import { CityPage } from './components/CityPage'
import { InfoPage } from './components/InfoPage'
import { MomentPage } from './components/MomentPage'
import { MomentsHubPage } from './components/MomentsHubPage'
import { BadalonaWebcamsPage } from './components/BadalonaWebcamsPage'
import { isInfoPath } from './utils/infoPage'
import { StationResults } from './components/StationResults'
import { VisitorContext } from './components/VisitorContext'
import type { FavoritesController } from './hooks/useFavorites'
import { useFavorites } from './hooks/useFavorites'
import { useAppNavigation, type Navigate } from './hooks/useAppNavigation'
import type { RadioPlayerController } from './hooks/useRadioPlayer'
import { useRadioPlayer } from './hooks/useRadioPlayer'
import type { SleepTimerController } from './hooks/useSleepTimer'
import { useSleepTimer } from './hooks/useSleepTimer'
import { useListeningHistory } from './hooks/useListeningHistory'
import { useStationDirectory } from './hooks/useStationDirectory'
import { useVisitorCountry } from './hooks/useVisitorCountry'
import { shareStation } from './utils/share'
import { getStationRouteFromPath, getStationUrl, stationRouteMatchesStation } from './utils/stationUrl'
import { getCountrySlugFromPath } from './utils/countryUrl'
import { getCityRouteFromPath } from './utils/cityUrl'
import { getMomentSlugFromPath, isMomentsHubPath } from './utils/momentUrl'
import { BADALONA_WEBCAMS_PATH } from './domain/webcam'

type DirectoryAppProps = {
  player: RadioPlayerController
  favorites: FavoritesController
  sleepTimer: SleepTimerController
  navigate: Navigate
}

function DirectoryApp({ player, favorites, sleepTimer, navigate }: DirectoryAppProps) {
  const [view, setView] = useState<DirectoryView>('discover')
  const directory = useStationDirectory()
  const listeningHistory = useListeningHistory()
  const visitorCountry = useVisitorCountry()
  const shownStations = view === 'favorites' ? favorites.favorites : directory.stations
  const countries = directory.countries.filter(country => countryBelongsToContinent(country.iso_3166_1, directory.filters.continent))

  const search = () => {
    if (!directory.query.trim()) return
    setView('discover')
    void directory.loadFirstPage(directory.query, directory.filters)
  }

  const applyFilters = () => {
    setView('discover')
    void directory.loadFirstPage(directory.query, directory.filters)
  }

  const openCollection = (preset: DiscoveryPreset) => {
    const nextFilters = { continent: '', countryCode: '', countryName: '', region: '', ...preset.filters }
    directory.setQuery(preset.query)
    directory.setFilters(nextFilters)
    setView('discover')
    void directory.loadFirstPage(preset.query, nextFilters)
  }

  const goHome = () => {
    setView('discover')
    void directory.resetDirectory()
  }

  return (
    <div className={`flex min-h-[100dvh] flex-col bg-[#090a0b] text-zinc-100 ${player.current ? 'pb-28' : ''}`}>
      <DirectoryHeader view={view} favoriteCount={favorites.favorites.length} sleepTimer={sleepTimer} onHome={goHome} onViewChange={setView} navigate={navigate} />
      <main id="top" className="mx-auto w-full max-w-[1400px] flex-1 px-4 md:px-8">
        {view === 'discover' && <VisitorContext />}
        <DirectoryHero query={directory.query} loading={directory.loading} onQueryChange={directory.setQuery} onSearch={search} />
        {view === 'discover' && <DiscoveryCollections countryCode={visitorCountry.countryCode} countryName={visitorCountry.countryName} onSelect={openCollection} onNavigate={navigate} />}
        {view === 'discover' && <StationFilters filters={directory.filters} countries={countries} regions={directory.regions} loadingRegions={directory.loadingRegions} onChange={directory.setFilters} onApply={applyFilters} />}
        <div className={`grid gap-8 ${player.current ? 'lg:grid-cols-[minmax(0,1fr)_330px]' : ''}`}>
          {view === 'history' ? (
            <ListeningHistory entries={listeningHistory.entries} onPlay={station => void player.playStation(station)} onShare={entry => void shareStation(entry.station, entry.track)} onClear={listeningHistory.clear} />
          ) : (
            <StationResults
              view={view}
              stations={shownStations}
              searched={directory.searched}
              loading={directory.loading}
              loadingMore={directory.loadingMore}
              error={directory.error}
              hasMore={directory.hasMore}
              currentStationUuid={player.current?.stationuuid}
              isFavorite={favorites.isFavorite}
              onOpen={station => navigate(getStationUrl(station))}
              onPlay={station => void player.playStation(station)}
              onFavorite={favorites.toggle}
              onRetry={() => void directory.loadFirstPage(directory.searched, directory.appliedFilters)}
              onLoadMore={() => void directory.loadMore()}
            />
          )}
          {player.current && <StationDetails station={player.current} track={player.track} history={player.history} />}
        </div>
      </main>
      <Footer navigate={navigate} />
    </div>
  )
}

export default function App() {
  const navigation = useAppNavigation()
  const player = useRadioPlayer()
  const favorites = useFavorites()
  const sleepTimer = useSleepTimer(player.pausePlayback)
  const stationRoute = useMemo(() => getStationRouteFromPath(navigation.location.pathname), [navigation.location.pathname])
  const countrySlug = useMemo(() => getCountrySlugFromPath(navigation.location.pathname), [navigation.location.pathname])
  const cityRoute = useMemo(() => getCityRouteFromPath(navigation.location.pathname), [navigation.location.pathname])
  const momentSlug = useMemo(() => getMomentSlugFromPath(navigation.location.pathname), [navigation.location.pathname])
  const momentsHub = isMomentsHubPath(navigation.location.pathname)
  const citiesHub = navigation.location.pathname === '/ciudades' || navigation.location.pathname === '/ciudades/'
  const badalonaWebcams = navigation.location.pathname.replace(/\/$/, '') === BADALONA_WEBCAMS_PATH
  const infoPath = isInfoPath(navigation.location.pathname) ? navigation.location.pathname : null
  const playerStationUrl = player.current ? getStationUrl(player.current) : null
  const playerStationHref = player.current && !stationRouteMatchesStation(stationRoute, player.current) ? playerStationUrl : null

  return (
    <>
      <audio ref={player.audioRef} preload="none" />
      {stationRoute
        ? <StationPage route={stationRoute} player={player} favorites={favorites} sleepTimer={sleepTimer} navigate={navigation.navigate} />
        : cityRoute
          ? <CityPage route={cityRoute} player={player} favorites={favorites} sleepTimer={sleepTimer} navigate={navigation.navigate} />
        : countrySlug
          ? <CountryPage slug={countrySlug} player={player} favorites={favorites} sleepTimer={sleepTimer} navigate={navigation.navigate} />
        : momentSlug
          ? <MomentPage slug={momentSlug} player={player} favorites={favorites} sleepTimer={sleepTimer} navigate={navigation.navigate} />
        : momentsHub
          ? <MomentsHubPage player={player} sleepTimer={sleepTimer} navigate={navigation.navigate} />
        : citiesHub
          ? <CityHubPage player={player} sleepTimer={sleepTimer} navigate={navigation.navigate} />
        : badalonaWebcams
          ? <BadalonaWebcamsPage player={player} sleepTimer={sleepTimer} navigate={navigation.navigate} />
        : infoPath
          ? <InfoPage pathname={infoPath} player={player} sleepTimer={sleepTimer} navigate={navigation.navigate} />
        : <DirectoryApp player={player} favorites={favorites} sleepTimer={sleepTimer} navigate={navigation.navigate} />}
      <Player
        station={player.current}
        stationHref={playerStationHref}
        playing={player.playing}
        loading={player.loading}
        error={player.error}
        track={player.track}
        volume={player.volume}
        favorite={player.current ? favorites.isFavorite(player.current.stationuuid) : false}
        onOpenStation={() => playerStationUrl && navigation.navigate(playerStationUrl)}
        onToggle={() => void player.togglePlayback()}
        onVolume={player.setVolume}
        onFavorite={() => player.current && favorites.toggle(player.current)}
        onShare={() => player.current && void shareStation(player.current, player.track)}
      />
    </>
  )
}
