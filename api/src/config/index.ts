import path from 'path'
import os from 'os'

export interface Config {
  nodeEnv: string
  port: number
  logLevel: string
  audioTempDir: string
  audioQuality: number
  maxDuration: number
  maxFileSize: number // in MB
  corsOrigin: string
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  audioTempDir: process.env.AUDIO_TEMP_DIR || path.join(os.tmpdir(), 'just-audio'),
  audioQuality: parseInt(process.env.AUDIO_QUALITY || '0', 10), // 0 = best
  maxDuration: parseInt(process.env.MAX_DURATION || '3600', 10), // 1 hour default
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '500', 10), // 500 MB
  corsOrigin: process.env.CORS_ORIGIN || '*',
}

export default config
