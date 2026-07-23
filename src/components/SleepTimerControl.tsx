import { Clock, X } from '@phosphor-icons/react'
import { useId, useRef, useState, type FormEvent } from 'react'
import type { SleepTimerController } from '../hooks/useSleepTimer'

const TIMER_OPTIONS = [15, 25, 45, 60]

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function SleepTimerControl({ timer }: { timer: SleepTimerController }) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const inputId = useId()
  const [customMinutes, setCustomMinutes] = useState('')
  const [validationError, setValidationError] = useState('')
  const closeMenu = () => detailsRef.current?.removeAttribute('open')
  const startCustomTimer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const minutes = Number(customMinutes)
    if (!Number.isInteger(minutes) || minutes < 1) {
      setValidationError('Introduce un número entero mayor que cero.')
      return
    }
    timer.start(minutes)
    setCustomMinutes('')
    setValidationError('')
    closeMenu()
  }

  return (
    <details ref={detailsRef} className="group relative">
      <summary className={`flex h-10 list-none items-center gap-2 rounded-xl border px-3 text-sm transition active:scale-[.98] [&::-webkit-details-marker]:hidden ${timer.active ? 'border-lime-300/30 bg-lime-300/[.08] text-lime-300' : 'border-white/[.08] bg-white/[.035] text-zinc-400 hover:text-white'}`}>
        <Clock size={17} weight={timer.active ? 'fill' : 'regular'} />
        <span className="hidden lg:inline">Temporizador</span>
        {timer.active && <span aria-live="polite" className="font-mono text-xs tabular-nums">{formatRemainingTime(timer.remainingSeconds)}</span>}
      </summary>
      <div className="fixed left-4 right-4 top-20 z-50 rounded-2xl border border-white/10 bg-zinc-900 p-3 shadow-2xl shadow-black/40 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-64">
        <p className="px-1 text-sm font-semibold">Pausar automáticamente</p>
        <p className="mt-1 px-1 text-xs leading-relaxed text-zinc-500">El audio se detendrá cuando termine el tiempo.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {TIMER_OPTIONS.map(minutes => (
            <button key={minutes} type="button" onClick={() => { timer.start(minutes); setValidationError(''); closeMenu() }} className="rounded-xl bg-white/[.05] px-3 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-lime-300 hover:text-zinc-950 active:scale-[.98]">
              {minutes} min
            </button>
          ))}
        </div>
        <form onSubmit={startCustomTimer} className="mt-3 border-t border-white/[.07] pt-3">
          <label htmlFor={inputId} className="block text-xs font-medium text-zinc-400">Minutos personalizados</label>
          <div className="mt-2 flex gap-2">
            <input
              id={inputId}
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={customMinutes}
              onChange={event => { setCustomMinutes(event.target.value); setValidationError('') }}
              aria-invalid={Boolean(validationError)}
              aria-describedby={validationError ? `${inputId}-error` : undefined}
              placeholder="90"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-zinc-700 focus:border-lime-300/50"
            />
            <button type="submit" className="rounded-xl bg-lime-300 px-3 py-2 text-sm font-bold text-zinc-950 transition hover:bg-lime-200 active:scale-[.98]">Iniciar</button>
          </div>
          {validationError && <p id={`${inputId}-error`} role="alert" className="mt-2 text-xs text-red-300">{validationError}</p>}
        </form>
        {timer.active && (
          <button type="button" onClick={() => { timer.cancel(); closeMenu() }} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-500 transition hover:bg-white/[.04] hover:text-red-300">
            <X size={15} /> Cancelar
          </button>
        )}
      </div>
    </details>
  )
}
