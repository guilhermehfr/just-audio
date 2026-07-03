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

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function postAudio(url: string): Promise<AudioExtractionResult> {
  const res = await fetch(`${BASE_URL}/api/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  const body: ApiResponse<AudioExtractionResult> = await res.json()

  if (!body.success || !body.data) {
    const err = body.error
    throw new Error(err ? `[${err.code}] ${err.message}` : 'Unknown API error')
  }

  return body.data
}

export async function getAudioFile(trackingId: string, file: string): Promise<Response> {
  return fetch(`${BASE_URL}/api/audio/${trackingId}/${file}`)
}

export async function getAudioStatus(trackingId: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/api/audio/${trackingId}/status`)
  const body: ApiResponse<{ ready: boolean }> = await res.json()
  return body.success && body.data?.ready === true
}

export async function pollPlaylist(
  trackingId: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await getAudioFile(trackingId, 'playlist.m3u8')
    if (res.ok) return true
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return false
}
