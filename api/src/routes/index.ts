import { Router } from 'express'

import audioRoutes from './audio'
import readyRoutes from './ready'

const router: Router = Router()

router.use('/audio', audioRoutes)
router.get('/health', (_, res) => res.status(200).json({ status: 'ok' }))
router.use('/ready', readyRoutes)

export default router
