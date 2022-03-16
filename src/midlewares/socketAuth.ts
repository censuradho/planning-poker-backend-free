import { Io } from "app";
import { Request, Response, NextFunction } from "express";
import pino from "lib/pino";


export function socketAuth (request: Request, response: Response, next: NextFunction) {
  Io.use((socket, next) => {
    const username = socket.handshake.auth.username;

    if (!username) return next(new Error("invalid username"));
    
    socket.username = username;
    next();
    pino.info('asdasd')
  });
  pino.info('asdasd')

  next()
}
