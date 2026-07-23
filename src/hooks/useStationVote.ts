import { useCallback, useEffect, useState } from 'react'
import { voteForStation } from '../api/radioBrowser'
import { getVoteCooldownRemaining } from '../domain/stationVote'
import type { Station } from '../types'

const VOTE_STORAGE_KEY = 'vibe-radio:station-votes'

function readLastVote(stationUuid: string) {
  try {
    const stored = JSON.parse(localStorage.getItem(VOTE_STORAGE_KEY) ?? '{}') as Record<string, unknown>
    const value = stored[stationUuid]
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

function writeLastVote(stationUuid: string, votedAt: number) {
  try {
    const stored = JSON.parse(localStorage.getItem(VOTE_STORAGE_KEY) ?? '{}') as Record<string, unknown>
    const votes = Object.fromEntries(
      Object.entries(stored).filter(([, value]) => typeof value === 'number' && getVoteCooldownRemaining(value) > 0),
    )
    localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify({ ...votes, [stationUuid]: votedAt }))
  } catch {
    return
  }
}

export function useStationVote(station: Station | null) {
  const [votes, setVotes] = useState(station?.votes ?? 0)
  const [lastVotedAt, setLastVotedAt] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const supported = Boolean(station && !station.stationuuid.startsWith('verified-'))
  const cooldownRemaining = getVoteCooldownRemaining(lastVotedAt)

  useEffect(() => {
    setVotes(station?.votes ?? 0)
    setLastVotedAt(station ? readLastVote(station.stationuuid) : null)
    setSubmitting(false)
    setFeedback('')
  }, [station])

  useEffect(() => {
    if (cooldownRemaining <= 0) return
    const timer = window.setTimeout(() => setLastVotedAt(null), cooldownRemaining + 50)
    return () => window.clearTimeout(timer)
  }, [cooldownRemaining])

  const vote = useCallback(async () => {
    if (!station || !supported || submitting || cooldownRemaining > 0) return
    setSubmitting(true)
    setFeedback('')
    try {
      await voteForStation(station.stationuuid)
      const votedAt = Date.now()
      setVotes(value => value + 1)
      setLastVotedAt(votedAt)
      writeLastVote(station.stationuuid, votedAt)
      setFeedback('Tu voto se ha registrado.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo registrar el voto.')
    } finally {
      setSubmitting(false)
    }
  }, [cooldownRemaining, station, submitting, supported])

  return {
    votes,
    supported,
    submitting,
    votedRecently: cooldownRemaining > 0,
    feedback,
    vote,
  }
}
