import { Participant, Room } from "@prisma/client";

export interface CreateRoom {
  room_name: string;
  username: string
}

export interface LeaveRoom {
  room_id: string;
  user_id: string
}

export interface JoinRoom {
  room_id: string;
  username: string
}

export interface RoomResponse {
  _room: Room & Participant
  _participant: Participant
}

export interface CreateVote {
  vote: string;
  user_id: string;
  room_id: string
}

export interface CreteGame {
  room_id: string
}

