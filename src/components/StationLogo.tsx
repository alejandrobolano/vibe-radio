import { Radio } from '@phosphor-icons/react'
import { getSafeHttpUrl } from '../utils/safeUrl'

export function StationLogo({ src, name, className = '' }: { src?: string; name: string; className?: string }) {
  const safeSrc = getSafeHttpUrl(src)
  return (
    <div className={`relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-zinc-800 ${className}`}>
      <Radio size={28} weight="duotone" className="text-lime-300" />
      {safeSrc && <img src={safeSrc} alt={`Logo de ${name}`} loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" onError={event => { event.currentTarget.style.display = 'none' }} />}
    </div>
  )
}
