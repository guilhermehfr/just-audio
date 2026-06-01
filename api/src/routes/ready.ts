import { Router, type Router as RouterType } from 'express'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { HeadBucketCommand } from '@aws-sdk/client-s3'

import { s3 } from '../lib/s3'
import { env } from '@/config/env'

const execFileAsync = promisify(execFile)

const router: RouterType = Router()

const withTimeout = <T>(promise: Promise<T>, ms: number) =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])

router.get('/', async (_, res) => {
  const checks = {
    minio: false,
    ffmpeg: false,
    tempDisk: false,
  }

  try {
    await withTimeout(s3.send(new HeadBucketCommand({ Bucket: env.minio.bucket })), 1000)
    checks.minio = true
  } catch (err) {
    console.error('MinIO readiness failed:', err)
    checks.minio = false
  }

  try {
    await execFileAsync('ffmpeg', ['-hide_banner', '-version'])
    checks.ffmpeg = true
  } catch (err) {
    console.error('FFmpeg readiness failed:', err)
    checks.ffmpeg = false
  }

  try {
    const file = path.join(os.tmpdir(), `ready-${Date.now()}.tmp`)
    await fs.writeFile(file, 'ok')
    await fs.unlink(file)
    checks.tempDisk = true
  } catch (err) {
    console.error('Temp disk readiness failed:', err)
    checks.tempDisk = false
  }

  const ready = checks.minio && checks.ffmpeg && checks.tempDisk

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not-ready',
    checks,
  })
})

export default router
