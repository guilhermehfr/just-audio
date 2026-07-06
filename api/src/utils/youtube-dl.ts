import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { Readable } from 'stream'

const require = createRequire(import.meta.url)

import { spawn } from 'child_process'
import { env } from '@/config/env'

export interface VideoInfo {
  title: string
  duration: number
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
export async function getVideoMetadata(url: string): Promise<VideoInfo> {
  const ytDlpPath = getYtDlpPath()

  return new Promise((resolve, reject) => {
    let output = ''
    let errorOutput = ''

    const args: string[] = []
    if (fs.existsSync('/app/cookies.txt')) {
      args.push('--cookies', '/app/cookies.txt')
    }
    args.push(
      '--print', 'title',
      '--print', 'duration',
      '--no-playlist',
      '--no-warnings',
      '-q',
      url,
    )

    const child = spawn(ytDlpPath, args)

    const timeout = setTimeout(() => {
      child.kill()
      reject(new YouTubeDLError('yt-dlp timed out after 30s'))
    }, 120_000)

    const maxBytes = env.audio.maxFileSize * 1024 * 1024
    let totalBytes = 0

    child.stdout.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length
      if (totalBytes > maxBytes) {
        child.kill()
        child.stdout?.destroy(
          new YouTubeDLError(`File too large: exceeded ${env.audio.maxFileSize}MB`)
        )
      }
    })

    child.stdout.on('data', (data: Buffer) => {
      output += data.toString()
    })

    child.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString()
    })

    child.on('close', (code: number) => {
      clearTimeout(timeout)

      if (code !== 0) {
        return reject(
          new YouTubeDLError(`yt-dlp failed with code ${code}: ${errorOutput || 'Unknown error'}`)
        )
      }

      const [title, duration] = output.trim().split('\n')

      resolve({
        title: title || 'Unknown Title',
        duration: parseFloat(duration) || 0,
      })
    })

    child.on('error', (error: Error) => {
      clearTimeout(timeout)
      reject(error)
    })
  })
}
export async function createAudioStream(url: string): Promise<{ stream: Readable }> {
  const ytDlpPath = getYtDlpPath()

  const child = spawn(ytDlpPath, [
    ...(fs.existsSync('/app/cookies.txt') ? ['--cookies', '/app/cookies.txt'] : []),
    '--format',
    'bestaudio/best',
    '--no-playlist',
    '--no-warnings',
    '-q',
    '-o',
    '-',
    url,
  ])

  if (!child.stdout) {
    throw new YouTubeDLError('Failed to create audio stream - no stdout')
  }

  child.on('error', (error: Error) => {
    child.stdout?.destroy(error)
  })

  return { stream: child.stdout }
}
