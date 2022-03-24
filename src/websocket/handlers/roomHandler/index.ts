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

    const { participant, room } = result
    socket.join(result.room.id)

    socket.emit('room:room', room)
    socket.emit('room:participant', participant)

    pino.info(`Client ${result.participant.username} created a room ${result.room.name}`)
  }

  async function joinRoom(payload: JoinRoom) {
    pino.info('aaaaaaaaaa')
    const result = await roomService.joinParticipantToRoom(
      payload.room_id,
      { 
        room_id: payload.room_id,
        username: payload.username,
        socket_id: socket.id
      }
    )

    if (!result) return pino.info('room not found')
    
    const { participants, room, participant } = result
    socket.join(result.room.id)

    io.to(room.id).emit('room:room', room)
    io.to(room.id).emit('room:participant', participant)
    io.to(room.id).emit('room:participants', participants)

    pino.info(`Client ${result.participant.username} join to ${result.room.name}`)
  }

  async function cardSelected (payload: CardSelected) {
    const { room_id, user_id, vote } = payload

    const result = await roomService.vote(user_id, room_id, vote)

    const { participants, ...room } = result

    io.to(room_id).emit('room:participants', participants)
    io.to(room_id).emit('room:room', room)
  }

  function showCards(room_id: string) {
    io.to(room_id).emit('room:show-card')
  }

  async function restartGame (room_id: string) {
   await roomService.restartGame(room_id)
    io.to(room_id).emit('room:restart-game')
  }

  async function disconnect () {
    pino.info(`Client ${socket.id} disconnect`)
  }

  socket.on('room:create', createRoom)
  socket.on('room:join', joinRoom)
  socket.on('room:select-card', cardSelected)
  socket.on('room:show-card', showCards)
  socket.on('room:restart-game', restartGame)
  socket.on('disconnect', disconnect)
}

