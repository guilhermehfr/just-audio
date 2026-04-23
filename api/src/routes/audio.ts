import { Router, type Router as RouterType } from 'express'

import { AudioController } from '../controllers/audio'
import { AudioExtractionService } from '../services/AudioExtractionService'
import { ProgressService } from '../services/ProgressService'
import { ProgressRepository } from '../repositories/ProgressRepository'

const router: RouterType = Router()

const progressRepository = new ProgressRepository()
const progressService = new ProgressService(progressRepository)
const audioExtractionService = new AudioExtractionService(progressService)

const audioController = new AudioController(audioExtractionService, progressService)

/**
 * @route POST /api/audio/info
 * @description Fetch video metadata without extraction
 * @body { url: string } - Video URL (required)
 * @returns { title: string, duration: number, thumbnail: string }
 * @note Does not start audio extraction or tracking
 */
router.post('/info', (req, res, next) => audioController.getAudioInfo(req, res).catch(next))

/**
 * @route POST /api/audio/extract
 * @description Initiate audio extraction - generates trackingId for progress tracking and streaming
 * @body { url: string (required), trackingId?: string (optional - auto-generated if not provided) }
 * @returns { title: string, duration: number, thumbnail: string, audioUrl: string, progress: string }
 * @note This is the FIRST step. Returns audioUrl and trackingId to use in subsequent calls to /stream and /progress
 */
router.post('/extract', (req, res, next) => audioController.extractAudio(req, res).catch(next))

/**
 * @route GET /api/audio/stream/:trackingId
 * @description Download/stream audio file using trackingId and video URL
 * @params { trackingId: string (required) } - Tracking ID from POST /extract response
 * @query { url: string (required) } - The video URL to extract audio from
 * @returns binary audio file (m4a) with Content-Disposition header
 * @note Call this after POST /extract. Monitor progress via GET /progress/:trackingId
 */
router.get('/stream/:trackingId', (req, res, next) =>
  audioController.streamAudio(req, res).catch(next)
)

/**
 * @route GET /api/audio/progress/:trackingId
 * @description Poll progress of audio extraction/streaming
 * @params { trackingId: string (required) } - Tracking ID from POST /extract response
 * @returns { trackingId: string, progress: string, status: 'pending'|'downloading'|'processing'|'complete'|'error', error?: string }
 * @note Poll periodically (e.g., every 500ms) to monitor extraction progress
 */
router.get('/progress/:trackingId', (req, res, next) =>
  audioController.getProgress(req, res).catch(next)
)

export default router
