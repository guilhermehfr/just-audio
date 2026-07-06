'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Repeat, Volume2, VolumeX } from 'lucide-react'

interface PlayerControlsProps {
  isPlaying: boolean
  speed: number
  loop: boolean
  canSkipBack: boolean
  canSkipForward: boolean
  onTogglePlay: () => void
  onSkipBack: () => void
  onSkipForward: () => void
  onSetSpeed: (speed: number) => void
  onToggleLoop: () => void
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export function PlayerControls({
  isPlaying,
  speed,
  loop,
  canSkipBack,
  canSkipForward,
  onTogglePlay,
  onSkipBack,
  onSkipForward,
  onSetSpeed,
  onToggleLoop,
  audioRef,
}: PlayerControlsProps): React.ReactNode {
  const speeds = [0.5, 1, 1.5, 2]
  const [expanded, setExpanded] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
  }, [volume, audioRef])

  const calcVolume = useCallback((clientX: number) => {
    if (!sliderRef.current) return volume
    const rect = sliderRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }, [volume])

  const handleSliderDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setVolume(calcVolume(e.clientX))

    const onMove = (e: MouseEvent) => {
      e.preventDefault()
      setVolume(calcVolume(e.clientX))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [calcVolume])

  return (
    <>
      <div className="w-full max-w-[840px] mx-auto flex items-center justify-center gap-4 lg:gap-5 pb-8 relative">
        <div className="absolute left-0 h-[52px] lg:h-14">
          <button onClick={() => setExpanded(!expanded)}
                  className={`absolute left-0 z-10 w-[52px] h-[52px] lg:w-14 lg:h-14 rounded-full flex items-center justify-center shrink-0 transition-colors delay-100 cursor-pointer ${expanded ? 'bg-[#2E2E2E]' : 'hover:bg-[#2E2E2E]'}`}>
            {volume === 0 ? (
              <VolumeX className="w-5 h-5 lg:w-6 lg:h-6 text-accent" strokeWidth={1.5} />
            ) : (
              <Volume2 className="w-5 h-5 lg:w-6 lg:h-6 text-accent" strokeWidth={1.5} />
            )}
          </button>
          <div className="absolute top-0 h-full overflow-hidden transition-all duration-200 ease-in-out bg-[#2E2E2E] rounded-r-full flex items-center left-[26px] lg:left-[28px]"
               style={{ width: expanded ? 170 : 0 }}>
            <div className="flex items-center justify-center w-full select-none">
              <div ref={sliderRef}
                    className="relative w-[100px] h-[2px] bg-base rounded-full cursor-pointer select-none"
                    onMouseDown={handleSliderDown} draggable="false">
                <div className="absolute inset-y-0 left-0 bg-accent rounded-full"
                     style={{ width: `${volume * 100}%` }} />
                <div className="absolute w-3 h-3 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-grab active:cursor-grabbing"
                     style={{ left: `${volume * 100}%` }}
                     onMouseDown={(e) => { e.stopPropagation(); handleSliderDown(e) }} draggable="false" />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onSkipBack}
          disabled={!canSkipBack}
          className="flex flex-col items-center gap-0.5 cursor-pointer group disabled:cursor-not-allowed"
          title={!canSkipBack ? 'Within the first 10 seconds' : undefined}
          aria-label="Skip back 10 seconds"
        >
          <SkipBack className={`w-5 h-5 lg:w-6 lg:h-6 transition-colors ${canSkipBack ? 'text-muted group-hover:text-default' : 'text-muted/30'}`} strokeWidth={1.5} />
          <span className={`text-[10px] lg:text-xs transition-colors ${canSkipBack ? 'text-muted group-hover:text-default' : 'text-muted/30'}`}>-10s</span>
        </button>

        <button
          onClick={onTogglePlay}
          className="w-[52px] h-[52px] lg:w-14 lg:h-14 bg-accent rounded-full flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 lg:w-6 lg:h-6 text-base" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5 lg:w-6 lg:h-6 text-base ml-0.5" fill="currentColor" />
          )}
        </button>

        <button
          onClick={onSkipForward}
          disabled={!canSkipForward}
          className="flex flex-col items-center gap-0.5 cursor-pointer group disabled:cursor-not-allowed"
          title={!canSkipForward ? 'Within the last 10 seconds' : undefined}
          aria-label="Skip forward 10 seconds"
        >
          <SkipForward className={`w-5 h-5 lg:w-6 lg:h-6 transition-colors ${canSkipForward ? 'text-muted group-hover:text-default' : 'text-muted/30'}`} strokeWidth={1.5} />
          <span className={`text-[10px] lg:text-xs transition-colors ${canSkipForward ? 'text-muted group-hover:text-default' : 'text-muted/30'}`}>+10s</span>
        </button>
      </div>

      <div className="w-screen relative left-1/2 -translate-x-1/2 border-t-[0.5px] border-[#222222]" />

      <div className="w-full max-w-[840px] mx-auto flex items-center justify-center gap-[19px]">
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => onSetSpeed(s)}
            className={`rounded w-9 h-6 lg:w-10 lg:h-7 flex items-center justify-center text-[10px] lg:text-xs border transition-colors cursor-pointer ${
              speed === s
                ? 'bg-surface text-accent border-accent'
                : 'bg-surface text-muted border-transparent hover:text-default hover:border-muted'
            }`}
          >
            {s}x
          </button>
        ))}

        <button
          onClick={onToggleLoop}
          className={`rounded w-9 h-6 lg:w-10 lg:h-7 flex items-center justify-center border transition-colors cursor-pointer ${
            loop
              ? 'bg-surface text-accent border-accent'
              : 'bg-surface text-muted border-transparent hover:text-default hover:border-muted'
          }`}
          aria-label="Toggle loop"
        >
          <Repeat className="w-3 h-3" strokeWidth={1.5} />
        </button>
      </div>
    </>
  )
}
