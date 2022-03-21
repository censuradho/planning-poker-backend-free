import { randomUUID as uuid } from 'crypto'

import { prisma } from 'lib/prisma';

import pino from 'lib/pino';

import { CreateRoom, JoinRoomRequest  } from 'websocket/handlers/roomHandler/types';

import { Participant, Room } from '@prisma/client';
import { ERROR_CONSTANTS } from 'constants/errors';
import { ErrorHandler } from 'utils/errorHandler';

type FindParticipantBy = Partial<Pick<Participant, 'id' | 'socket_id' | 'username' | 'room_id'>>

type UpdateParticipant = Partial<Pick<Participant, 'socket_id' | 'username' | 'vote'>>
type FindRoomBy = Partial<Pick<Room, 'id' | 'name'>>

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
        })
        Object.assign(room, newRoom)
      }

      const existParticipant = await _prisma.participant.findFirst({
        where: {
          username
        }
      })

      if (existParticipant) {
        Object.assign(participant, existParticipant)
      } else {
        const newParticipant = await _prisma.participant.create({
          data: {
            id: uuid(),
            socket_id,
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

  async findParticipantBy (data: FindParticipantBy) {
    return await prisma.participant.findFirst({
      where: data
    })
  }

  async findRoomBy (query: FindRoomBy) {
    return await prisma.room.findFirst({
      where: query
    })
  }

  async joinParticipantToRoom (room_id: string, data: JoinRoomRequest) {
    const participant = {} as Participant

    const existRoom = await this.findRoomBy({
      id: room_id
    })

    if (!existRoom) throw new ErrorHandler({
      error: 'room_already_exist',
      statusCode: 404
    })
    const existParticipant = await this.findParticipantBy(
      { username: data.username },
    )

    if (existParticipant) {
      Object.assign(participant, existParticipant)
    } else {
      const newParticipant = await prisma.participant.create({
        data: {
          id: uuid(),
          socket_id: data.socket_id,
          username: data.username,
          vote: '',
          isAdmin: false,
          room: {
            connect: {
              id: room_id
            }
          }
        }
      })

      Object.assign(participant, newParticipant)
    }

    const roomUpdated = await prisma.room.update({
      where: {
        id: room_id
      },
      data: {
        participants: {
          connect: {
            id: participant.id
          }
        }
      },
      include: {
        participants: true
      }
    })

    const {  participants, ...room } = roomUpdated

    return {
      room,
      participant,
      participants
    }
  }

  async vote (user_id: string, room_id: string, vote: string) {
    return await prisma.room.update({
      where: {
        id: room_id,
      },
      data: {
        participants: {
          update: {
            where: {
              id: user_id
            },
            data: {
              vote
            }
          }
        }
      },
      include: {
        participants: true
      }
    })
  }

}