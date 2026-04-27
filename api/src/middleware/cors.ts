import cors from 'cors'
import { env } from '../config/env'

const corsOptions = {
  origin: env.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

export const corsMiddleware = cors(corsOptions)