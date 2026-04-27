import { S3Client } from '@aws-sdk/client-s3'
import { env } from '../config/env'

export const s3 = new S3Client({
  region: 'auto',
  endpoint: env.minio.endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.minio.accessKey,
    secretAccessKey: env.minio.secretKey,
  },
})