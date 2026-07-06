'use client'

import { useState, useRef, useCallback, useEffect, useReducer } from 'react'
import Hls from 'hls.js'

interface PlayerState {
  isPlaying: boolean
  currentTime: number
  hasLoaded: boolean
}

type PlayerAction =
  | { type: 'RESET' }
  | { type: 'TIME_UPDATE'; time: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'LOADED' }

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'RESET':
      return { isPlaying: false, currentTime: 0, hasLoaded: false }
    case 'TIME_UPDATE':
      return { ...state, currentTime: action.time, hasLoaded: state.hasLoaded || action.time > 0 }
    case 'PLAY':
      return { ...state, isPlaying: true }
    case 'PAUSE':
      return { ...state, isPlaying: false }
    case 'LOADED':
      return { ...state, hasLoaded: true }
  }
}

const INITIAL_STATE: PlayerState = { isPlaying: false, currentTime: 0, hasLoaded: false }

export interface AudioPlayerAPI {
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  currentTime: number
  duration: number
  speed: number
  loop: boolean
  canSkipBack: boolean
  canSkipForward: boolean
  togglePlay: () => void
  skipBack: () => void
  skipForward: () => void
  setSpeed: (speed: number) => void
  toggleLoop: () => void
  seekTo: (time: number) => void
}

export function useAudioPlayer(
  playlistUrl: string | null,
  initialDuration: number
): AudioPlayerAPI {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [state, dispatch] = useReducer(playerReducer, INITIAL_STATE)
  const duration = initialDuration
  const [speed, setSpeedState] = useState(1)
  const [loop, setLoop] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !playlistUrl) return

    hlsRef.current?.destroy()
    dispatch({ type: 'RESET' })
    audio.currentTime = 0

    const onTimeUpdate = () => dispatch({ type: 'TIME_UPDATE', time: audio.currentTime })
    const onPlay = () => dispatch({ type: 'PLAY' })
    const onPause = () => dispatch({ type: 'PAUSE' })
    const onEnded = () => {
      audio.currentTime = 0
      dispatch({ type: 'PAUSE' })
    }
    const onLoadedMeta = () => dispatch({ type: 'LOADED' })
    const onCanPlay = () => dispatch({ type: 'LOADED' })

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('loadedmetadata', onLoadedMeta)
    audio.addEventListener('canplay', onCanPlay)

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.config.startPosition = 0
      hls.config.maxBufferLength = 60
      hls.config.backBufferLength = Infinity
      hls.config.lowLatencyMode = false
      hlsRef.current = hls
      hls.loadSource(playlistUrl)
      hls.attachMedia(audio)
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = playlistUrl
    }

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('loadedmetadata', onLoadedMeta)
      audio.removeEventListener('canplay', onCanPlay)
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [playlistUrl])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }, [speed])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop
    }
  }, [loop])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }, [])

  const canSkipBack = state.hasLoaded && state.currentTime >= 10
  const canSkipForward = state.hasLoaded && state.currentTime + 10 <= duration

  const skipBack = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !canSkipBack) return
    audio.currentTime -= 10
  }, [canSkipBack])

  const skipForward = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !canSkipForward) return
    audio.currentTime += 10
  }, [canSkipForward])

  const setSpeed = useCallback((s: number) => {
    setSpeedState(s)
  }, [])

  const toggleLoop = useCallback(() => {
    setLoop(v => !v)
  }, [])

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
  }, [])

  return {
    audioRef,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration,
    speed,
    loop,
    canSkipBack,
    canSkipForward,
    togglePlay,
    skipBack,
    skipForward,
    setSpeed,
    toggleLoop,
    seekTo,
  }
}
