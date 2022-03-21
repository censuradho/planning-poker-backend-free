export interface CreateRoom {
  username: string;
  room_name: string;
  socket_id: string;
}

export interface JoinRoomRequest {
  username: string;
  room_id: string;
  socket_id: string
}

export interface CardSelected {
  user_id: string;
  room_id: string;
  vote: string
}
