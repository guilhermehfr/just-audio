'use client'

import { useState, useEffect } from 'react'

const FEEDBACK_TEXTS = [
  'Extracting initial minutes',
  'Converting audio format',
  'Analyzing the stream',
  'Building the playlist',
  'Uploading segments',
  'Completing the playlist',
  'Applying final touches',
  'Almost there',
  'Preparing your playback',
  'Finalizing extraction',
]

export function LoadingFeedback(): React.ReactNode {
  const [textIndex, setTextIndex] = useState(0)
  const [dotCount, setDotCount] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setTextIndex((i) => (i + 1) % FEEDBACK_TEXTS.length)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setDotCount((i) => (i + 1) % 4)
    }, 500)
    return () => clearInterval(id)
  }, [])

  return (
    <p className="text-center text-sm text-muted">
      {FEEDBACK_TEXTS[textIndex]}{'.'.repeat(dotCount)}
    </p>
  )
}
