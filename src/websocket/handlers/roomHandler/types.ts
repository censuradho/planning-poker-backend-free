import { Participant, Room } from "@prisma/client";

export interface CreateRoom {
  username: string;
  room_name: string;
  socket_id: string;
}