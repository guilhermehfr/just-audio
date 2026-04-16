import { Router, type Router as RouterType } from 'express'
import { AudioController } from '../controllers/audio'
import { AudioExtractionService } from '../services/AudioExtractionService'
import { ProgressService } from '../services/ProgressService'
import { ProgressRepository } from '../repositories/ProgressRepository'

const router: RouterType = Router()

// Initialize repositories and services
const progressRepository = new ProgressRepository()
const progressService = new ProgressService(progressRepository)
const audioExtractionService = new AudioExtractionService(progressService)

// Initialize controller with dependency injection
const audioController = new AudioController(
  audioExtractionService,
  progressService
)

/**
 * @route POST /api/audio/info
 * @description Fetch video metadata (title, duration, thumbnail)
 * @body { url: string }
 * @returns { title, duration, thumbnail }
 */
router.post('/info', (req, res, next) =>
  audioController.getAudioInfo(req, res).catch(next)
)

/**
 * @route POST /api/audio/extract
 * @description Extract audio from video - returns metadata and streaming URL immediately
 * @body { url: string, trackingId?: string }
 * @returns { title, duration, thumbnail, audioUrl, progress }
 */
router.post('/extract', (req, res, next) =>
  audioController.extractAudio(req, res).catch(next)
)

/**
 * @route GET /api/audio/stream/:trackingId
 * @description Stream extracted audio - yt-dlp → FFmpeg → M4A audio
 * @query { url: string } - The video URL to stream from
 * @returns binary audio file (m4a)
 */
router.get('/stream/:trackingId', (req, res, next) =>
  audioController.streamAudio(req, res).catch(next)
)

/**
 * @route GET /api/audio/progress/:trackingId
 * @description Poll extraction/streaming progress
 * @params { trackingId: string }
 * @returns { trackingId, progress, status, error? }
 */
router.get('/progress/:trackingId', (req, res, next) =>
  audioController.getProgress(req, res).catch(next)
)

export default router
