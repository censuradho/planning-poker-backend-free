import { Server, Socket } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'

import pino from 'lib/pino'

import { roomService } from 'modules/room'
import { CreateRoom } from './types'


export function roomHandler (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> ,socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
  async function createRoom (payload: CreateRoom) {
    const { room_name, username } = payload

    const result = await roomService.createRoom({
      room_name,
      username,
      socket_id: socket.id
    })

    socket.join(result.room.id)
    socket.emit('room:create:response')
    pino.info(`Client ${result.participant.username} created a room ${result.room.name}`)
  }

  async function desconnectParticipant () {


    await roomService.desconectParticipant(socket.id)

    pino.info(`client ${socket.id} was disconnected`)
  }

  socket.on('room:create:request', createRoom)
  socket.on('disconnect', desconnectParticipant)
}
