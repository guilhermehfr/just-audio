'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Hls from 'hls.js'

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const duration = initialDuration
  const [speed, setSpeedState] = useState(1)
  const [loop, setLoop] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !playlistUrl) return

    hlsRef.current?.destroy()
    setHasLoaded(false)
    setCurrentTime(0)
    setIsPlaying(false)
    audio.currentTime = 0

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (audio.currentTime > 0) setHasLoaded(true)
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)
    const onLoadedMeta = () => {
      setHasLoaded(true)
    }
    const onCanPlay = () => setHasLoaded(true)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('loadedmetadata', onLoadedMeta)
    audio.addEventListener('canplay', onCanPlay)

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.config.startPosition = 0
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

  const canSkipBack = hasLoaded && currentTime >= 10
  const canSkipForward = hasLoaded && currentTime + 10 <= duration

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
    isPlaying,
    currentTime,
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
