'use client'

import { ClipboardPaste, Play } from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { postAudio, getAudioStatus, BASE_URL } from '@/lib/api'
import { useAudioPlayer } from '@/lib/use-audio-player'
import { MetadataBar } from '@/components/metadata-bar'
import { Waveform } from '@/components/waveform'
import { WaveformSpinner } from '@/components/waveform-spinner'
import { PlayerControls } from '@/components/player-controls'

export function SearchBar(): React.ReactNode {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [submittedUrl, setSubmittedUrl] = useState('')
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(0)
  const [trackingId, setTrackingId] = useState('')
  const [ready, setReady] = useState(false)
  const [waveKey, setWaveKey] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(false)

  const playlistUrl = ready && trackingId
    ? `${BASE_URL}/api/audio/${trackingId}/playlist.m3u8`
    : null

  const audio = useAudioPlayer(playlistUrl, duration)

  const updateShadows = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    setShowLeftShadow(el.scrollLeft > 0)
    setShowRightShadow(el.scrollLeft + el.clientWidth < el.scrollWidth)
  }, [])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    updateShadows()
    el.addEventListener('scroll', updateShadows)
    return () => el.removeEventListener('scroll', updateShadows)
  }, [updateShadows])

  useEffect(() => {
    updateShadows()
  }, [url, updateShadows])

  async function handleSubmit() {
    if (!url.trim()) return
    setLoading(true)
    setReady(false)
    try {
      const data = await postAudio(url.trim())
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
          return
        }
        console.log(`Poll attempt ${i + 1}/${maxAttempts}: not ready — retrying in ${intervalMs}ms`)
        await new Promise((r) => setTimeout(r, intervalMs))
      }
      console.error('Poll failed after 30 attempts — timeout')
    } catch (err) {
      console.error('Extraction failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[840px] mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between h-[50px] lg:h-12 bg-surface border border-muted rounded-lg px-2">
        <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
          <ClipboardPaste className="w-5 h-5 lg:w-7 lg:h-7 text-default shrink-0" strokeWidth={1} />
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste the youtube video url..."
              className="bg-transparent text-default text-sm lg:text-xl outline-none placeholder:text-muted w-full"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={loading}
            />
            {showLeftShadow && (
              <div className="absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-surface to-transparent pointer-events-none z-10" />
            )}
            {showRightShadow && (
              <div className="absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-surface to-transparent pointer-events-none z-10" />
            )}
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !url.trim()}
          className="w-8 h-8 lg:w-10 lg:h-10 bg-accent rounded-lg flex items-center justify-center shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-3 h-3 lg:w-[15px] lg:h-[15px] text-base" fill="currentColor" />
        </button>
      </div>

      {loading && !ready && <WaveformSpinner />}

      {ready && (
        <div className="flex flex-col gap-8">
          <MetadataBar title={title} url={submittedUrl} />
          <Waveform key={waveKey} duration={duration} currentTime={audio.currentTime} onSeek={audio.seekTo} />
          <PlayerControls
            duration={audio.duration}
            isPlaying={audio.isPlaying}
            currentTime={audio.currentTime}
            speed={audio.speed}
            loop={audio.loop}
            canSkipBack={audio.canSkipBack}
            canSkipForward={audio.canSkipForward}
            onTogglePlay={audio.togglePlay}
            onSkipBack={audio.skipBack}
            onSkipForward={audio.skipForward}
            onSetSpeed={audio.setSpeed}
            onToggleLoop={audio.toggleLoop}
            audioRef={audio.audioRef}
          />
        </div>
      )}

      <audio key={trackingId} ref={audio.audioRef} />
    </div>
  )
}
