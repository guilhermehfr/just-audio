import http from 'k6/http'
import { check } from 'k6'

const BASE = 'http://api:3000'

export const options = {
  vus: 1,
  iterations: 3,
}

export default function () {
  const health = http.get(`${BASE}/api/health`)

  check(health, {
    'health ok': (r) => r.status === 200,
  })

  const start = http.post(
    `${BASE}/api/audio`,
    JSON.stringify({
      url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  check(start, {
    'accepted request': (r) => r.status === 200,
    'has trackingId': (r) => !!r.json('data.trackingId'),
  })
  console.log('audio response:', start.status, start.body)

  const trackingId = start.json('data.trackingId')

  const poll = http.get(`${BASE}/api/audio/${trackingId}/playlist.m3u8`)

  check(poll, {
    'poll reachable': (r) => r.status === 200 || r.status === 404,
    'no server error': (r) => r.status < 500,
  })
}
