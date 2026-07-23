const HTTP_PROTOCOLS = new Set(['http:', 'https:'])

export function getSafeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    return HTTP_PROTOCOLS.has(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

export function isSafeHttpUrl(value: unknown): value is string {
  return getSafeHttpUrl(value) !== null
}
