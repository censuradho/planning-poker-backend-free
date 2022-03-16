import { Server, Socket } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'

import pino from 'lib/pino'

import { roomService } from 'modules/room'

import { CreateRoom, CreateVote, JoinRoom, LeaveRoom, RoomResponse } from './types'


export function roomHandler (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> ,socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
  async function joinRoom (payload: JoinRoom) {
    try {
      const { room_id, username } = payload

      const result = await roomService.joinToRoom({
        username,
        room_id: room_id,
      })
      
      if (!result?._room || !result?._participant)  return;
  
      const { participants, ...room } = result._room

      socket.join(room?.room)

      socket.emit('room:join', result)
      io.to(room?.room).emit('room:participant-join', participants)
  
      pino.info(`client ${result?._participant.username} rejoined to room ${result._room.room}`)
    } catch (err) {
      pino.error(err)
    }
  }

  async function createRoom (payload: CreateRoom) {
    const { room_name, username } = payload

    const result = await roomService.create({
      room: room_name,
      username
    })

    socket.join(room_name)
    socket.emit('room:join', result)
    
    pino.info(`client ${result?._participant.username} create n' joined to room ${room_name}`)
  }

  function leaveRoom (payload: LeaveRoom) {
    socket.leave(payload.room_name)
    pino.info(`client ${socket.id} leave to room ${payload.room_name}`)
  }

  async function voteRoom (payload: CreateVote) {
    const result = await roomService.vote(payload)

    io.to(result?.room.room).emit('room:participant-join', result.participants)

    pino.info(`user ${payload.user_id} vote`)

  }


  socket.on('room:create', createRoom)
  socket.on('room:destroy', leaveRoom)
  socket.on('room:vote', voteRoom)
  socket.on('room:join', joinRoom)
}
