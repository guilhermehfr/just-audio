'use client'

import { useState, useEffect, useRef } from 'react'

interface WaveformProps {
  duration: number
  currentTime: number
  onSeek?: (time: number) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const BAR_COUNT = 55
const MOBILE_COUNT = 49

function generateBars(): number[] {
  return Array.from({ length: BAR_COUNT }, () => Math.random())
}

export function Waveform({ duration, currentTime, onSeek }: WaveformProps): React.ReactNode {
  const [bars] = useState(generateBars)
  const [isMobile, setIsMobile] = useState(false)
  const barsRef = useRef<HTMLDivElement>(null)

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !barsRef.current || duration <= 0) return
    const rect = barsRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const seekTime = Math.max(0, Math.min(duration, (x / rect.width) * duration))
    onSeek(seekTime)
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const visibleBars = isMobile ? bars.slice(0, MOBILE_COUNT) : bars
  const progress = duration > 0 ? currentTime / duration : 0
  const clipRight = `${(1 - progress) * 100}%`
  const playheadLeft = `${progress * 100}%`

  return (
    <div className="w-full max-w-[840px] mx-auto flex flex-col gap-6">
      <div className="relative flex items-center justify-center w-full h-[70px] lg:h-[130px] cursor-pointer" onClick={handleSeek}>
        <div ref={barsRef} className="relative flex items-center gap-1 lg:gap-2 w-auto h-full">
          {visibleBars.map((r, i) => (
            <div
              key={`g-${i}`}
               className="w-[2px] lg:w-[6px] shrink-0 bg-default/15 rounded-full"
              style={{ height: `${Math.max(4, r * 100)}%` }}
            />
          ))}

          <div
            className="absolute inset-0 flex items-center gap-1 lg:gap-2"
            style={{ clipPath: `inset(0 ${clipRight} 0 0)` }}
          >
            {visibleBars.map((r, i) => (
              <div
                key={`r-${i}`}
                className="w-[2px] lg:w-[6px] shrink-0 bg-accent rounded-full"
                style={{ height: `${Math.max(4, r * 100)}%` }}
              />
            ))}
          </div>

          <div
            className="absolute -top-0.5 -bottom-0.5 w-[2px] lg:w-[6px] bg-default rounded-full"
            style={{ left: playheadLeft }}
          />
        </div>
      </div>

      <div className="relative w-full h-3">
        <span className="absolute left-0 text-[10px] lg:text-xs text-muted font-semibold">
          {formatTime(currentTime)}
        </span>
        <span className="absolute right-0 text-[10px] lg:text-xs text-muted font-semibold">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}
