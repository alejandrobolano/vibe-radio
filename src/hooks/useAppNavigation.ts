import { useCallback, useEffect, useState } from 'react'

type AppLocation = {
  pathname: string
  search: string
}

function readLocation(): AppLocation {
  return { pathname: window.location.pathname, search: window.location.search }
}

export function useAppNavigation() {
  const [location, setLocation] = useState(readLocation)

  useEffect(() => {
    const onPopState = () => setLocation(readLocation())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((destination: string, options?: { replace?: boolean; preserveScroll?: boolean }) => {
    const url = new URL(destination, window.location.origin)
    if (url.origin !== window.location.origin) {
      window.location.assign(url)
      return
    }

    const nextPath = `${url.pathname}${url.search}${url.hash}`
    if (options?.replace) window.history.replaceState(null, '', nextPath)
    else window.history.pushState(null, '', nextPath)
    setLocation({ pathname: url.pathname, search: url.search })
    if (!options?.preserveScroll) window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  return { location, navigate }
}

export type Navigate = ReturnType<typeof useAppNavigation>['navigate']
