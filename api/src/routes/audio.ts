import { Router, type Router as RouterType } from 'express'

import { AudioController } from '../controllers/audio'
import { AudioExtractionService } from '../services/AudioExtractionService'

const router: RouterType = Router()

const audioExtractionService = new AudioExtractionService()
const audioController = new AudioController(audioExtractionService)

router.post('/info', (req, res, next) => audioController.getAudioInfo(req, res).catch(next))

router.post('/extract', (req, res, next) => audioController.extractAudio(req, res).catch(next))

router.get('/stream/:trackingId', (req, res, next) =>
  audioController.streamAudio(req, res).catch(next)
)

export default router