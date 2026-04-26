import { Request, Response } from 'express'
import {
  ApiResponse,
  AudioExtractionRequest,
  AudioExtractionResponse,
} from '../types'
import { ApiError } from '../middleware/errorHandler'
import { AudioExtractionService } from '../services/AudioExtractionService'
import { createAudioStream as createFFmpegStream } from '../utils/ffmpeg-stream'

export class AudioController {
  constructor(private audioExtractionService: AudioExtractionService) {}

  async getAudioInfo(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.body

      this.audioExtractionService.validateUrl(url)

      const metadata = await this.audioExtractionService.fetchMetadata(url)

      const response: ApiResponse<AudioExtractionResponse> = {
        success: true,
        data: {
          title: metadata.title,
          duration: metadata.duration,
          thumbnail: metadata.thumbnail,
        },
        timestamp: new Date().toISOString(),
      }

      res.json(response)
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.log('Unexpected error in getAudioInfo', error)
      throw new ApiError('INTERNAL_ERROR', 'Failed to fetch audio info')
    }
  }

  async extractAudio(req: Request, res: Response): Promise<void> {
    const trackingId = this.generateTrackingId(req.body.trackingId)

    try {
      const { url } = req.body as AudioExtractionRequest

      this.audioExtractionService.validateUrl(url)

      const metadata = await this.audioExtractionService.fetchMetadata(url)

      const response: ApiResponse<AudioExtractionResponse> = {
        success: true,
        data: {
          title: metadata.title,
          duration: metadata.duration,
          thumbnail: metadata.thumbnail,
          audioUrl: `/api/audio/stream/${trackingId}`,
          trackingId,
        },
        timestamp: new Date().toISOString(),
      }

      res.json(response)
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.log('Unexpected error in extractAudio', error)
      throw new ApiError('INTERNAL_ERROR', 'Failed to extract audio')
    }
  }

  async streamAudio(req: Request, res: Response): Promise<void> {
    const trackingId = req.params.trackingId as string

    try {
      if (!trackingId) {
        throw new ApiError('MISSING_TRACKING_ID', 'trackingId is required')
      }

      const { url } = req.query as { url?: string }
      if (!url) {
        throw new ApiError('MISSING_URL', 'URL is required as query parameter')
      }

      const { stream: ytdlpStream } = await this.audioExtractionService.createReadableAudioStream(url)

      const { stream: ffmpegStream } = createFFmpegStream(ytdlpStream)

      res.setHeader('Content-Type', 'audio/mp4')
      res.setHeader('Content-Disposition', `attachment; filename="audio-${trackingId}.m4a"`)
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Transfer-Encoding', 'chunked')

      let headersSent = false

      ffmpegStream.on('data', (chunk) => {
        if (!headersSent) {
          headersSent = true
          console.log(`Stream data flowing for ${trackingId}, chunk: ${chunk.length} bytes`)
        }
      })

      ffmpegStream.pipe(res)

      ffmpegStream.on('end', () => {
        console.log(`Stream completed for ${trackingId}`)
      })

      ffmpegStream.on('error', (error) => {
        console.log('FFmpeg stream error', {
          trackingId,
          error: error instanceof Error ? error.message : String(error),
        })
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: { code: 'STREAM_ERROR', message: 'Audio streaming failed' },
            timestamp: new Date().toISOString(),
          })
        }
      })

      ytdlpStream.on('error', (error) => {
        console.log('yt-dlp stream error', {
          trackingId,
          error: error instanceof Error ? error.message : String(error),
        })
      })

      res.on('error', (error) => {
        console.log('Response stream error', { trackingId, error: error.message })
      })

      res.on('close', () => {
        console.log(`Stream closed for ${trackingId}`)
        if (!ffmpegStream.destroyed) {
          ffmpegStream.destroy()
        }
      })
    } catch (error) {
      if (error instanceof ApiError) throw error

      if (!res.headersSent) {
        console.log('Unexpected error in streamAudio', {
          trackingId,
          error: error instanceof Error ? error.message : String(error),
        })
        throw new ApiError('INTERNAL_ERROR', 'Failed to stream audio')
      }
    }
  }

  private generateTrackingId(provided?: string): string {
    if (provided) return provided
    return `audio-${Date.now()}-${Math.random().toString(36).slice(7)}`
  }
}