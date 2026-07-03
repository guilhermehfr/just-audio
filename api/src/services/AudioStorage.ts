import { GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { s3 } from '../lib/s3'
import { env } from '../config/env'

export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: env.minio.bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

export async function downloadFile(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: env.minio.bucket,
    Key: key,
  })

  const response = await s3.send(command)

  if (!response.Body) {
    throw new Error(`File not found: ${key}`)
  }

  return Buffer.from(await response.Body.transformToByteArray())
}

export async function uploadFile(key: string, body: Buffer | Uint8Array, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.minio.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}
