import { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

export const defaultErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  //hệ thông đỗ về rất nhiều lỗi, thường là ErrorWithStatus
  //nếu lỗi có dạng ErrorWithStatus
  if (error instanceof ErrorWithStatus) {
    return res.status(error.status).json(omit(error, 'status'))
  }
  //nếu lỗi có dạng error bình thường hoặc khác
  //thì mình nên mở cá enumerable ra
  Object.getOwnPropertyNames(error).forEach((key) => {
    Object.defineProperty(error, key, { enumerable: true })
  })

  //lỗi new Error thì k có status nên để mã 500
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: error.message,
    errorInfor: omit(error, ['stack'])
  })
}
