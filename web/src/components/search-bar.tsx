'use client'

import { useState } from 'react'
import { getAudioStatus, BASE_URL } from '@/lib/api'
import { extractAudio } from '@/lib/actions'
import { useAudioPlayer } from '@/lib/use-audio-player'
import { SearchInput } from '@/components/search-input'
import { WaveformSpinner } from '@/components/waveform-spinner'
import { LoadingFeedback } from '@/components/loading-feedback'
import { PlayerSection } from '@/components/player-section'

export function SearchBar(): React.ReactNode {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [submittedUrl, setSubmittedUrl] = useState('')
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(0)
  const [trackingId, setTrackingId] = useState('')
  const [ready, setReady] = useState(false)
  const [waveKey, setWaveKey] = useState(0)
  const [error, setError] = useState('')

  const playlistUrl = ready && trackingId
    ? `${BASE_URL}/api/audio/${trackingId}/playlist.m3u8`
    : null

  const {
    audioRef,
    isPlaying,
    currentTime,
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
  } = useAudioPlayer(playlistUrl, duration)

  async function handleSubmit() {
    if (!url.trim()) return
    setError('')
    setLoading(true)
    setReady(false)

    const result = await extractAudio(url.trim())

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    const data = result.data!
    setSubmittedUrl(url.trim())
    setTitle(data.title)
    setDuration(data.duration)
    setTrackingId(data.trackingId)
    console.log(`Extraction started — trackingId: ${data.trackingId}`)

    const maxAttempts = 30
    const intervalMs = 2000
    for (let i = 0; i < maxAttempts; i++) {
      const ready = await getAudioStatus(data.trackingId)
      if (ready) {
        console.log(`Playlist ready! (attempt ${i + 1}/${maxAttempts})`)
        setUrl('')
        setWaveKey((k) => k + 1)
        setReady(true)
        break
      }
      console.log(`Poll attempt ${i + 1}/${maxAttempts}: not ready — retrying in ${intervalMs}ms`)
      await new Promise((r) => setTimeout(r, intervalMs))
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-[840px] mx-auto flex flex-col gap-4">
      <SearchInput
        value={url}
        onChange={setUrl}
        onSubmit={handleSubmit}
        disabled={loading}
        error={error}
      />

      {loading && !ready && (
        <>
          <WaveformSpinner />
          <LoadingFeedback />
        </>
      )}

      {ready && (
        <PlayerSection
          trackingId={trackingId}
          title={title}
          url={submittedUrl}
          duration={duration}
          waveKey={waveKey}
          audioRef={audioRef}
          isPlaying={isPlaying}
          currentTime={currentTime}
          speed={speed}
          loop={loop}
          canSkipBack={canSkipBack}
          canSkipForward={canSkipForward}
          onTogglePlay={togglePlay}
          onSkipBack={skipBack}
          onSkipForward={skipForward}
          onSetSpeed={setSpeed}
          onToggleLoop={toggleLoop}
          onSeek={seekTo}
        />
      )}
    </div>
  )
}
