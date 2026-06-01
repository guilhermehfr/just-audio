import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
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

export async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.minio.bucket }))
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: env.minio.bucket }))
  }
}
