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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function postAudio(url: string): Promise<ApiResponse<AudioExtractionResult>> {
  const res = await fetch(`${BASE_URL}/api/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return res.json()
}

export async function getAudioFile(trackingId: string, file: string): Promise<Response> {
  return fetch(`${BASE_URL}/api/audio/${trackingId}/${file}`)
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
