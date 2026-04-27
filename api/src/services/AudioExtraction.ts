import path from 'node:path'

import { ApiError } from '../middleware/errorHandler'
import {
  getVideoMetadata,
  isValidVideoUrl,
  YouTubeDLError,
  createAudioStream,
  VideoInfo,
} from '../utils/youtube-dl'
import { env } from '../config/env'
import { segmentAudioToHLS } from '../utils/ffmpeg-stream'

export class AudioExtractionService {
  validateUrl(url: string): void {
    if (!url) {
      throw new ApiError('MISSING_URL', 'URL is required')
    }

    if (!isValidVideoUrl(url)) {
      throw new ApiError('INVALID_URL', 'URL is not a supported video platform')
    }
  }

  async fetchMetadata(url: string): Promise<VideoInfo> {
    try {
      const metadata = await getVideoMetadata(url)

      if (metadata.duration > env.audio.maxDuration) {
        throw new ApiError(
          'INVALID_URL',
          `Video too long: ${metadata.duration}s (max ${env.audio.maxDuration}s)`
        )
      }

      return metadata
    } catch (error) {
      if (error instanceof YouTubeDLError) {
        throw new ApiError('FETCH_FAILED', error.message)
      }
      throw error
    }
  }

  async processAudio(url: string, trackingId: string, duration: number): Promise<void> {
    try {
      const outputDir = path.join(env.audio.tempDir, trackingId)
      const { stream } = await createAudioStream(url)
      await segmentAudioToHLS(stream, trackingId, outputDir, duration)
    } catch (error) {
      if (error instanceof YouTubeDLError) {
        throw new ApiError('STREAM_FAILED', error.message)
      }
      throw error
    }
  }
}
