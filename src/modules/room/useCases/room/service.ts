import { randomUUID as uuid } from 'crypto'

import { prisma } from 'lib/prisma';

import pino from 'lib/pino';

import { CreateRoom } from 'websocket/handlers/roomHandler/types';

export class RoomService {
  async createRoom ({ room_name, username, socket_id }: CreateRoom) {
    const result = await prisma.$transaction(async _prisma => {
      const room = await _prisma.room.create({ 
        data: {
          id: uuid(),
          name: room_name
        },
        include: {
          participants: true
        }
      })

       const participant = await _prisma.participant.create({
         data: {
           id: socket_id,
           username,
           vote: '',
           room: {
             connect: {
               id: room.id
             }
           }
         }
       })

       return {
         room,
         participant
       }
    })

    return result
  }

  async desconectParticipant (socket_id: string) {
   await prisma.participant.delete({
     where: {
      id: socket_id
     }
   })
  }

  async findParticipant (id: string) {
    return await prisma.participant.findFirst({
      where: {
        id
      }
    })
  }
}