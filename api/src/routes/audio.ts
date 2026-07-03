import { Router, type Router as RouterType } from 'express'
import rateLimit from 'express-rate-limit'

import { AudioController } from '../controllers/audio'
import { AudioExtractionService } from '../services/AudioExtraction'
import { ApiError } from '../middleware/errorHandler'
import { env } from '@/config/env'

const router: RouterType = Router()

const audioExtractionService = new AudioExtractionService()
const audioController = new AudioController(audioExtractionService)

const audioRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  max: env.server.rateLimitMax,
  skip: () => env.server.rateLimitMax === 0,
  standardHeaders: true,
  handler: (req, res, next) => {
    const error = new ApiError('TOO_MANY_REQUESTS', 'Too many requests, please try again later')
    next(error)
  },
})

router.post('/', audioRateLimiter, (req, res, next) =>
  audioController.postAudio(req, res).catch(next)
)

router.get('/:trackingId/status', (req, res, next) => audioController.getStatus(req, res).catch(next))
router.get('/:trackingId/:file', (req, res, next) => audioController.getAudio(req, res).catch(next))

export default router
