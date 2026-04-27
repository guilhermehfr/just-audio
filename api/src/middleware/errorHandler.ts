import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../types/index'
import { env } from '../config/env'

const ERROR_STATUS_MAP: Record<string, number> = {
  MISSING_URL: 400,
  INVALID_URL: 400,
  MISSING_TRACKING_ID: 400,
  MISSING_PARAMETERS: 400,
  UNSUPPORTED_PROVIDER: 422,
  FETCH_FAILED: 502,
  STREAM_FAILED: 502,
  EXTERNAL_SERVICE_ERROR: 502,
  NOT_FOUND: 404,
  PROCESSING_FAILED: 500,
  INTERNAL_ERROR: 500,
  STREAM_ERROR: 500,
  INTERNAL_SERVER_ERROR: 500,
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  getStatusCode(): number {
    return ERROR_STATUS_MAP[this.code] ?? 500
  }
}

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  console.log('Request error', err.message || err, {
    method: req.method,
    path: req.path,
  })

  if (err instanceof ApiError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
      timestamp: new Date().toISOString(),
    }
    return res.status(err.getStatusCode()).json(response)
  }

  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.server.nodeEnv === 'production' ? 'Internal Server Error' : err.message,
    },
    timestamp: new Date().toISOString(),
  }
  return res.status(500).json(response)
}

export const notFoundHandler = (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
  }
  res.status(404).json(response)
}