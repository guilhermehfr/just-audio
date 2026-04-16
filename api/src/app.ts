import express, { Express } from 'express'

import { corsMiddleware } from './middleware/cors'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import apiRoutes from './routes'

class App {
  private app: Express

  constructor() {
    this.app = express()
    this.initializeMiddleware()
    this.initializeRoutes()
    this.initializeErrorHandling()
  }

  private initializeMiddleware(): void {
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))

    this.app.use(corsMiddleware)
  }

  private initializeRoutes(): void {
    this.app.use('/api', apiRoutes)
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler)
    this.app.use(errorHandler)
  }

  public getApp(): Express {
    return this.app
  }
}

const appInstance = new App()
export default appInstance.getApp()
