/**
 * FileRepository - Abstract file storage metadata
 * Can be swapped with database or cloud storage
 */
export class FileRepository {
  private fileStore: Record<string, string> = {}

  async save(trackingId: string, filePath: string): Promise<void> {
    this.fileStore[trackingId] = filePath
  }

  async get(trackingId: string): Promise<string | null> {
    return this.fileStore[trackingId] || null
  }

  async delete(trackingId: string): Promise<void> {
    delete this.fileStore[trackingId]
  }

  async exists(trackingId: string): Promise<boolean> {
    return trackingId in this.fileStore
  }
}
