import { describe, expect, it, vi } from 'vitest'
import { handleBadalonaWebcamsRequest } from './webcams.js'

const request = new Request('https://viberadio.net/api/webcams/badalona')

describe('Badalona webcams endpoint', () => {
  it('normalizes Windy webcams without exposing the API key', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      total: 1,
      webcams: [{
        webcamId: 123,
        status: 'active',
        title: 'Port de Badalona',
        viewCount: 42,
        lastUpdatedOn: '2026-08-09T12:00:00.000Z',
        categories: [{ name: 'Puerto' }],
        images: { current: { preview: 'https://images.windy.com/current.jpg' }, daylight: { thumbnail: 'https://images.windy.com/daylight.jpg' } },
        location: { city: 'Badalona', region: 'Cataluña', country: 'España', latitude: 41.45, longitude: 2.2474 },
        urls: { detail: 'https://www.windy.com/webcams/123' },
      }],
    }), { headers: { 'content-type': 'application/json' } }))

    const response = await handleBadalonaWebcamsRequest(request, { WINDY_API_KEY: 'secret-key' })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.webcams[0]).toMatchObject({ id: 123, title: 'Port de Badalona', imageUrl: 'https://images.windy.com/current.jpg' })
    expect(JSON.stringify(payload)).not.toContain('secret-key')
    expect(fetchMock.mock.calls[0][1].headers['x-windy-api-key']).toBe('secret-key')
    fetchMock.mockRestore()
  })

  it('returns 503 when the secret is missing', async () => {
    const response = await handleBadalonaWebcamsRequest(request, {})
    expect(response.status).toBe(503)
  })

  it('rejects unsupported methods', async () => {
    const response = await handleBadalonaWebcamsRequest(new Request(request.url, { method: 'POST' }), { WINDY_API_KEY: 'key' })
    expect(response.status).toBe(405)
  })
})
