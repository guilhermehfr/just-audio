import fs from 'fs'
import path from 'path'
import { FileRepository } from '../repositories/FileRepository'

/**
 * FileStorageService - Manages file operations and cleanup
 */
export class FileStorageService {
  constructor(private fileRepository: FileRepository) {}

  generateTempPath(extension: string = 'm4a'): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    return path.join('/tmp', `audio-${timestamp}-${random}.${extension}`)
  }

  async saveReference(trackingId: string, filePath: string): Promise<void> {
    await this.fileRepository.save(trackingId, filePath)
  }

  async getFilePath(trackingId: string): Promise<string | null> {
    return this.fileRepository.get(trackingId)
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.log('Failed to delete file', { filePath, error: String(error) })
    }
  }

  async cleanup(trackingId: string): Promise<void> {
    const filePath = await this.fileRepository.get(trackingId)
    if (filePath) {
      await this.deleteFile(filePath)
      await this.fileRepository.delete(trackingId)
    }
  }
}
