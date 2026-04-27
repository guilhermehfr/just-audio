import { Router, type Router as RouterType } from 'express'

import { AudioController } from '../controllers/audio'
import { AudioExtractionService } from '../services/AudioExtraction'

const router: RouterType = Router()

const audioExtractionService = new AudioExtractionService()
const audioController = new AudioController(audioExtractionService)

router.post('/', (req, res, next) => audioController.postAudio(req, res).catch(next))

router.get('/:trackingId/:file', (req, res, next) =>
  audioController.getAudio(req, res).catch(next)
)

export default router
