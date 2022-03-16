import http from 'http'
import express from 'express'
import IoServer from 'lib/socke'

const app = express()

const httpServer = http.createServer(app)
export const Io = IoServer(httpServer)

export default httpServer