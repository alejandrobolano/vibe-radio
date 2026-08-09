import { Broadcast, Camera, ClockCounterClockwise, Compass, Heart } from '@phosphor-icons/react'
import type { MouseEvent } from 'react'
import type { SleepTimerController } from '../hooks/useSleepTimer'
import type { Navigate } from '../hooks/useAppNavigation'
import { BADALONA_WEBCAMS_PATH } from '../domain/webcam'
import { SleepTimerControl } from './SleepTimerControl'

export type DirectoryView = 'discover' | 'favorites' | 'history'

type DirectoryHeaderProps = {
  view: DirectoryView
  favoriteCount: number
  sleepTimer: SleepTimerController
  onHome: () => void
  onViewChange: (view: DirectoryView) => void
  navigate: Navigate
}

export function DirectoryHeader({ view, favoriteCount, sleepTimer, onHome, onViewChange, navigate }: DirectoryHeaderProps) {
  const openWebcams = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    navigate(BADALONA_WEBCAMS_PATH)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/[.06] bg-[#090a0b]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-[1400px] items-center justify-between gap-2 px-3 min-[360px]:px-4 md:px-8">
        <a href="/" onClick={event => { event.preventDefault(); onHome() }} className="flex shrink-0 items-center gap-2 font-bold tracking-tight" aria-label="Ir al inicio de Vibe Radio">
          <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-zinc-950"><Broadcast size={20} weight="bold" /></span>
          <span className="hidden sm:inline">VIBE<span className="text-lime-300">RADIO</span></span>
        </a>
        <div className="ml-auto flex min-w-0 items-center gap-1.5 md:ml-0 md:gap-2">
          <a href={BADALONA_WEBCAMS_PATH} onClick={openWebcams} className="flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm text-zinc-500 transition hover:bg-white/[.04] hover:text-white sm:px-3"><Camera size={17} /><span className="hidden lg:inline">Cámaras</span></a>
          <SleepTimerControl timer={sleepTimer} />
          <nav className="flex items-center gap-1 rounded-xl bg-white/[.04] p-1" aria-label="Navegación principal">
            <button onClick={() => onViewChange('discover')} aria-label="Descubrir" className={`flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm transition sm:px-3 ${view === 'discover' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}><Compass size={17} /><span className="hidden min-[430px]:inline">Descubrir</span></button>
            <button onClick={() => onViewChange('favorites')} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${view === 'favorites' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
              <Heart size={16} weight={view === 'favorites' ? 'fill' : 'regular'} />
              <span className="hidden sm:inline">Favoritos</span>
              <span className="text-xs text-zinc-500">{favoriteCount}</span>
            </button>
            <button onClick={() => onViewChange('history')} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${view === 'history' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
              <ClockCounterClockwise size={16} />
              <span className="hidden md:inline">Historial</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
