const SUPPORTED_DOMAINS = ['youtube.com', 'youtu.be', 'youtube-nocookie.com'] as const

const VIDEO_ID_REGEX = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|vi\/|shorts\/|live\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/

export function isValidYoutubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return SUPPORTED_DOMAINS.some((domain) => urlObj.hostname.includes(domain))
  } catch {
    return false
  }
}

export function extractVideoId(url: string): string | null {
  const match = url.match(VIDEO_ID_REGEX)
  return match ? match[1] : null
}
