import { describe, it, expect, vi, beforeEach } from 'vitest'
import { downloadFile, uploadFile } from '../../services/AudioStorage'

vi.mock('../../config/env', () => ({
  env: {
    audio: {
      maxConcurrentJobs: 3,
    },
    minio: {
      bucket: 'test-bucket',
      endpoint: 'http://localhost:9000',
      accessKey: 'test',
      secretKey: 'test',
      region: 'auto',
    },
  },
}))

vi.mock('../../lib/s3', () => {
  const mockSend = vi.fn(() => Promise.resolve({}))
  return {
    s3: { send: mockSend },
  }
})

const getMockSend = async () => {
  const { s3 } = await import('../../lib/s3')
  return vi.mocked(s3.send)
}

describe('downloadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('downloads file from S3 and returns Buffer with correct content', async () => {
    const mockSend = await getMockSend()

    mockSend.mockResolvedValue({
      Body: {
        transformToByteArray: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      },
    } as any)

    const result = await downloadFile('test-file.mp3')

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Key: 'test-file.mp3',
        }),
      })
    )
    expect(result).toBeInstanceOf(Buffer)
    expect(Array.from(result)).toEqual([1, 2, 3])
  })

  it('throws error when file does not exist', async () => {
    const mockSend = await getMockSend()

    mockSend.mockResolvedValue({ Body: undefined } as any)

    await expect(downloadFile('nonexistent.mp3')).rejects.toThrow('File not found: nonexistent.mp3')
  })
})

describe('uploadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads file to S3 with correct parameters', async () => {
    const mockSend = await getMockSend()

    mockSend.mockResolvedValue({} as any)

    const buffer = Buffer.from([1, 2, 3])
    await uploadFile('uploaded.mp3', buffer, 'audio/mpeg')

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Key: 'uploaded.mp3',
          Body: buffer,
          ContentType: 'audio/mpeg',
        }),
      })
    )
  })
})
