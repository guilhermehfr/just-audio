import 'dotenv/config'

import app from './app'
import { env } from './config/env'
import { ensureBucket } from './lib/s3'

const port = env.server.port

await ensureBucket()

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  server.close(() => {
    process.exit(0)
  })
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', reason, { promise })
})

export default server
