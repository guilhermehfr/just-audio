import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'child_process'
import { Readable } from 'stream'
import { uploadFile } from '../services/AudioStorage'

const SEGMENT_RE = /^segment_\d{3}\.ts$/

export async function segmentAudioToHLS(
  audioStream: Readable,
  trackingId: string,
  outputDir: string,
  durationSeconds: number
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true })

  const segmentsDuration = getSegmentsDuration(durationSeconds).toString()

  const ffmpeg = spawn('ffmpeg', [
    '-i', 'pipe:0',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-hls_time', segmentsDuration,
    '-hls_list_size', '0',
    '-hls_playlist_type', 'event',
    '-hls_segment_filename', `${outputDir}/segment_%03d.ts`,
    `${outputDir}/playlist.m3u8`,
  ])

  audioStream.pipe(ffmpeg.stdin)

  // Ignore stdin EPIPE — happens naturally on ffmpeg close
  ffmpeg.stdin.on('error', () => {})

  return new Promise<void>((resolve, reject) => {
    let resolved = false
    const uploaded = new Set<string>()
    let playlistMtime = 0
    let interval: ReturnType<typeof setInterval>

    const uploadNewFiles = async () => {
      let files: string[]
      try {
        files = await fs.readdir(outputDir)
      } catch {
        return
      }

      for (const filename of files) {
        if (filename !== 'playlist.m3u8' && !SEGMENT_RE.test(filename)) continue

        const filepath = path.join(outputDir, filename)

        let stat: Awaited<ReturnType<typeof fs.stat>>
        try {
          stat = await fs.stat(filepath)
        } catch {
          continue
        }

        if (stat.size === 0) continue

        if (filename === 'playlist.m3u8') {
          if (stat.mtimeMs <= playlistMtime) continue
          playlistMtime = stat.mtimeMs
        } else if (uploaded.has(filename)) {
          continue
        }

        try {
          const data = await fs.readFile(filepath)
          const contentType = filename.endsWith('.m3u8')
            ? 'application/vnd.apple.mpegurl'
            : 'video/mp2t'
          await uploadFile(`${trackingId}/${filename}`, data, contentType)
          uploaded.add(filename)

          if (!resolved && uploaded.has('playlist.m3u8')) {
            const hasSegment = [...uploaded].some((f) => SEGMENT_RE.test(f))
            if (hasSegment) {
              resolved = true
              resolve()
            }
          }
        } catch (err) {
          console.error(`Upload failed for ${filename}:`, err)
        }
      }
    }

    interval = setInterval(uploadNewFiles, 500)

    ffmpeg.on('close', async (code) => {
      clearInterval(interval)
      await uploadNewFiles()

      if (code !== 0 && !resolved) {
        await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {})
        reject(new Error(`ffmpeg exited with code ${code}`))
        return
      }

      if (!resolved) {
        await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {})
        reject(new Error('ffmpeg finished but no HLS output found'))
        return
      }

      await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {})
    })

    ffmpeg.on('error', (err) => {
      if (!resolved) {
        clearInterval(interval)
        reject(err)
      }
    })
  })
}

export function getSegmentsDuration(durationSeconds: number): number {
  if (durationSeconds <= 600) return 10
  if (durationSeconds <= 3600) return 30
  if (durationSeconds <= 7200) return 60
  return 120
}
