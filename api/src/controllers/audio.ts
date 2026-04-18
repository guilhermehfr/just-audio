import { Request, Response } from 'express'
import { ApiResponse, AudioExtractionRequest, AudioExtractionResponse, ProgressData } from '../types'
import { ApiError } from '../middleware/errorHandler'
import { AudioExtractionService } from '../services/AudioExtractionService'
import { ProgressService } from '../services/ProgressService'
import { createAudioStream as createFFmpegStream } from '../utils/ffmpeg-stream'

/**
 * AudioController - Handle audio extraction endpoints
 * Streams audio directly from yt-dlp → FFmpeg → HTTP response
 */
export class AudioController {
  constructor(
    private audioExtractionService: AudioExtractionService,
    private progressService: ProgressService
  ) {}

  /**
   * Get audio info - Fetch video metadata only
   */
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
      throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to fetch audio info')
    }
  }

  /**
   * Extract audio - Return streaming URL and metadata immediately
   */
  async extractAudio(req: Request, res: Response): Promise<void> {
    const trackingId = this.generateTrackingId(req.body.trackingId)

    try {
      const { url } = req.body as AudioExtractionRequest

      this.audioExtractionService.validateUrl(url)

      await this.audioExtractionService.initializeStreaming(trackingId)


      const metadata = await this.audioExtractionService.fetchMetadata(url)

      const response: ApiResponse<AudioExtractionResponse> = {
        success: true,
        data: {
          title: metadata.title,
          duration: metadata.duration,
          thumbnail: metadata.thumbnail,
          audioUrl: `/api/audio/stream/${trackingId}`,
          progress: '0%',
        },
        timestamp: new Date().toISOString(),
      }

      res.json(response)
    } catch (error) {
      if (trackingId) {
        await this.audioExtractionService.handleStreamingError(trackingId, error)
      }

      if (error instanceof ApiError) throw error
      console.log('Unexpected error in extractAudio', error)
      throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to extract audio')
    }
  }

  /**
   * Stream audio - Pipe ytdl-core → FFmpeg → HTTP response
   * This is called when client accesses the streaming URL
   */
  async streamAudio(req: Request, res: Response): Promise<void> {
    const trackingId = req.params.trackingId as string

    try {
      if (!trackingId) {
        throw new ApiError(400, 'MISSING_TRACKING_ID', 'trackingId is required')
      }

      const { url } = req.query as { url?: string }
      if (!url) {
        throw new ApiError(400, 'MISSING_URL', 'URL is required as query parameter')
      }

      await this.audioExtractionService.updateStreamProgress(trackingId, 'Starting download...')

      const { stream: ytdlpStream } = await this.audioExtractionService.createReadableAudioStream(
        url,
        async (progress) => {
          await this.audioExtractionService.updateStreamProgress(trackingId, progress)
        }
      )

      await this.audioExtractionService.updateStreamProgress(trackingId, 'Processing audio...')

      const { stream: ffmpegStream } = createFFmpegStream(ytdlpStream)

      res.setHeader('Content-Type', 'audio/mp4')
      res.setHeader('Content-Disposition', `attachment; filename="audio-${trackingId}.m4a"`)
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Transfer-Encoding', 'chunked')

      // Track if headers are sent
      let headersSent = false

      // Listen for stream data to confirm flow
      ffmpegStream.on('data', (chunk) => {
        if (!headersSent) {
          headersSent = true
          console.log(`Stream data flowing for ${trackingId}, chunk: ${chunk.length} bytes`)
        }
      })

      // Pipe FFmpeg output to HTTP response
      ffmpegStream.pipe(res)

      ffmpegStream.on('end', async () => {
        console.log(`Stream completed for ${trackingId}`)
        await this.audioExtractionService.completeStreaming(trackingId)
      })

      ffmpegStream.on('error', async (error) => {
        console.log('FFmpeg stream error', { trackingId, error: error instanceof Error ? error.message : String(error) })
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: { code: 'STREAM_ERROR', message: 'Audio streaming failed' },
            timestamp: new Date().toISOString()
          })
        }
        await this.audioExtractionService.handleStreamingError(trackingId, error)
      })

      ytdlpStream.on('error', (error) => {
        console.log('yt-dlp stream error', { trackingId, error: error instanceof Error ? error.message : String(error) })
      })

      res.on('error', (error) => {
        console.log('Response stream error', { trackingId, error: error.message })
      })

      res.on('close', async () => {
        console.log(`Stream closed for ${trackingId}`)
        if (!ffmpegStream.destroyed) {
          ffmpegStream.destroy()
        }
      })
    } catch (error) {
      if (error instanceof ApiError) throw error

      if (trackingId) {
        await this.audioExtractionService.handleStreamingError(trackingId, error)
      }

      if (!res.headersSent) {
        console.log('Unexpected error in streamAudio', { trackingId, error: error instanceof Error ? error.message : String(error) })
        throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to stream audio')
      }
    }
  }

  async getProgress(req: Request, res: Response): Promise<void> {
    try {
      const trackingId = req.params.trackingId as string

      if (!trackingId) {
        throw new ApiError(400, 'MISSING_TRACKING_ID', 'trackingId is required')
      }

      const progress = await this.progressService.getProgress(trackingId)

      if (!progress) {
        throw new ApiError(404, 'NOT_FOUND', 'No progress data found for this trackingId')
      }

      const response: ApiResponse<ProgressData> = {
        success: true,
        data: progress,
        timestamp: new Date().toISOString(),
      }

      res.json(response)
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.log('Unexpected error in getProgress', error)
      throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to get progress')
    }
  }

  /**
   * Generate or use provided tracking ID
   */
  private generateTrackingId(provided?: string): string {
    if (provided) return provided
    return `audio-${Date.now()}-${Math.random().toString(36).slice(7)}`
  }
}
