import http from 'http'
import express from 'express'

import IoServer from 'lib/socke'

import { errorHandler } from 'middlewares'

const app = express()

const httpServer = http.createServer(app)
export const Io = IoServer(httpServer)

app.use(errorHandler)

export default httpServer