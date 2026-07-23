import { useCallback, useEffect, useRef, useState } from 'react'
import { getNowPlaying, registerStationClick } from '../api/radioBrowser'
import { recordStationListen, recordTrackListen } from '../domain/listeningHistory'
import { normalizeStation } from '../domain/station'
import type { Station, TrackMetadata } from '../types'

const PLAYER_STORAGE_KEY = 'vibe-radio:player'
const DEFAULT_VOLUME = 0.75
const MAX_RECONNECT_ATTEMPTS = 4
const RECONNECT_DELAYS_MS = [2_000, 5_000, 10_000, 20_000]

type StoredPlayer = {
  station: Station | null
  volume: number
}

function readStoredPlayer(): StoredPlayer {
  try {
    const value = JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY) ?? '{}') as Record<string, unknown>
    const volume = typeof value.volume === 'number' && Number.isFinite(value.volume)
      ? Math.min(1, Math.max(0, value.volume))
      : DEFAULT_VOLUME
    return { station: normalizeStation(value.station), volume }
  } catch {
    return { station: null, volume: DEFAULT_VOLUME }
  }
}

export function useRadioPlayer() {
  const [storedPlayer] = useState(readStoredPlayer)
  const [current, setCurrent] = useState<Station | null>(storedPlayer.station)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [volume, setVolumeState] = useState(storedPlayer.volume)
  const [track, setTrack] = useState<TrackMetadata | null>(null)
  const [history, setHistory] = useState<TrackMetadata[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const currentRef = useRef(current)
  const volumeRef = useRef(volume)
  const playbackIntentRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<number | null>(null)

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current === null) return
    window.clearTimeout(reconnectTimerRef.current)
    reconnectTimerRef.current = null
  }, [])

  useEffect(() => {
    currentRef.current = current
    try {
      localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify({ station: current, volume: volumeRef.current }))
    } catch {
      return
    }
  }, [current])

  useEffect(() => {
    volumeRef.current = volume
    try {
      localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify({ station: currentRef.current, volume }))
    } catch {
      return
    }
  }, [volume])

  useEffect(() => {
    if (!current) return
    const controller = new AbortController()
    const poll = async () => {
      const metadata = await getNowPlaying(current.stationuuid, controller.signal).catch(() => null)
      if (controller.signal.aborted) return
      setTrack(metadata)
      if (metadata) {
        setHistory(items => [metadata, ...items.filter(item => item.title !== metadata.title)].slice(0, 10))
        recordTrackListen(current, metadata)
      }
    }
    void poll()
    const timer = window.setInterval(poll, 30_000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [current])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volumeRef.current

    const attemptReconnect = async () => {
      reconnectTimerRef.current = null
      const station = currentRef.current
      if (!station || !playbackIntentRef.current) return
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setPlaying(false)
        setLoading(false)
        setError('La emisora ha interrumpido la emisión. Pulsa reproducir para intentarlo de nuevo.')
        return
      }

      reconnectAttemptsRef.current += 1
      setPlaying(false)
      setLoading(true)
      setError(`Reconectando con la emisora (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})…`)
      audio.src = station.url_resolved
      audio.load()

      try {
        await audio.play()
      } catch {
        scheduleReconnect()
      }
    }

    const scheduleReconnect = (minimumDelay = 0) => {
      if (!playbackIntentRef.current || reconnectTimerRef.current !== null || !navigator.onLine) return
      const delayIndex = Math.min(reconnectAttemptsRef.current, RECONNECT_DELAYS_MS.length - 1)
      const delay = Math.max(minimumDelay, RECONNECT_DELAYS_MS[delayIndex])
      setLoading(true)
      reconnectTimerRef.current = window.setTimeout(() => void attemptReconnect(), delay)
    }

    const onError = () => {
      setPlaying(false)
      scheduleReconnect()
    }
    const onPlaying = () => {
      clearReconnectTimer()
      reconnectAttemptsRef.current = 0
      setPlaying(true)
      setLoading(false)
      setError('')
    }
    const onPause = () => setPlaying(false)
    const onWaiting = () => {
      if (!playbackIntentRef.current) return
      setLoading(true)
      scheduleReconnect(8_000)
    }
    const onStalled = () => scheduleReconnect(5_000)
    const onEnded = () => scheduleReconnect()
    const onOffline = () => {
      clearReconnectTimer()
      setPlaying(false)
      setLoading(true)
      setError('Sin conexión. Reanudaremos la emisora cuando vuelva la red.')
    }
    const onOnline = () => {
      reconnectAttemptsRef.current = 0
      scheduleReconnect()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !playbackIntentRef.current) return
      if (audio.paused || audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) scheduleReconnect()
    }

    audio.addEventListener('error', onError)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('stalled', onStalled)
    audio.addEventListener('ended', onEnded)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearReconnectTimer()
      audio.removeEventListener('error', onError)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('stalled', onStalled)
      audio.removeEventListener('ended', onEnded)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [clearReconnectTimer])

  const playStation = async (station: Station) => {
    const audio = audioRef.current
    if (!audio) return
    clearReconnectTimer()
    playbackIntentRef.current = true
    reconnectAttemptsRef.current = 0
    currentRef.current = station
    setCurrent(station)
    setTrack(null)
    setHistory([])
    setError('')
    setLoading(true)
    audio.src = station.url_resolved
    audio.volume = volumeRef.current

    try {
      await audio.play()
      registerStationClick(station.stationuuid)
      recordStationListen(station)
    } catch {
      setPlaying(false)
      setError('No se pudo reproducir este stream.')
      setLoading(false)
    }
  }

  const pausePlayback = useCallback(() => {
    playbackIntentRef.current = false
    reconnectAttemptsRef.current = 0
    clearReconnectTimer()
    const audio = audioRef.current
    if (audio) audio.pause()
    setPlaying(false)
    setLoading(false)
    setError('')
  }, [clearReconnectTimer])

  const togglePlayback = async () => {
    const audio = audioRef.current
    const station = currentRef.current
    if (!audio || !station) return
    if (!audio.paused) {
      pausePlayback()
      return
    }

    clearReconnectTimer()
    reconnectAttemptsRef.current = 0
    playbackIntentRef.current = true
    setError('')
    setLoading(true)
    if (!audio.src) audio.src = station.url_resolved

    try {
      await audio.play()
    } catch {
      setError('El enlace de esta emisora no responde.')
      setLoading(false)
    }
  }

  const setVolume = (value: number) => {
    const normalized = Math.min(1, Math.max(0, value))
    setVolumeState(normalized)
    volumeRef.current = normalized
    if (audioRef.current) audioRef.current.volume = normalized
  }

  return {
    audioRef,
    current,
    playing,
    loading,
    error,
    volume,
    track,
    history,
    playStation,
    pausePlayback,
    togglePlayback,
    setVolume,
  }
}

export type RadioPlayerController = ReturnType<typeof useRadioPlayer>
