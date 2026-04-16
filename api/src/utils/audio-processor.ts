import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export class AudioProcessorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AudioProcessorError'
  }
}

/**
 * Trim audio file between startTime and endTime (in seconds)
 */
export async function trimAudio(
  inputFile: string,
  outputFile: string,
  startTime: number = 0,
  endTime: number | null = null,
  onProgress?: (message: string) => void
): Promise<void> {
  try {
    // Validate input file exists
    if (!fs.existsSync(inputFile)) {
      throw new AudioProcessorError(`Input file not found: ${inputFile}`)
    }

    if (onProgress) onProgress('Trimming audio...')

    // Build ffmpeg command
    let ffmpegCmd = `ffmpeg -i "${inputFile}" -ss ${startTime}`

    if (endTime !== null && endTime > startTime) {
      const duration = endTime - startTime
      ffmpegCmd += ` -t ${duration}`
    }

    ffmpegCmd += ` -acodec aac -ab 192k "${outputFile}" -y` // overwrite output

    await execAsync(ffmpegCmd)

    // Verify output file created
    if (!fs.existsSync(outputFile)) {
      throw new AudioProcessorError('FFmpeg failed to create output file')
    }

    if (onProgress) onProgress('Trim complete')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.log('Failed to trim audio', { error: message, inputFile, outputFile })
    throw new AudioProcessorError(`Failed to trim audio: ${message}`)
  }
}

/**
 * Convert audio format
 */
export async function convertAudio(
  inputFile: string,
  outputFile: string,
  format: string = 'm4a',
  bitrate: string = '192k'
): Promise<void> {
  try {
    if (!fs.existsSync(inputFile)) {
      throw new AudioProcessorError(`Input file not found: ${inputFile}`)
    }

    const ffmpegCmd = `ffmpeg -i "${inputFile}" -codec:a aac -b:a ${bitrate} "${outputFile}" -y`

    await execAsync(ffmpegCmd)

    if (!fs.existsSync(outputFile)) {
      throw new AudioProcessorError('FFmpeg failed to create output file')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.log('Failed to convert audio', { error: message, inputFile, outputFile })
    throw new AudioProcessorError(`Failed to convert audio: ${message}`)
  }
}

/**
 * Get audio file duration in seconds
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new AudioProcessorError(`File not found: ${filePath}`)
    }

    const ffprobeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:nokey=1 "${filePath}"`

    const { stdout } = await execAsync(ffprobeCmd)

    const duration = parseFloat(stdout.trim())

    if (isNaN(duration)) {
      throw new AudioProcessorError('Could not parse audio duration')
    }

    return duration
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.log('Failed to get audio duration', { error: message, filePath })
    throw new AudioProcessorError(`Failed to get audio duration: ${message}`)
  }
}

/**
 * Delete audio file
 */
export async function deleteAudio(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.log('Failed to delete audio file', { filePath, error: String(error) })
  }
}

/**
 * Generate unique temp file path
 */
export function generateTempFilePath(extension: string = 'm4a'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return path.join('/tmp', `audio-${timestamp}-${random}.${extension}`)
}

/**
 * Validate trim parameters
 */
export function validateTrimParams(
  duration: number,
  startTime?: number,
  endTime?: number,
  maxDuration: number = 3600
): { valid: boolean; error?: string } {
  if (duration > maxDuration) {
    return { valid: false, error: `Video duration exceeds maximum allowed (${maxDuration}s)` }
  }

  if (startTime !== undefined) {
    if (startTime < 0) {
      return { valid: false, error: 'startTime cannot be negative' }
    }
    if (startTime > duration) {
      return { valid: false, error: 'startTime cannot exceed video duration' }
    }
  }

  if (endTime !== undefined) {
    if (endTime < 0) {
      return { valid: false, error: 'endTime cannot be negative' }
    }
    if (endTime > duration) {
      return { valid: false, error: 'endTime cannot exceed video duration' }
    }
    if (startTime !== undefined && endTime <= startTime) {
      return { valid: false, error: 'endTime must be greater than startTime' }
    }
  }

  return { valid: true }
}
