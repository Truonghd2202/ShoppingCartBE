import { NextFunction, Request, RequestHandler, Response } from 'express'

//hàm nhận vòa controller | hoặc middlwares async
//và biến chúng nó thành controller và middlware coscaaus trúc try catch next
export const wrapAsync = <P, T>(func: RequestHandler<P, any, any, T>) => {
  return async (req: Request<P, any, any, T>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next) //chạy hàm của em đã đưa trong cấu trúc try catch next
    } catch (error) {
      next(error)
    }
  }
}
