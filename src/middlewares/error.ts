import { NextFunction, Request, Response } from 'express'

import { ErrorHandler } from 'utils/errorHandler'
import pino from 'lib/pino'

export function errorHandler (error: ErrorHandler, request: Request, response: Response, next: NextFunction) {


}