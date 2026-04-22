import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

import { Readable } from 'stream'
import { spawn } from 'child_process'

export interface VideoInfo {
  title: string
  duration: number
  thumbnail: string
  width?: number
  height?: number
  ext?: string
}

export class YouTubeDLError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'YouTubeDLError'
  }
}
/**
 * Resolve yt-dlp binary path from youtube-dl-exec package
 */
export function getYtDlpPath(): string {
  const packageJsonPath = require.resolve('youtube-dl-exec/package.json')
  const packageDir = path.dirname(packageJsonPath)

  const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
  const binaryPath = path.join(packageDir, 'bin', binaryName)

  if (!fs.existsSync(binaryPath)) {
    throw new YouTubeDLError(`yt-dlp binary not found at: ${binaryPath}`)
  }

  return binaryPath
}

/**
 * Check if URL is a valid video platform
 */
export function isValidVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const supportedDomains = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com']
    return supportedDomains.some((domain) => urlObj.hostname.includes(domain))
  } catch {
    return false
  }
}

/**
 * Fetch video metadata from URL using yt-dlp binary
 */
export async function getVideoMetadata(url: string): Promise<VideoInfo> {
  try {
    const ytDlpPath = getYtDlpPath()

    return new Promise((resolve, reject) => {
      let jsonOutput = ''
      let errorOutput = ''

      const process = spawn(ytDlpPath, [
        '--js-runtimes', 'node',
        '--dump-json',
        '--no-warnings',
        '-q',
        url,
      ])

      process.stdout?.on('data', (data: Buffer) => {
        jsonOutput += data.toString()
      })

      process.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString()
      })

      process.on('close', (code: number) => {
        if (code === 0) {
          try {
            const info = JSON.parse(jsonOutput)
            const result: VideoInfo = {
              title: info.title || 'Unknown Title',
              duration: info.duration || 0,
              thumbnail: info.thumbnail || '',
              width: info.width,
              height: info.height,
              ext: 'm4a',
            }
            resolve(result)
          } catch (e) {
            reject(new YouTubeDLError(`Failed to parse yt-dlp output: ${e}`))
          }
        } else {
          reject(new YouTubeDLError(`yt-dlp failed with code ${code}: ${errorOutput || 'Unknown error'}`))
        }
      })

      process.on('error', (error: Error) => {
        reject(error)
      })
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.log('Failed to fetch metadata', { error: message, url })
    throw new YouTubeDLError(`Could not fetch video metadata: ${message}`)
  }
}

/**
 * Create audio stream from video URL using yt-dlp binary
 * Returns a readable stream of audio data
 * @param url - Video URL
 * @param onProgress - Optional callback for progress updates
 * @returns Stream object
 */
export async function createAudioStream(
  url: string,
  onProgress?: (message: string) => void
): Promise<{ stream: Readable }> {
  try {
    const ytDlpPath = getYtDlpPath()

    if (onProgress) {
      onProgress('Starting download...')
    }

    // Use yt-dlp to extract audio stream to stdout
    const process = spawn(ytDlpPath, [
      '--js-runtimes', 'node',
      '--format', 'bestaudio/best',
      '--extract-audio',
      '--audio-format', 'm4a',
      '--audio-quality', '128K',
      '-o', '-', // Output to stdout
      '--no-warnings',
      '-q',
      url,
    ])

    if (!process.stdout) {
      throw new YouTubeDLError('Failed to create audio stream - no stdout')
    }

    if (onProgress) {
      onProgress('Downloading audio...')
    }

    // Handle process errors
    process.on('error', (error: Error) => {
      console.log('yt-dlp process error', error.message)
      process.stdout?.destroy(error)
    })

    return { stream: process.stdout }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.log('Failed to create audio stream', { error: message, url })
    throw new YouTubeDLError(`Failed to create audio stream: ${message}`)
  }
}
