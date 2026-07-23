import { Cloud, CloudRain, Drop, Lightning, Snowflake, Sun, Wind } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useVisitorWeather } from '../hooks/useVisitorWeather'
import { getGreeting } from '../utils/greeting'

function WeatherIcon({ conditionId }: { conditionId: number }) {
  if (conditionId >= 200 && conditionId < 300) return <Lightning size={19} weight="fill" />
  if (conditionId >= 300 && conditionId < 600) return <CloudRain size={19} weight="fill" />
  if (conditionId >= 600 && conditionId < 700) return <Snowflake size={19} weight="fill" />
  if (conditionId >= 700 && conditionId < 800) return <Wind size={19} weight="bold" />
  if (conditionId === 800) return <Sun size={19} weight="fill" />
  return <Cloud size={19} weight="fill" />
}

function capitalize(value: string) {
  return value ? value.charAt(0).toLocaleUpperCase('es') + value.slice(1) : value
}

export function VisitorContext() {
  const weather = useVisitorWeather()
  const [hour, setHour] = useState(() => new Date().getHours())

  useEffect(() => {
    const timer = window.setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="mt-5 flex min-h-12 items-center justify-between gap-4 border-b border-white/[.06] pb-4" aria-label="Información local">
      <p className="min-w-0 text-sm text-zinc-400">
        <span className="font-semibold text-zinc-100">{getGreeting(hour)}.</span>{' '}
        <span className="hidden min-[430px]:inline">¿Qué te apetece escuchar?</span>
      </p>
      {weather && (
        <div className="flex shrink-0 items-center gap-2.5 text-sm" aria-label={`${weather.temperature} grados en ${weather.city}, ${weather.description}`}>
          <span className="text-lime-300" aria-hidden="true"><WeatherIcon conditionId={weather.conditionId} /></span>
          <span className="font-bold text-zinc-100">{weather.temperature}°</span>
          <span className="max-w-28 truncate text-zinc-400 sm:max-w-40">{weather.city}</span>
          <span className="hidden text-zinc-500 lg:inline">{capitalize(weather.description)}</span>
          <span className="hidden items-center gap-1 text-xs text-zinc-600 xl:flex"><Drop size={13} weight="fill" aria-hidden="true" />{weather.humidity}%</span>
        </div>
      )}
    </section>
  )
}
