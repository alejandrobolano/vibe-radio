const SENSITIVE_FILES = new Set([
  '.dockerenv',
  '.npmrc',
  '.pypirc',
  'application.yml',
  'application.yaml',
  'credentials.json',
  'firebase-credentials.json',
  'serviceaccountkey.json',
  'secrets.yml',
  'secrets.yaml',
])

function normalizePath(pathname) {
  const normalized = pathname.replaceAll('\\', '/').toLowerCase()

  try {
    return decodeURIComponent(normalized).replaceAll('\\', '/')
  } catch {
    return normalized
  }
}

export function isMaliciousProbePath(pathname) {
  const path = normalizePath(pathname)
  const segments = path.split('/').filter(Boolean)
  const filename = segments.at(-1) ?? ''

  if (segments.some(segment => segment === '.git' || segment.startsWith('.env'))) return true
  if (segments.some(segment => segment.startsWith('wp-'))) return true
  if (segments.includes('proc') && segments.includes('self')) return true
  if (SENSITIVE_FILES.has(filename)) return true
  if (/\.php\d*$/.test(filename)) return true
  if (path.includes('/storage/logs/laravel.log')) return true

  return false
}

export function createProbeNotFoundResponse() {
  return new Response('Not found', {
    status: 404,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
