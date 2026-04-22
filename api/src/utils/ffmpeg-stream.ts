import { spawn } from 'child_process'
import { Readable, PassThrough } from 'stream'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

interface AudioStreamOptions {
  bitrate?: string
  format?: string
  sampleRate?: number
}

/**
 * Create audio stream by piping input through FFmpeg using spawn
 * More reliable than fluent-ffmpeg for piping scenarios
 * @param inputStream - Readable stream (from yt-dlp or other source)
 * @param options - FFmpeg encoding options
 * @returns Readable stream of processed audio
 */
export function createAudioStream(
  inputStream: Readable,
  options: AudioStreamOptions = {}
): { stream: Readable } {
  const { bitrate = '128k', format = 'aac', sampleRate = 44100 } = options

  // FFmpeg command args for M4A audio conversion
  // Use movflags to support non-seekable outputs (streaming to stdout)
  const ffmpegArgs = [
    '-i',
    'pipe:0', // Read from stdin
    '-c:a',
    format, // Audio codec (aac)
    '-b:a',
    bitrate, // Bitrate (128k)
    '-ar',
    String(sampleRate), // Sample rate (44100)
    '-movflags',
    'frag_keyframe+empty_moov', // Allow streaming to non-seekable output
    '-f',
    'ipod', // Output format (M4A)
    'pipe:1', // Write to stdout
  ]

  const ffmpeg = spawn(ffmpegInstaller.path, ffmpegArgs, {
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  // Create output stream - PassThrough allows us to forward data
  const outputStream = new PassThrough()

  // Pipe FFmpeg stdout to output stream
  ffmpeg.stdout.pipe(outputStream)

  // Handle errors
  inputStream.on('error', (error: Error) => {
    console.log('Input stream error', error.message)
    ffmpeg.stdin.destroy(error)
  })

  ffmpeg.on('error', (error: Error) => {
    console.log('FFmpeg process error', error.message)
    outputStream.destroy(error)
  })

  ffmpeg.stdout.on('error', (error: Error) => {
    console.log('FFmpeg stdout error', error.message)
    outputStream.destroy(error)
  })

  ffmpeg.stdin.on('error', (error: Error) => {
    console.log('FFmpeg stdin error', error.message)
  })

  // Log FFmpeg errors/warnings
  ffmpeg.stderr.on('data', (data: Buffer) => {
    const msg = data.toString()
    if (msg.includes('error') || msg.includes('Error')) {
      console.log('FFmpeg warning/error:', msg.trim())
    }
  })

  // Pipe input to FFmpeg stdin
  inputStream.pipe(ffmpeg.stdin)

  return { stream: outputStream }
}
