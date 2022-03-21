
import { Socket } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'

import { roomHandler } from './handlers'

import { Io } from 'app'

import pino from 'lib/pino'


const onConnection = (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
  pino.info(`new connection ${socket.id}`)
  roomHandler(Io, socket)
}

Io.on('connection', socket => {
  onConnection(socket)
  pino.info(`new connection ${socket.id}`)
})