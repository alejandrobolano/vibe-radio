import { ArrowRight, Barbell, Bed, Car, Confetti, Headphones, Sparkle } from '@phosphor-icons/react'
import { useEffect, type ComponentType, type MouseEvent } from 'react'
import { listeningMoments, type ListeningMomentSlug } from '../domain/listeningMoments'
import type { Navigate } from '../hooks/useAppNavigation'
import type { RadioPlayerController } from '../hooks/useRadioPlayer'
import type { SleepTimerController } from '../hooks/useSleepTimer'
import { getMomentUrl, MOMENTS_HUB_PATH } from '../utils/momentUrl'
import { setCanonicalUrl, setMetaTag } from '../utils/seo'
import { Footer } from './Footer'
import { ContentPageHeader } from './ContentPageHeader'

type MomentsHubPageProps = {
  player: RadioPlayerController
  sleepTimer: SleepTimerController
  navigate: Navigate
}

const icons: Record<ListeningMomentSlug, ComponentType<{ size?: number; weight?: 'regular' | 'bold' | 'fill' }>> = {
  trabajar: Headphones,
  relajarse: Sparkle,
  entrenar: Barbell,
  conducir: Car,
  dormir: Bed,
  fiesta: Confetti,
}

export function MomentsHubPage({ player, sleepTimer, navigate }: MomentsHubPageProps) {
  useEffect(() => {
    const title = 'Radio para cada momento: trabajar, relajarse y más | Vibe Radio'
    const description = 'Elige emisoras online para trabajar, relajarte, entrenar, conducir, dormir o celebrar. Encuentra el ambiente adecuado y escucha en directo.'
    document.title = title
    setMetaTag('description', description)
    setMetaTag('robots', 'index,follow,max-image-preview:large')
    setMetaTag('og:title', title, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:url', setCanonicalUrl(MOMENTS_HUB_PATH), true)
  }, [])

  const go = (event: MouseEvent<HTMLAnchorElement>, destination: string) => {
    event.preventDefault()
    navigate(destination)
  }

  return (
    <div className={`flex min-h-[100dvh] flex-col bg-[#090a0b] text-zinc-100 ${player.current ? 'pb-28' : ''}`}>
      <ContentPageHeader navigate={navigate} sleepTimer={sleepTimer} />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 md:px-8 md:py-16">
        <nav aria-label="Migas de pan" className="text-sm text-zinc-600"><a href="/" onClick={event => go(event, '/')} className="hover:text-lime-300">Emisoras</a><span className="px-2">/</span><span className="text-zinc-400">Momentos</span></nav>
        <header className="mb-10 mt-8 max-w-3xl md:mb-14">
          <p className="text-xs font-bold tracking-[.16em] text-lime-300">UN DIAL PARA CADA RITMO</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl md:text-6xl">Radio para cada momento</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">Elige cómo quieres sentirte y encuentra emisoras en directo que acompañen tu trabajo, descanso, entrenamiento o celebración.</p>
        </header>
        <section aria-label="Momentos para escuchar radio" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {listeningMoments.map(moment => {
            const Icon = icons[moment.slug]
            const href = getMomentUrl(moment.slug)
            return (
              <a key={moment.slug} href={href} onClick={event => go(event, href)} className="group flex min-h-56 flex-col rounded-2xl border border-white/[.07] bg-zinc-900/40 p-5 transition hover:-translate-y-0.5 hover:border-white/[.14] hover:bg-zinc-900/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 sm:p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-lime-300 text-zinc-950"><Icon size={22} weight="bold" /></span>
                <h2 className="mt-6 text-xl font-bold tracking-tight">{moment.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-zinc-500">{moment.shortDescription}</p>
                <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-zinc-300 transition group-hover:text-lime-300">Descubrir emisoras <ArrowRight size={16} /></span>
              </a>
            )
          })}
        </section>
      </main>
      <Footer navigate={navigate} />
    </div>
  )
}
