import { useEffect, useState } from 'react'
import { getVisitorWeather } from '../api/weather'
import type { WeatherSnapshot } from '../types'

export function useVisitorWeather() {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getVisitorWeather(controller.signal)
      .then(result => { if (!controller.signal.aborted) setWeather(result) })
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  return weather
}
