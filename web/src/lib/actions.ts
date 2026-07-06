'use server'

import { isValidYoutubeUrl } from '@just-audio/shared'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  timestamp: string
}

interface AudioExtractionResult {
  trackingId: string
  title: string
  duration: number
}

export interface ExtractAudioResponse {
  error: { code: string; message: string } | null
  data: AudioExtractionResult | null
}

export async function extractAudio(url: string): Promise<ExtractAudioResponse> {
  if (!isValidYoutubeUrl(url)) {
    return { error: { code: 'INVALID_URL', message: 'Invalid YouTube URL' }, data: null }
  }

  try {
    const res = await fetch(`${API_BASE}/api/audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })

    const body: ApiResponse<AudioExtractionResult> = await res.json()

    if (!body.success || !body.data) {
      const err = body.error
      return {
        error: err ? { code: err.code, message: err.message } : { code: 'UNKNOWN', message: 'Unknown API error' },
        data: null,
      }
    }

    return { error: null, data: body.data }
  } catch (err) {
    return {
      error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Failed to reach server' },
      data: null,
    }
  }
}
