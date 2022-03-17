import { randomUUID as uuid } from 'crypto'

import { prisma } from 'lib/prisma';

import pino from 'lib/pino';

import { CreateRoom } from 'websocket/handlers/roomHandler/types';
import { Participant, Room } from '@prisma/client';

export class RoomService {
  async createRoom ({ room_name, username, socket_id }: CreateRoom) {
    const result = await prisma.$transaction(async _prisma => {
      const room = {} as Room
      const participant = {} as Participant

      const existRoom = await _prisma.room.findFirst({
        where: {
          name: room_name
        }
      })

      if (existRoom) {
        Object.assign(room, existRoom)
      } else {
        const newRoom = await _prisma.room.create({ 
          data: {
            id: uuid(),
            name: room_name
          },
          include: {
            participants: true
          }
        })
        Object.assign(room, newRoom)
      }

      const existParticipant = await _prisma.participant.findFirst({
        where: {
          id: socket_id
        }
      })

      if (existParticipant) {
        Object.assign(participant, existParticipant)
      } else {
        const newParticipant = await _prisma.participant.create({
          data: {
            id: socket_id,
            username,
            isAdmin: true,
            vote: '',
            room: {
              connect: {
                id: room.id
              }
            }
          }
        })

        Object.assign(participant, newParticipant)
      }



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