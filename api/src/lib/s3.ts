import { S3Client } from '@aws-sdk/client-s3'

const vars = {
  MINIO_REGION: process.env.MINIO_REGION || '',
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || '',
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || '',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || '',
}

export const s3 = new S3Client({
  region: vars.MINIO_REGION,
  endpoint: vars.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: vars.MINIO_ACCESS_KEY,
    secretAccessKey: vars.MINIO_SECRET_KEY,
  },
})
