export const STATION_VOTE_COOLDOWN_MS = 10 * 60 * 1_000

export function getVoteCooldownRemaining(lastVotedAt: number | null, now = Date.now()) {
  if (lastVotedAt === null || !Number.isFinite(lastVotedAt)) return 0
  return Math.max(0, STATION_VOTE_COOLDOWN_MS - Math.max(0, now - lastVotedAt))
}
