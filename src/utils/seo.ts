export function setMetaTag(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(property ? 'property' : 'name', name)
    document.head.appendChild(element)
  }
  element.content = content
}

export function setCanonicalUrl(pathname = '/') {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = new URL(pathname, window.location.origin).href
  return canonical.href
}

export function truncateSeoText(value: string, maximum: number) {
  if (value.length <= maximum) return value
  return `${value.slice(0, maximum - 1).trimEnd()}…`
}
