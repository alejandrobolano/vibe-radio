import { CornersIn, Pause, Play, Waveform } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { Station } from '../types'
import { StationLogo } from './StationLogo'

type VisualizerMode = 'equalizer' | 'wave' | 'pulse' | 'orbit'

const visualizerModes: Array<{ id: VisualizerMode; label: string }> = [
  { id: 'equalizer', label: 'Equalizador' },
  { id: 'wave', label: 'Onda' },
  { id: 'pulse', label: 'Pulso' },
  { id: 'orbit', label: 'Órbita' },
]
const bars = Array.from({ length: 28 }, (_, index) => index)
const rings = Array.from({ length: 5 }, (_, index) => index)
const orbitPoints = Array.from({ length: 16 }, (_, index) => index)
const storageKey = 'vibe-radio:visualizer-mode'

function readVisualizerMode(): VisualizerMode {
  try {
    const stored = localStorage.getItem(storageKey)
    return visualizerModes.some(mode => mode.id === stored) ? stored as VisualizerMode : 'equalizer'
  } catch {
    return 'equalizer'
  }
}

function indexedStyle(index: number) {
  return {
    '--visualizer-index': index,
    '--visualizer-level': (0.34 + ((index * 7) % 7) * 0.1).toFixed(2),
    '--visualizer-opacity': (0.35 + (index % 5) * 0.12).toFixed(2),
    '--visualizer-speed': `${(0.52 + (index % 6) * 0.09).toFixed(2)}s`,
    '--visualizer-delay': `${index * -45}ms`,
    '--visualizer-pulse-delay': `${(index * -0.32).toFixed(2)}s`,
    '--visualizer-angle': `${index * 22.5}deg`,
    '--visualizer-size': `${18 + index * 15}%`,
  } as CSSProperties
}

function VisualizerSurface({ mode, playing, compact = false }: { mode: VisualizerMode; playing: boolean; compact?: boolean }) {
  return (
    <div className={`dj-visualizer dj-visualizer--${mode} ${playing ? 'is-playing' : 'is-paused'} ${compact ? 'is-compact' : 'is-expanded'}`} aria-hidden="true">
      {(mode === 'equalizer' || mode === 'wave') && <div className="dj-visualizer-bars">{bars.map(index => <span key={index} style={indexedStyle(index)} />)}</div>}
      {mode === 'pulse' && <div className="dj-visualizer-pulse">{rings.map(index => <span key={index} style={indexedStyle(index)} />)}<Waveform weight="bold" /></div>}
      {mode === 'orbit' && <div className="dj-visualizer-orbit"><div className="dj-visualizer-orbit-track">{orbitPoints.map(index => <span key={index} style={indexedStyle(index)} />)}</div><Waveform weight="bold" /></div>}
    </div>
  )
}

export function DjVisualizer({ station, playing, loading, onToggle }: { station: Station; playing: boolean; loading: boolean; onToggle: () => void }) {
  const [mode, setMode] = useState<VisualizerMode>(readVisualizerMode)
  const [expanded, setExpanded] = useState(false)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try { localStorage.setItem(storageKey, mode) } catch { return }
  }, [mode])

  useEffect(() => {
    if (!expanded) return
    const openButton = openButtonRef.current
    const appRoot = document.getElementById('root')
    const previousInert = appRoot?.inert ?? false
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (appRoot) appRoot.inert = true
    closeButtonRef.current?.focus()
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false)
        return
      }
      if (event.key !== 'Tab' || !overlayRef.current) return
      const focusable = [...overlayRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')]
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handleDialogKeys)
    return () => {
      document.body.style.overflow = previousOverflow
      if (appRoot) appRoot.inert = previousInert
      window.removeEventListener('keydown', handleDialogKeys)
      openButton?.focus()
    }
  }, [expanded])

  const selectMode = (nextMode: VisualizerMode) => setMode(nextMode)

  return (
    <>
      <button ref={openButtonRef} type="button" onClick={() => setExpanded(true)} aria-label="Abrir efectos visuales" title="Efectos visuales" className="group grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[.035] transition hover:border-lime-300/35 active:scale-[.96]">
        <VisualizerSurface mode={mode} playing={playing} compact />
      </button>
      {expanded && createPortal(
        <div ref={overlayRef} className="fixed inset-0 z-[70] min-h-[100dvh] overflow-hidden bg-[#090a0b] text-zinc-100" role="dialog" aria-modal="true" aria-label="Efectos visuales de la emisora">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(190,242,100,.08),transparent_42%)]" />
          <div className="relative grid min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto]">
            <header className="flex min-w-0 items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-10">
              <div className="flex min-w-0 items-center gap-3"><StationLogo src={station.favicon} name={station.name} className="size-11" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{station.name}</p><p className="mt-0.5 text-xs text-zinc-500">{playing ? 'En directo' : loading ? 'Conectando…' : 'En pausa'}</p></div></div>
              <button ref={closeButtonRef} type="button" onClick={() => setExpanded(false)} className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white active:scale-[.97]" aria-label="Minimizar efectos visuales"><CornersIn size={18} /><span className="hidden sm:inline">Minimizar</span></button>
            </header>
            <main className="grid min-h-0 place-items-center px-4 py-4 sm:px-8"><div className="h-full max-h-[62dvh] w-full max-w-6xl"><VisualizerSurface mode={mode} playing={playing} /></div></main>
            <footer className="mx-auto flex w-full max-w-4xl flex-col items-stretch gap-3 px-4 pb-5 sm:flex-row sm:items-center sm:justify-center sm:px-6 lg:pb-8">
              <button type="button" onClick={onToggle} disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 text-sm font-bold text-zinc-950 transition hover:bg-lime-200 active:scale-[.98] disabled:opacity-60">{playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />} {playing ? 'Pausar' : 'Reproducir'}</button>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Estilo del efecto visual">{visualizerModes.map(option => <button key={option.id} type="button" onClick={() => selectMode(option.id)} aria-pressed={mode === option.id} className={`h-12 whitespace-nowrap rounded-xl border px-4 text-sm font-medium transition active:scale-[.98] ${mode === option.id ? 'border-lime-300/45 bg-lime-300/[.09] text-lime-300' : 'border-white/10 bg-white/[.035] text-zinc-400 hover:border-white/20 hover:text-white'}`}>{option.label}</button>)}</div>
            </footer>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
