import {
  getVideoMetadata,
  isValidVideoUrl,
  YouTubeDLError,
  createAudioStream,
} from '../utils/youtube-dl'
import { ApiError } from '../middleware/errorHandler'
import { ProgressService } from './ProgressService'

/**
 * AudioExtractionService - Orchestrates audio extraction workflow
 * Handles URL validation, metadata fetching, and stream creation
 */
export class AudioExtractionService {
  constructor(private progressService: ProgressService) {}

  /**
   * Validate URL is a supported video platform
   */
  validateUrl(url: string): void {
    if (!url) {
      throw new ApiError('MISSING_URL', 'URL is required')
    }

    if (!isValidVideoUrl(url)) {
      throw new ApiError('INVALID_URL', 'URL is not a supported video platform')
    }
  }

  /**
   * Fetch video metadata
   */
  async fetchMetadata(url: string) {
    try {
      return await getVideoMetadata(url)
    } catch (error) {
      if (error instanceof YouTubeDLError) {
        throw new ApiError('FETCH_FAILED', error.message)
      }
      throw error
    }
  }

  /**
   * Create audio stream for URL
   * Returns readable stream
   */
  async createReadableAudioStream(url: string, onProgress?: (message: string) => void) {
    try {
      return await createAudioStream(url, onProgress)
    } catch (error) {
      if (error instanceof YouTubeDLError) {
        throw new ApiError('STREAM_FAILED', error.message)
      }
      throw error
    }
  }

  /**
   * Initialize progress tracking for a streaming session
   */
  async initializeStreaming(trackingId: string): Promise<void> {
    await this.progressService.initializeTracking(trackingId)
  }

  /**
   * Update streaming progress
   */
  async updateStreamProgress(trackingId: string, message: string): Promise<void> {
    await this.progressService.updateProgress(trackingId, message, 'downloading')
  }

  /**
   * Mark streaming as complete
   */
  async completeStreaming(trackingId: string): Promise<void> {
    await this.progressService.complete(trackingId)
  }

  /**
   * Handle streaming error
   */
  async handleStreamingError(trackingId: string, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await this.progressService.setError(trackingId, errorMessage)
    console.log('Audio streaming error', { trackingId, error: errorMessage })
  }
}
