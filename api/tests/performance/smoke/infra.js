import http from 'k6/http'
import { check } from 'k6'

const BASE = 'http://api:3000'

export const options = {
  vus: 1,
  iterations: 1,
}

export default function () {
  const res = http.get(`${BASE}/api/ready`)

  check(res, {
    'status 200': (r) => r.status === 200,
    'minio ok': (r) => r.json('checks.minio') === true,
    'ffmpeg ok': (r) => r.json('checks.ffmpeg') === true,
    'tempDisk ok': (r) => r.json('checks.tempDisk') === true,
    'status is ready': (r) => r.json('status') === 'ready',
  })
}
