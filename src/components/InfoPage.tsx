import { ArrowLeft, Broadcast } from '@phosphor-icons/react'
import { useEffect, type MouseEvent } from 'react'
import type { Navigate } from '../hooks/useAppNavigation'
import type { RadioPlayerController } from '../hooks/useRadioPlayer'
import type { SleepTimerController } from '../hooks/useSleepTimer'
import { setCanonicalUrl, setMetaTag } from '../utils/seo'
import { infoPageContent, type InfoPath } from '../utils/infoPage'
import { Footer } from './Footer'
import { SleepTimerControl } from './SleepTimerControl'

export function InfoPage({ pathname, player, sleepTimer, navigate }: { pathname: InfoPath; player: RadioPlayerController; sleepTimer: SleepTimerController; navigate: Navigate }) {
  const page = infoPageContent[pathname]
  useEffect(() => { document.title = page.title; setMetaTag('description', page.description); setMetaTag('robots', 'index,follow,max-image-preview:large'); setMetaTag('og:title', page.title, true); setMetaTag('og:description', page.description, true); setMetaTag('og:url', setCanonicalUrl(pathname), true) }, [page, pathname])
  const go = (event: MouseEvent<HTMLAnchorElement>) => { event.preventDefault(); navigate('/') }
  return <div className={`flex min-h-[100dvh] flex-col bg-[#090a0b] text-zinc-100 ${player.current ? 'pb-28' : ''}`}><header className="border-b border-white/[.06]"><div className="mx-auto flex h-18 max-w-5xl items-center justify-between px-4 md:px-8"><a href="/" onClick={go} className="flex items-center gap-2 font-bold"><span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-zinc-950"><Broadcast size={20} weight="bold" /></span>VIBE<span className="-ml-2 text-lime-300">RADIO</span></a><div className="flex items-center gap-2"><SleepTimerControl timer={sleepTimer} /><a href="/" onClick={go} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={17} />Directorio</a></div></div></header><main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 md:px-8 md:py-20"><p className="text-xs font-bold tracking-[.16em] text-lime-300">VIBE RADIO</p><h1 className="mt-4 text-4xl font-black tracking-[-.045em] sm:text-5xl">{page.heading}</h1><div className="mt-8 space-y-5 text-lg leading-relaxed text-zinc-400">{page.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div><p className="mt-10 text-sm text-zinc-500">Responsable: <a className="text-lime-300 hover:text-lime-200" href="https://alejandrobolano.com" rel="author noopener noreferrer" target="_blank">Alejandro Bolaño</a></p></main><Footer navigate={navigate} /></div>
}
