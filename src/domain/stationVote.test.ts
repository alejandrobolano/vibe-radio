import { describe, expect, it } from 'vitest'
import { getVoteCooldownRemaining, STATION_VOTE_COOLDOWN_MS } from './stationVote'

describe('station vote cooldown', () => {
  it('expires ten minutes after voting', () => {
    expect(getVoteCooldownRemaining(1_000, 1_000)).toBe(STATION_VOTE_COOLDOWN_MS)
    expect(getVoteCooldownRemaining(1_000, 1_000 + STATION_VOTE_COOLDOWN_MS - 1)).toBe(1)
    expect(getVoteCooldownRemaining(1_000, 1_000 + STATION_VOTE_COOLDOWN_MS)).toBe(0)
  })

  it('ignores missing or invalid timestamps', () => {
    expect(getVoteCooldownRemaining(null)).toBe(0)
    expect(getVoteCooldownRemaining(Number.NaN)).toBe(0)
  })
})
