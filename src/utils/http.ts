const DEFAULT_TIMEOUT_MS = 12_000

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(new DOMException('Request timeout', 'TimeoutError')), timeoutMs)
  const externalSignal = init.signal
  const abortFromExternalSignal = () => controller.abort(externalSignal?.reason)

  if (externalSignal?.aborted) abortFromExternalSignal()
  else externalSignal?.addEventListener('abort', abortFromExternalSignal, { once: true })

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timeoutId)
    externalSignal?.removeEventListener('abort', abortFromExternalSignal)
  }
}
