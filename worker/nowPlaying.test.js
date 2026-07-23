import { describe, expect, it } from 'vitest'
import { handleNowPlayingRequest, normalizeNowPlaying } from './nowPlaying.js'

describe('now playing adapters', () => {
  it('normalizes Icecast metadata for the configured mount', () => {
    expect(normalizeNowPlaying({
      icestats: {
        source: [
          { listenurl: 'http://radio.example/other', title: 'Other' },
          { listenurl: 'http://radio.example/classic', title: 'Song Title by Artist Name - Station' },
        ],
      },
    }, { adapter: 'icecast', mount: '/classic', suffix: ' - Station' })).toEqual({
      title: 'Song Title',
      artist: 'Artist Name',
    })
  })

  it('normalizes AzuraCast metadata', () => {
    expect(normalizeNowPlaying({
      now_playing: { song: { title: 'Song', artist: 'Artist', art: 'https://example.com/art.jpg' } },
    }, { adapter: 'azuracast' })).toEqual({
      title: 'Song',
      artist: 'Artist',
      artwork: 'https://example.com/art.jpg',
    })
  })

  it('normalizes Laut and Radio Paradise metadata', () => {
    expect(normalizeNowPlaying({
      title: 'Laut song',
      artist: { name: 'Laut artist', image: 'javascript:alert(1)' },
    }, { adapter: 'laut' })).toEqual({ title: 'Laut song', artist: 'Laut artist' })

    expect(normalizeNowPlaying({
      title: 'Paradise song',
      artist: 'Paradise artist',
      cover_med: 'https://example.com/cover.jpg',
    }, { adapter: 'radioParadise' })).toEqual({
      title: 'Paradise song',
      artist: 'Paradise artist',
      artwork: 'https://example.com/cover.jpg',
    })
  })

  it('rejects unsupported stations and methods without contacting an upstream', async () => {
    const unsupported = await handleNowPlayingRequest(
      new Request('https://viberadio.net/api/now-playing/unknown'),
      'unknown',
    )
    expect(unsupported.status).toBe(404)

    const invalidMethod = await handleNowPlayingRequest(
      new Request('https://viberadio.net/api/now-playing/unknown', { method: 'POST' }),
      'unknown',
    )
    expect(invalidMethod.status).toBe(405)
  })
})
