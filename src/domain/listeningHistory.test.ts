import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearListeningHistory, readListeningHistory, recordStationListen, recordTrackListen } from './listeningHistory'
import type { Station } from '../types'

const storage = new Map<string, string>()
const station: Station = {
  stationuuid: '7a3a3989-8f26-44f7-9ae5-fa91e5cf4f9d', name: 'RMC FR', url_resolved: 'https://example.com/stream', homepage: '', favicon: '', tags: 'talk', country: 'France', countrycode: 'FR', state: '', language: 'French', codec: 'MP3', bitrate: 128, votes: 1, clickcount: 1,
}

beforeEach(() => {
  storage.clear()
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) })
  vi.stubGlobal('window', { dispatchEvent: vi.fn() })
})

describe('listening history', () => {
  it('records stations and detected tracks', () => {
    recordStationListen(station)
    recordTrackListen(station, { title: 'Song', artist: 'Artist' })
    expect(readListeningHistory()).toHaveLength(2)
    expect(readListeningHistory()[0].track?.title).toBe('Song')
  })

  it('does not duplicate the same consecutive track', () => {
    recordTrackListen(station, { title: 'Song' })
    recordTrackListen(station, { title: 'Song' })
    expect(readListeningHistory()).toHaveLength(1)
  })

  it('clears persisted entries', () => {
    recordStationListen(station)
    clearListeningHistory()
    expect(readListeningHistory()).toEqual([])
  })
})
