const fullFormatter = new Intl.NumberFormat('es-ES')
const compactFormatter = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 })

function normalizeClickCount(value: number) {
  return Math.max(0, Math.trunc(Number.isFinite(value) ? value : 0))
}

export function formatCount(value: number) {
  return fullFormatter.format(normalizeClickCount(value))
}

export function formatCompactCount(value: number) {
  return compactFormatter.format(normalizeClickCount(value))
}

export const formatClicks = formatCount
export const formatCompactClicks = formatCompactCount

export function shouldShowClicks(value: number) {
  return normalizeClickCount(value) >= 10
}
