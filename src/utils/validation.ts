//1 hàm nhận vào checkSchema
//chạy checkSchema
//tự khui lỗi
//tự response lỗi luôn

import { NextFunction, Request, Response } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

//giúp giảm tải công việc ở controller
//hàm nhận vào validation(kq của checkSchema) sau đó trả ra middleware
//middleware: check validation, khưi lỗi, res lỗi
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //check lỗi bằng validation(kết quả của checkSchema)
    await validation.run(req) //kiểm tra validation và lưu lỗi vào req
    //khưi lỗi
    const error = validationResult(req) //lấy lỗi từ req ra
    //if else
    if (error.isEmpty()) {
      return next() //nếu k có lỗi thì next
    }
    //nếu có lỗi thì response lỗi
    const errorObject = error.mapped()
    //tí nữa sẽ độ lại errorObject
    const entityError = new EntityError({
      errors: {}
    })
    //đi qua từng key
    for (const key in errorObject) {
      const { msg } = errorObject[key] //lấy msg của các key
      //msg nào có 2 dạng, string(bình thường)
      // || lỗi do ErrorWithStatus tạo ra
      if (
        msg instanceof ErrorWithStatus &&
        msg.status != HTTP_STATUS.UNPROCESSABLE_ENTITY //422
      ) {
        return next(msg) //next(error): đưa lỗi về ErrorHandle Tổng
      }
      //nếu msg là error bình thường
      entityError.errors[key] = msg
    }
    next(entityError) //ném cho thằng tổng đóng gói
  }
}
