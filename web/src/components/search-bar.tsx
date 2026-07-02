'use client'

import { ClipboardPaste, Play } from 'lucide-react'
import { useState } from 'react'
import { postAudio, getAudioFile } from '@/lib/api'

export function SearchBar(): React.ReactNode {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!url.trim()) return
    setLoading(true)
    try {
      const { trackingId } = await postAudio(url.trim())
      console.log(`Extraction started — trackingId: ${trackingId}`)

      const maxAttempts = 30
      const intervalMs = 2000
      for (let i = 0; i < maxAttempts; i++) {
        const pollRes = await getAudioFile(trackingId, 'playlist.m3u8')
        if (pollRes.ok) {
          console.log(`Playlist ready! (attempt ${i + 1}/${maxAttempts})`)
          return
        }
        console.log(`Poll attempt ${i + 1}/${maxAttempts}: 404 — retrying in ${intervalMs}ms`)
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
    <div className="w-full max-w-[840px] mx-auto px-5">
      <div className="flex items-center justify-between h-[50px] lg:h-12 bg-surface border border-muted rounded-lg px-2 lg:px-5">
        <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
          <ClipboardPaste className="w-5 h-5 lg:w-7 lg:h-7 text-default shrink-0" strokeWidth={1} />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste the youtube video url..."
            className="bg-transparent text-default text-sm lg:text-xl outline-none placeholder:text-muted min-w-0 flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !url.trim()}
          className="w-8 h-8 lg:w-10 lg:h-10 bg-accent rounded-lg flex items-center justify-center shrink-0 disabled:opacity-50"
        >
          <Play className="w-3 h-3 lg:w-[15px] lg:h-[15px] text-base" fill="currentColor" />
        </button>
      </div>
    </div>
  )
}
