import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app'

vi.mock('../config/env', () => ({
  env: {
    audio: {
      tempDir: '/tmp/audios',
      quality: 0,
      maxDuration: 14400,
      maxFileSize: 500,
      ttl: 86400,
    },
    minio: {
      bucket: 'test-bucket',
      endpoint: 'http://localhost:9000',
      accessKey: 'test',
      secretKey: 'test',
      region: 'auto',
    },
    server: {
      port: 3000,
      nodeEnv: 'test',
    },
    cors: {
      origin: '*',
    },
  },
}))

const { mockFetchMetadata, mockProcessAudio, mockDownloadFile, mockIsValidVideoUrl } = vi.hoisted(
  () => ({
    mockFetchMetadata: vi.fn().mockResolvedValue({ title: 'Test Video', duration: 120 }),
    mockProcessAudio: vi.fn().mockResolvedValue(undefined),
    mockDownloadFile: vi.fn().mockResolvedValue(Buffer.from('mock-audio')),
    mockIsValidVideoUrl: vi.fn().mockReturnValue(true),
  })
)

vi.mock('../utils/youtube-dl', () => ({
  isValidVideoUrl: mockIsValidVideoUrl,
  YouTubeDLError: class YouTubeDLError extends Error {
    name = 'YouTubeDLError'
  },
}))

vi.mock('../services/AudioExtraction', () => ({
  AudioExtractionService: class MockAudioExtractionService {
    fetchMetadata = mockFetchMetadata
    processAudio = mockProcessAudio
  },
}))

vi.mock('../services/AudioStorage', () => ({
  downloadFile: mockDownloadFile,
  uploadFile: vi.fn().mockResolvedValue(undefined),
}))

describe('POST /api/audio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchMetadata.mockResolvedValue({ title: 'Test Video', duration: 120 })
    mockProcessAudio.mockResolvedValue(undefined)
    mockIsValidVideoUrl.mockReturnValue(true)
  })

  it('returns 200 with metadata for valid YouTube URL', async () => {
    const res = await request(app)
      .post('/api/audio')
      .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toMatchObject({
      trackingId: 'audio-dQw4w9WgXcQ',
      title: 'Test Video',
      duration: 120,
    })
  })

  it('returns 400 MISSING_URL when body is empty', async () => {
    mockIsValidVideoUrl.mockReturnValue(false)
    const res = await request(app).post('/api/audio').send({})

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('MISSING_URL')
  })

  it('returns 400 INVALID_URL when not a YouTube URL', async () => {
    mockIsValidVideoUrl.mockReturnValue(false)
    const res = await request(app).post('/api/audio').send({ url: 'https://not-youtube.com/video' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_URL')
  })

  it('returns 500 PROCESSING_FAILED when processAudio throws', async () => {
    mockProcessAudio.mockRejectedValueOnce(new Error('ffmpeg failed'))
    mockDownloadFile.mockResolvedValueOnce(null)

    const res = await request(app)
      .post('/api/audio')
      .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })

    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe('PROCESSING_FAILED')
  })

  it('returns 500 INTERNAL_ERROR on unexpected error', async () => {
    mockFetchMetadata.mockRejectedValueOnce(new Error('unexpected'))

    const res = await request(app)
      .post('/api/audio')
      .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })

    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('GET /api/audio/:trackingId/:file', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 when file found in S3', async () => {
    mockDownloadFile.mockResolvedValueOnce(Buffer.from('test-content'))

    const res = await request(app).get('/api/audio/track-123/playlist.m3u8')

    expect(res.status).toBe(200)
  })

  it('returns 404 NOT_FOUND when file not in S3 or disk', async () => {
    mockDownloadFile.mockResolvedValueOnce(null)

    const res = await request(app).get('/api/audio/nonexistent/file.m3u8')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('returns 404 for missing route params', async () => {
    const res = await request(app).get('/api/audio/')

    expect(res.status).toBe(404)
  })

  it('returns 404 when both S3 and disk fail', async () => {
    mockDownloadFile.mockRejectedValueOnce(new Error('S3 error'))

    const res = await request(app).get('/api/audio/track-123/file.m3u8')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
