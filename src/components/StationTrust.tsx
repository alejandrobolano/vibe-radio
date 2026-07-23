import { CheckCircle, Clock, WarningCircle } from '@phosphor-icons/react'
import type { Station } from '../types'

function formatCheckDate(value?: string) {
  if (!value) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function StationTrust({ station }: { station: Station }) {
  const available = station.lastcheckok === 1 || station.stationuuid.startsWith('verified-')
  const checkedAt = station.lastchecktime_iso8601 || station.lastcheckoktime_iso8601

  return (
    <div className={`rounded-xl p-3 ${available ? 'bg-lime-300/[.07]' : 'bg-amber-300/[.06]'}`}>
      <p className={`flex items-center gap-2 text-xs font-semibold ${available ? 'text-lime-300' : 'text-amber-300'}`}>
        {available ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} />}
        {available ? 'Stream disponible' : 'Disponibilidad sin confirmar'}
      </p>
      <p className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-500"><Clock size={13} /> {station.stationuuid.startsWith('verified-') ? 'Emisora incorporada manualmente' : `Comprobado: ${formatCheckDate(checkedAt)}`}</p>
    </div>
  )
}
