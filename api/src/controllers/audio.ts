import { Request, Response } from 'express'
import path from 'node:path'
import fs from 'node:fs/promises'
import { ApiError } from '../middleware/errorHandler'
import { AudioExtractionService } from '../services/AudioExtraction'
import { downloadFile, fileExists } from '../services/AudioStorage'
import { isValidVideoUrl } from '@/utils/youtube-dl'
import { env } from '../config/env'

interface PostAudioBody {
  url: string
}

interface GetAudioParams {
  trackingId: string
  file: string
}

interface GetStatusParams {
  trackingId: string
}

let activeJobs = 0

export function resetActiveJobs() {
  activeJobs = 0
}

export class AudioController {
  constructor(private audioExtractionService: AudioExtractionService) {}

  async postAudio(req: Request<{}, {}, PostAudioBody>, res: Response): Promise<void> {
    try {
      const { url } = req.body

      if (!url) throw new ApiError('MISSING_URL', 'URL is required')

      if (activeJobs >= env.audio.maxConcurrentJobs) {
        throw new ApiError('TOO_MANY_REQUESTS', 'Server busy, try again later')
      }

      const trackingId = this.generateTrackingId(url)
      const metadata = await this.audioExtractionService.fetchMetadata(url)

      const alreadyProcessed = await downloadFile(`${trackingId}/playlist.m3u8`)
        .then((data) => data !== null)
        .catch(() => false)

      if (!alreadyProcessed) {
        activeJobs++
        this.audioExtractionService
          .processAudio(url, trackingId, metadata.duration)
          .catch((error: Error | unknown) => {
            console.error(
              `Processing failed for ${trackingId}:`,
              error instanceof Error ? error.message : error
            )
          })
          .finally(() => {
            activeJobs--
          })
      }

      res.json({
        success: true,
        data: {
          trackingId,
          title: metadata.title,
          duration: metadata.duration,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('Unexpected error in postAudio', error)
      throw new ApiError('INTERNAL_ERROR', 'Failed to process audio')
    }
  }

  async getStatus(req: Request<GetStatusParams>, res: Response): Promise<void> {
    const { trackingId } = req.params
    if (!trackingId) throw new ApiError('MISSING_PARAMETERS', 'Missing tracking ID')

    const exists = await fileExists(`${trackingId}/playlist.m3u8`)
    res.json({ success: true, data: { ready: exists }, timestamp: new Date().toISOString() })
  }

  async getAudio(req: Request<GetAudioParams>, res: Response): Promise<void> {
    try {
      const { trackingId, file } = req.params

      if (!trackingId || !file)
        throw new ApiError('MISSING_PARAMETERS', 'Missing tracking ID or filename')

      const contentType = file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t'

      try {
        const data = await downloadFile(`${trackingId}/${file}`)
        if (data) {
          res.setHeader('Content-Type', contentType)
          res.send(data)
          return
        }
      } catch {}

      // fallback: /tmp
      const tmpPath = path.join(env.audio.tempDir, trackingId, file)
      try {
        const data = await fs.readFile(tmpPath)
        res.setHeader('Content-Type', contentType)
        res.send(data)
        return
      } catch {
        throw new ApiError('NOT_FOUND', `File not found: ${file}`)
      }
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('Unexpected error in getAudio', error)
      throw new ApiError('INTERNAL_ERROR', 'Failed to stream audio')
    }
  }

  private generateTrackingId(url: string): string {
    if (!isValidVideoUrl(url)) throw new ApiError('INVALID_URL', 'Invalid YouTube URL')

    const domainsRegex =
      '(?:youtube\\.com\\/(?:watch\\?(?:.*&)?v=|embed\\/|v\\/|vi\\/|shorts\\/|live\\/)|youtu\\.be\\/|youtube-nocookie\\.com\\/embed\\/)'

    const regex = new RegExp(`${domainsRegex}([a-zA-Z0-9_-]{11})`)
    const match = url.match(regex)

    if (!match) throw new ApiError('INVALID_URL', 'Could not extract video ID from URL')

    return `audio-${match[1]}`
  }
}
