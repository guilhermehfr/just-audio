const required = (key: string): string => {
  const value = process.env[key]
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  return value
}

export const env = {
  server: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
  minio: {
    endpoint: required('MINIO_ENDPOINT'),
    accessKey: required('MINIO_ACCESS_KEY'),
    secretKey: required('MINIO_SECRET_KEY'),
    bucket: required('MINIO_BUCKET'),
    region: process.env.MINIO_REGION ?? 'auto',
  },
  audio: {
    tempDir: required('AUDIO_TEMP_DIR'),
    maxDuration: parseInt(process.env.MAX_DURATION ?? '14400', 10),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? '500', 10),
    ttl: parseInt(process.env.AUDIO_TTL ?? '86400', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
  },
}
