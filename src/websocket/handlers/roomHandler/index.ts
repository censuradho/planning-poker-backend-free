import { Server, Socket } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'

import pino from 'lib/pino'

import { roomService } from 'modules/room'
import { CardSelected, CreateRoom, JoinRoomRequest } from './types'

type JoinRoom = Omit<JoinRoomRequest, 'socket_id'>

export function roomHandler (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> ,socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
  async function createRoom (payload: CreateRoom) {
    const { room_name, username } = payload

    const result = await roomService.createRoom({
      room_name,
      username,
      socket_id: socket.id
    })

    const response = {
      ...result,
      participants: []
    }

    socket.join(result.room.id)
    socket.emit('room:join:response', response)
    pino.info(`Client ${result.participant.username} created a room ${result.room.name}`)
  }

  async function joinRoom(payload: JoinRoom) {
    const result = await roomService.joinParticipantToRoom(
      payload.room_id,
      { 
        room_id: payload.room_id,
        username: payload.username,
        socket_id: socket.id
      }
    )

    if (!result) return pino.info('room not found')
    
    const { participants, ...data } = result
    socket.join(result.room.id)
    socket.emit('room:join:response', data)
    io.to(result.room.id).emit('room:join-participant:response', participants)

    pino.info(`Client ${result.participant.username} join to ${result.room.name}`)
  }

  async function cardSelected (payload: CardSelected) {
    const { room_id, user_id, vote } = payload

    const result = await roomService.vote(user_id, room_id, vote)

    const { participants, ...room } = result

    const response = {
      participants,
      room
    }

    io.to(room_id).except(socket.id).emit('room:select-card:response', response)
  }

  function showCards(room_id: string) {
    io.to(room_id).emit('room:show-card:response')
  }

  function restartGame (room_id: string) {
    io.to(room_id).emit('room:restart-game:response')
  }

  socket.on('room:create:request', createRoom)
  socket.on('room:join:request', joinRoom)
  socket.on('room:select-card:request', cardSelected)
  socket.on('room:show-card:request', showCards)
  socket.on('room:restart-game:request', restartGame)
}
