import { randomUUID as uuid } from 'crypto'
import { Room, Participant } from '@prisma/client';

import { prisma } from 'lib/prisma';
import pino from 'lib/pino';

import { CreateVote, CreteGame, JoinRoom, LeaveRoom } from 'websocket/handlers/roomHandler/types';

type CreateRoom = Pick<Room, 'room'> & Pick<Participant, 'username'>

type FindRoom = Pick<Room, 'id'> & Pick<Participant, 'username'>

export class RoomService {
  async create ({ room, username}: CreateRoom) {
    const data = await prisma.$transaction(async _prisma => {
      try {
        const _room = {} as Room
        const _participant = {} as Participant

        const existRoom = await _prisma.room.findFirst({
          where: {
            room
          }
        })

        if (existRoom) {
          Object.assign(_room, existRoom)
        } else {
          const newRoom = await _prisma.room.create({ 
            data: {
              id: uuid(),
              room
            }
          })
          Object.assign(_room, newRoom)
        }

        const existParticipant = await _prisma.participant.findFirst({
          where: {
            username
          }
        })

        if (existParticipant) {
          Object.assign(_participant, existParticipant)

        } else {
          const newParticipant = await _prisma.participant.create({
            data: {
              id: uuid(),
              username,
              vote: '',
              isAdmin: true,
              room: {
                connect: {
                  id: _room.id
                }
              }
            }
          })

          Object.assign(_participant, newParticipant)

        }

        return {
          _room,
          _participant
        }
      } catch (err) {
        pino.error(err)
      }
    })

    return data
  }

  async find ({ id, username }: FindRoom) {
    const data = await prisma.$transaction(async _prisma => {
      try {
        const room = await _prisma.room.findFirst({ 
          where: {
            id
          }
        })

        const participant = await prisma.participant.findFirst({
          where: {
            room_id: id,
            username
          }
        })

        return {
          _room: room,
          _participant: participant,
        }
      } catch (err) {
        pino.error(err)
      }
    })

    return data
  }

  async joinToRoom ({ username, room_id }: JoinRoom) {
   const participant = {} as Participant

   const room = await prisma.room.findFirst({
    where: {
      id: room_id
    },
    include: {
      participants: true
    }
  })

  if (!room) throw new Error('not find room')

   const existParticipant = await prisma.participant.findFirst({
     where: {
       username
     }
   })

    if (existParticipant) {
      Object.assign(participant, existParticipant)
    } else {
      const newParticipant = await prisma.participant.create({
        data: {
          id: uuid(),
          username,
          vote: '',
          room: {
            connect: {
              id: room_id
            }
          }
        }
      })
      Object.assign(participant, newParticipant)
   }

   return {
     _room: room,
     _participant: participant
   }
  }

  async vote ({ user_id, vote, room_id }: CreateVote) {
    const room = await prisma.room.update({
      where: {
        id: room_id
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
          },
          
        }
      }
    })

    const participants = await prisma.participant.findMany({
      where: {
        room_id: room.id
      }
    })

    return {
      room,
      participants
    }
  }

  async newGame ({  room_id }: CreteGame) {
    const room = await prisma.room.findFirst({
      where: {
        id: room_id
      }
    })

    await prisma.participant.updateMany({
      where: {
        room_id
      },
      data: {
        vote: ''
      }
    })

    const participants = await prisma.participant.findMany({
      where: {
        room_id
      }
    })

    return {
      _participatns: participants,
      _room: room
    }
  }

  async findRoom (id: string) {
    return await prisma.room.findFirst({
      where: {
        id
      }
    })
  }

  async deleteDoom ({ room_id, user_id }: LeaveRoom) {
    await prisma.$transaction(async _prisma => {
      await _prisma.participant.delete({
        where: {
          id: user_id,
        },
      })

      await _prisma.room.update({
        where: {
          id: room_id
        },
        data: {
          participants: {
            update: {
              where: {
                id: user_id
              },
              data: {}
            }
          }
        }
      })
    })

  }
}