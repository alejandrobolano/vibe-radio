import { useEffect, useMemo, useState } from 'react'

function getLocaleCountryCode() {
  for (const locale of navigator.languages) {
    const countryCode = locale.split('-')[1]?.toUpperCase()
    if (/^[A-Z]{2}$/.test(countryCode)) return countryCode
  }
  return 'ES'
}

export function useVisitorCountry() {
  const [countryCode, setCountryCode] = useState(getLocaleCountryCode)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/visitor-country', { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(async response => {
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
        return response.json() as Promise<{ countryCode?: unknown }>
      })
      .then(payload => {
        const nextCountryCode = typeof payload?.countryCode === 'string' ? payload.countryCode.toUpperCase() : ''
        if (/^[A-Z]{2}$/.test(nextCountryCode)) setCountryCode(nextCountryCode)
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  const countryName = useMemo(() => {
    try {
      return new Intl.DisplayNames(['es'], { type: 'region' }).of(countryCode) || countryCode
    } catch {
      return countryCode
    }
  }, [countryCode])

  return { countryCode, countryName }
}
