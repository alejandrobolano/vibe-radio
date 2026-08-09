import { ArrowLeft, Broadcast, Camera } from '@phosphor-icons/react'
import type { MouseEvent } from 'react'
import type { Navigate } from '../hooks/useAppNavigation'
import type { SleepTimerController } from '../hooks/useSleepTimer'
import { SleepTimerControl } from './SleepTimerControl'
import { BADALONA_WEBCAMS_PATH } from '../domain/webcam'

type ContentPageHeaderProps = {
  sleepTimer: SleepTimerController
  navigate: Navigate
  backHref?: string
  backLabel?: string
}

export function ContentPageHeader({ sleepTimer, navigate, backHref = '/', backLabel = 'Directorio' }: ContentPageHeaderProps) {
  const go = (event: MouseEvent<HTMLAnchorElement>, destination: string) => {
    event.preventDefault()
    navigate(destination)
  }

  return (
    <header className="border-b border-white/[.06]">
      <div className="mx-auto flex h-18 max-w-[1400px] items-center justify-between px-4 md:px-8">
        <a href="/" onClick={event => go(event, '/')} className="flex items-center gap-2 font-bold" aria-label="Ir al inicio de Vibe Radio">
          <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-zinc-950"><Broadcast size={20} weight="bold" /></span>
          <span>VIBE<span className="text-lime-300">RADIO</span></span>
        </a>
        <div className="flex items-center gap-2">
          <a href={BADALONA_WEBCAMS_PATH} onClick={event => go(event, BADALONA_WEBCAMS_PATH)} className="flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm text-zinc-500 transition hover:bg-white/[.04] hover:text-white sm:px-3"><Camera size={17} /><span className="hidden md:inline">Cámaras</span></a>
          <SleepTimerControl timer={sleepTimer} />
          <a href={backHref} onClick={event => go(event, backHref)} className="flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-400 transition hover:text-white"><ArrowLeft size={17} /><span className="truncate">{backLabel}</span></a>
        </div>
      </div>
    </header>
  )
}
