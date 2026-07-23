const fullFormatter = new Intl.NumberFormat('es-ES')
const compactFormatter = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 })

function normalizeClickCount(value: number) {
  return Math.max(0, Math.trunc(Number.isFinite(value) ? value : 0))
}

export function formatClicks(value: number) {
  return fullFormatter.format(normalizeClickCount(value))
}

export function formatCompactClicks(value: number) {
  return compactFormatter.format(normalizeClickCount(value))
}

export function shouldShowClicks(value: number) {
  return normalizeClickCount(value) >= 10
}
