import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../types/index'

// Map error codes to HTTP status codes
const ERROR_STATUS_MAP: Record<string, number> = {
  // 400 Bad Request
  'MISSING_URL': 400,
  'INVALID_URL': 400,
  'FETCH_FAILED': 400,
  'STREAM_FAILED': 400,
  'MISSING_TRACKING_ID': 400,
  // 404 Not Found
  'NOT_FOUND': 404,
  // 500 Internal Server Error
  'INTERNAL_ERROR': 500,
  'STREAM_ERROR': 500,
  'INTERNAL_SERVER_ERROR': 500,
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /**
   * Get HTTP status code based on error code
   * Defaults to 500 for unknown codes
   */
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
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
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
