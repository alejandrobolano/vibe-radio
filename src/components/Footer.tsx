import type { MouseEvent } from 'react'
import type { Navigate } from '../hooks/useAppNavigation'
import { BADALONA_WEBCAMS_PATH } from '../domain/webcam'

type FooterProps = {
  navigate?: Navigate
}

export function Footer({ navigate }: FooterProps) {
  const go = (event: MouseEvent<HTMLAnchorElement>, destination: string) => {
    if (!navigate) return
    event.preventDefault()
    navigate(destination)
  }

  return (
    <footer className="mt-14 border-t border-white/[.06] bg-[#0b0c0d]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-7 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <p>© {new Date().getFullYear()} Vibe Radio. Todos los derechos reservados.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Información"><a href={BADALONA_WEBCAMS_PATH} onClick={event => go(event, BADALONA_WEBCAMS_PATH)} className="transition hover:text-lime-300">Cámaras</a><a href="/momentos" onClick={event => go(event, '/momentos')} className="transition hover:text-lime-300">Momentos</a><a href="/ciudades" onClick={event => go(event, '/ciudades')} className="transition hover:text-lime-300">Ciudades</a><a href="/acerca-de" onClick={event => go(event, '/acerca-de')} className="transition hover:text-lime-300">Acerca de</a><a href="/metodologia" onClick={event => go(event, '/metodologia')} className="transition hover:text-lime-300">Metodología</a></nav>
        <p>Creado por <a href="https://alejandrobolano.com" target="_blank" rel="author noopener noreferrer" className="font-medium text-zinc-400 transition hover:text-lime-300">Alejandro Bolaño</a></p>
      </div>
    </footer>
  )
}
