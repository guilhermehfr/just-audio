import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE = 'http://api:3000'

export const options = {
  vus: 10,
  duration: '3m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<8000'],
  },
}

export default function () {
  const payload = {
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  }

  const start = http.post(
    `${BASE}/api/audio`,
    JSON.stringify(payload),
    { headers: { 'Content-Type': 'application/json' } }
  )

  check(start, { 'job created': (r) => r.status === 200 })

  if (start.status !== 200) {
    sleep(2)
    return
  }

  const trackingId = start.json('data.trackingId')
  if (!trackingId) {
    sleep(2)
    return
  }

  let res
  let attempts = 0

  while (attempts < 15) {
    res = http.get(`${BASE}/api/audio/${trackingId}/playlist.m3u8`)
    if (res.status === 200) break
    if (res.status === 404) break
    sleep(1.5)
    attempts++
  }

  check(res, {
    'HLS ready or failed fast': (r) => r.status === 200 || r.status === 404,
  })
}
