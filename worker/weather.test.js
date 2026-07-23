import { describe, expect, it } from 'vitest'
import { getWeatherLocation, normalizeWeatherPayload } from './weather.js'

describe('weather endpoint data', () => {
  it('accepts valid Cloudflare coordinates', () => {
    expect(getWeatherLocation({ latitude: '40.4168', longitude: '-3.7038', city: 'Madrid' })).toEqual({
      latitude: 40.4168,
      longitude: -3.7038,
      city: 'Madrid',
    })
    expect(getWeatherLocation({ latitude: 91, longitude: 0, city: 'Invalid' })).toBeNull()
  })

  it('returns only the weather fields used by the interface', () => {
    expect(normalizeWeatherPayload({
      name: 'Madrid',
      main: { temp: 24.4, feels_like: 25.2, humidity: 61 },
      wind: { speed: 3.24 },
      weather: [{ id: 801, description: 'algo de nubes' }],
    })).toEqual({
      city: 'Madrid', temperature: 24, feelsLike: 25, humidity: 61,
      windSpeed: 3.2, description: 'algo de nubes', conditionId: 801,
    })
  })
})
