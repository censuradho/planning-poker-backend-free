import { Server } from 'http'
import { Server as IoServer } from 'socket.io'

function instanceIO (server: Server) {
  return new IoServer(server, {
    cors: {
      origin: '*'
    }
  })
}

export default instanceIO