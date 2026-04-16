import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../types/index'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
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
    return res.status(err.statusCode).json(response)
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
