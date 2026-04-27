import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'child_process'
import { Readable } from 'stream'
import { uploadFile } from '../services/AudioStorage'

export async function segmentAudioToHLS(
  audioStream: Readable,
  trackingId: string,
  outputDir: string,
  durationSeconds: number
): Promise<void> {
  return segmentAudioToHLSInternal(audioStream, trackingId, outputDir, durationSeconds)
}

export async function segmentAudioToHLSInternal(
  audioStream: Readable,
  trackingId: string,
  outputDir: string,
  durationSeconds: number
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true })

  return new Promise((resolve, reject) => {
    const segmentsDuration = getSegmentsDuration(durationSeconds).toString()

    const ffmpeg = spawn('ffmpeg', [
      '-i',
      'pipe:0',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-hls_time',
      segmentsDuration,
      '-hls_list_size',
      '0',
      '-hls_segment_filename',
      `${outputDir}/segment_%03d.ts`,
      `${outputDir}/playlist.m3u8`,
    ])

    audioStream.pipe(ffmpeg.stdin)

    ffmpeg.stdin.on('error', reject)

    ffmpeg.on('close', async (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg exited with code ${code}`))

      try {
        const files = await fs.readdir(outputDir)

        await Promise.all(
          files.map(async (filename) => {
            console.log(`Uploading ${filename} to S3...`)
            const data = await fs.readFile(path.join(outputDir, filename))
            const contentType = filename.endsWith('.m3u8')
              ? 'application/vnd.apple.mpegurl'
              : 'video/mp2t'
            await uploadFile(`${trackingId}/${filename}`, data, contentType)
          })
        )

        await fs.rm(outputDir, { recursive: true, force: true })
        resolve()
      } catch (error) {
        reject(error)
      }
    })

    ffmpeg.on('error', reject)
  })
}

export function getSegmentsDuration(durationSeconds: number): number {
  if (durationSeconds <= 600) return 10 // até 10min → ~60 segmentos
  if (durationSeconds <= 3600) return 30 // até 1h    → ~120 segmentos
  if (durationSeconds <= 7200) return 60 // até 2h    → ~120 segmentos
  return 120 // até 4h    → ~120 segmentos
}
