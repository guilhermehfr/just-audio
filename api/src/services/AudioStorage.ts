import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { s3 } from '../lib/s3'

export async function downloadFile(key: string): Promise<Buffer> {
  if (!process.env.MINIO_BUCKET) {
    throw new Error('Missing MINIO_BUCKET environment variable')
  }

  const command = new GetObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
  })

  const response = await s3.send(command)

  if (!response.Body) {
    throw new Error(`File not found: ${key}`)
  }

  return Buffer.from(await response.Body.transformToByteArray())
}

export async function uploadFile(key: string, body: Buffer | Uint8Array, contentType: string) {
  if (!process.env.MINIO_BUCKET) {
    throw new Error('Missing MINIO_BUCKET environment variable')
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}
