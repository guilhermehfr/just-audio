export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  timestamp: string
}

export interface AudioMetadata {
  title: string
  duration: number
  thumbnail: string
  width?: number
  height?: number
  format?: string
}

export interface DownloadRequest {
  url: string
  format?: string
}

export interface AudioExtractionRequest {
  url: string
  startTime?: number // in seconds
  endTime?: number // in seconds
  trackingId?: string
}

export interface AudioExtractionResponse {
  title: string
  duration: number
  thumbnail: string
  trackingId?: string
  audioUrl?: string
  trimmed?: boolean
  trimmedDuration?: number
}


