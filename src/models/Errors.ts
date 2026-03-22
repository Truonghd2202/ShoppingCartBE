import HTTP_STATUS from '~/constants/httpStatus'

type ErrorType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
>

//tạo ra 1 kiểu lỗi mới
export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorType //kiểu lỗi cũ
  constructor({
    message = 'Validation Error', //
    errors
  }: {
    message?: string
    errors: ErrorType
  }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY }) //422
    this.errors = errors
  }
}
