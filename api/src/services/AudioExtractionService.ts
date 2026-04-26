import {
  getVideoMetadata,
  isValidVideoUrl,
  YouTubeDLError,
  createAudioStream,
} from '../utils/youtube-dl'
import { ApiError } from '../middleware/errorHandler'

export class AudioExtractionService {
  validateUrl(url: string): void {
    if (!url) {
      throw new ApiError('MISSING_URL', 'URL is required')
    }

    if (!isValidVideoUrl(url)) {
      throw new ApiError('INVALID_URL', 'URL is not a supported video platform')
    }
  }

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
}