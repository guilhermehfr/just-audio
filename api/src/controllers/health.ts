import { Request, Response } from 'express'
import { ApiResponse } from '../types/index'

export const getHealth = (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; uptime: number }> = {
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
    },
    timestamp: new Date().toISOString(),
  }
  res.status(200).json(response)
}

export const getInfo = (req: Request, res: Response) => {
  const response: ApiResponse<{ version: string; environment: string }> = {
    success: true,
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    timestamp: new Date().toISOString(),
  }
  res.status(200).json(response)
}
