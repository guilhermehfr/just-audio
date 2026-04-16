import { Router } from 'express'

import audioRoutes from './audio'

const router: Router = Router()

router.use('/audio', audioRoutes)

export default router
