import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioExtractionService } from '../../services/AudioExtraction'
import { ApiError } from '../../middleware/errorHandler'
vi.mock('../../config/env', () => ({
  env: {
    audio: {
      tempDir: '/tmp/audios',
      maxDuration: 14400,
      maxFileSize: 500,
      ttl: 86400,
      maxConcurrentJobs: 3,
    },
  },
}))

vi.mock('../../utils/youtube-dl', () => ({
  getVideoMetadata: vi.fn(),
  createAudioStream: vi.fn(),
  YouTubeDLError: class YouTubeDLError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'YouTubeDLError'
    }
  },
}))

vi.mock('../../utils/ffmpeg-stream', () => ({
  segmentAudioToHLS: vi.fn(),
}))

vi.mock('../../services/AudioStorage', () => ({
  uploadFile: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('node:fs/promises', async (importOriginal) => {
  const original = (await importOriginal()) as any
  return {
    ...original,
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn(),
    readFile: vi.fn(),
  }
})

describe('AudioExtractionService', () => {
  let service: AudioExtractionService
  let youtubeDl: typeof import('../../utils/youtube-dl')
  let ffmpegStream: typeof import('../../utils/ffmpeg-stream')
  let audioStorage: typeof import('../../services/AudioStorage')
  let fs: typeof import('node:fs/promises')

  beforeEach(async () => {
    vi.clearAllMocks()
    service = new AudioExtractionService()
    youtubeDl = await import('../../utils/youtube-dl')
    ffmpegStream = await import('../../utils/ffmpeg-stream')
    audioStorage = await import('../../services/AudioStorage')
    fs = await import('node:fs/promises')
  })

  describe('fetchMetadata', () => {
    it('returns VideoInfo for valid URL', async () => {
      const mockMetadata = { title: 'Test Video', duration: 120 }
      vi.mocked(youtubeDl.getVideoMetadata).mockResolvedValue(mockMetadata)

      const result = await service.fetchMetadata('https://www.youtube.com/watch?v=57_O4pxPSxs')

      expect(result).toEqual(mockMetadata)
      expect(youtubeDl.getVideoMetadata).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=57_O4pxPSxs'
      )
    })

    it('throws ApiError with FETCH_FAILED code instead of YouTubeDLError', async () => {
      vi.mocked(youtubeDl.getVideoMetadata).mockRejectedValue(
        new youtubeDl.YouTubeDLError('yt-dlp failed')
      )

      await expect(
        service.fetchMetadata('https://www.youtube.com/watch?v=57_O4pxPSxs')
      ).rejects.toThrow(ApiError)
    })

    it('YouTubeDLError is converted to FETCH_FAILED', async () => {
      vi.mocked(youtubeDl.getVideoMetadata).mockRejectedValue(
        new youtubeDl.YouTubeDLError('yt-dlp failed')
      )

      try {
        await service.fetchMetadata('https://www.youtube.com/watch?v=57_O4pxPSxs')
      } catch (error) {
        expect((error as ApiError).code).toBe('FETCH_FAILED')
      }
    })
  })

  describe('processAudio', () => {
    it('creates directory and processes audio with HLS', async () => {
      vi.mocked(youtubeDl.createAudioStream).mockResolvedValue({ stream: {} as any })

      await service.processAudio('https://www.youtube.com/watch?v=57_O4pxPSxs', 'track-123', 120)

      expect(youtubeDl.createAudioStream).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=57_O4pxPSxs'
      )
      expect(ffmpegStream.segmentAudioToHLS).toHaveBeenCalledWith(
        {},
        'track-123',
        '/tmp/audios/track-123',
        120
      )
    })

    it('reads segments from outputDir and uploads to S3 with correct content types', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['playlist.m3u8', 'segment_000.ts'] as any)
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('mock'))
      vi.mocked(youtubeDl.createAudioStream).mockResolvedValue({ stream: {} as any })
      vi.mocked(ffmpegStream.segmentAudioToHLS).mockImplementation(async () => {
        const outputDir = '/tmp/audios/track-123'
        const files = await fs.readdir(outputDir)
        for (const file of files) {
          const data = await fs.readFile(`${outputDir}/${file}`)
          const contentType = file.endsWith('.m3u8')
            ? 'application/vnd.apple.mpegurl'
            : 'video/mp2t'
          await audioStorage.uploadFile(`track-123/${file}`, data, contentType)
        }
      })

      await service.processAudio('https://www.youtube.com/watch?v=57_O4pxPSxs', 'track-123', 120)

      expect(fs.readdir).toHaveBeenCalledWith('/tmp/audios/track-123')
      expect(audioStorage.uploadFile).toHaveBeenCalledWith(
        'track-123/playlist.m3u8',
        expect.any(Buffer),
        'application/vnd.apple.mpegurl'
      )
      expect(audioStorage.uploadFile).toHaveBeenCalledWith(
        'track-123/segment_000.ts',
        expect.any(Buffer),
        'video/mp2t'
      )
    })

    it('throws ApiError with STREAM_FAILED code instead of YouTubeDLError', async () => {
      vi.mocked(youtubeDl.createAudioStream).mockRejectedValue(
        new youtubeDl.YouTubeDLError('stream failed')
      )

      await expect(
        service.processAudio('https://www.youtube.com/watch?v=57_O4pxPSxs', 'track-123', 120)
      ).rejects.toThrow(ApiError)
    })

    it('YouTubeDLError is converted to STREAM_FAILED', async () => {
      vi.mocked(youtubeDl.createAudioStream).mockRejectedValue(
        new youtubeDl.YouTubeDLError('stream failed')
      )

      try {
        await service.processAudio('https://www.youtube.com/watch?v=57_O4pxPSxs', 'track-123', 120)
      } catch (error) {
        expect((error as ApiError).code).toBe('STREAM_FAILED')
      }
    })
  })
})
