import cors from 'cors'
import { Request, Response, NextFunction } from 'express'

const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

export const corsMiddleware = cors(corsOptions)
