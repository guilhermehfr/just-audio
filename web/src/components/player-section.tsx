'use client'

import { MetadataBar } from '@/components/metadata-bar'
import { Waveform } from '@/components/waveform'
import { PlayerControls } from '@/components/player-controls'

interface PlayerSectionProps {
  trackingId: string
  title: string
  url: string
  duration: number
  waveKey: number
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  currentTime: number
  speed: number
  loop: boolean
  canSkipBack: boolean
  canSkipForward: boolean
  onTogglePlay: () => void
  onSkipBack: () => void
  onSkipForward: () => void
  onSetSpeed: (speed: number) => void
  onToggleLoop: () => void
  onSeek: (time: number) => void
}

export function PlayerSection({
  trackingId,
  title,
  url,
  duration,
  waveKey,
  audioRef,
  isPlaying,
  currentTime,
  speed,
  loop,
  canSkipBack,
  canSkipForward,
  onTogglePlay,
  onSkipBack,
  onSkipForward,
  onSetSpeed,
  onToggleLoop,
  onSeek,
}: PlayerSectionProps): React.ReactNode {
  return (
    <>
      <div className="flex flex-col gap-8">
        <MetadataBar title={title} url={url} />
        <Waveform key={waveKey} duration={duration} currentTime={currentTime} onSeek={onSeek} />
        <PlayerControls
          isPlaying={isPlaying}
          speed={speed}
          loop={loop}
          canSkipBack={canSkipBack}
          canSkipForward={canSkipForward}
          onTogglePlay={onTogglePlay}
          onSkipBack={onSkipBack}
          onSkipForward={onSkipForward}
          onSetSpeed={onSetSpeed}
          onToggleLoop={onToggleLoop}
          audioRef={audioRef}
        />
      </div>

      <audio key={trackingId} ref={audioRef} />
    </>
  )
}
