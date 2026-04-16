import { ProgressData } from '../types'

/**
 * ProgressRepository - Abstract progress data storage
 * Can be swapped with Redis/Database implementation
 */
export class ProgressRepository {
  private progressStore: Record<string, ProgressData> = {}

  async create(trackingId: string, initialData: ProgressData): Promise<void> {
    this.progressStore[trackingId] = initialData
  }

  async get(trackingId: string): Promise<ProgressData | null> {
    return this.progressStore[trackingId] || null
  }

  async update(trackingId: string, data: Partial<ProgressData>): Promise<void> {
    if (this.progressStore[trackingId]) {
      this.progressStore[trackingId] = {
        ...this.progressStore[trackingId],
        ...data,
      }
    }
  }

  async delete(trackingId: string): Promise<void> {
    delete this.progressStore[trackingId]
  }

  async clear(): Promise<void> {
    this.progressStore = {}
  }
}
