import { ProgressData } from '../types'
import { ProgressRepository } from '../repositories/ProgressRepository'

/**
 * ProgressService - Manages extraction progress tracking
 */
export class ProgressService {
  constructor(private progressRepository: ProgressRepository) {}

  async initializeTracking(trackingId: string): Promise<void> {
    const initialData: ProgressData = {
      trackingId,
      progress: '0%',
      status: 'pending',
    }
    await this.progressRepository.create(trackingId, initialData)
  }

  async updateProgress(trackingId: string, message: string, status?: string): Promise<void> {
    await this.progressRepository.update(trackingId, {
      progress: message,
      ...(status && { status: status as any }),
    })
  }

  async setStatus(trackingId: string, status: 'pending' | 'downloading' | 'processing' | 'complete' | 'error'): Promise<void> {
    await this.progressRepository.update(trackingId, { status })
  }

  async setError(trackingId: string, error: string): Promise<void> {
    await this.progressRepository.update(trackingId, {
      status: 'error',
      error,
    })
  }

  async getProgress(trackingId: string): Promise<ProgressData | null> {
    return this.progressRepository.get(trackingId)
  }

  async complete(trackingId: string): Promise<void> {
    await this.progressRepository.update(trackingId, {
      status: 'complete',
      progress: '100%',
    })
  }

  async cleanup(trackingId: string): Promise<void> {
    await this.progressRepository.delete(trackingId)
  }
}
