// Controller là handler có nhiệm vụ tập kết dữ liệu từ người dùng
// và phân phát vào các services đúng chổ

// Controller là nơi tập kết và xử lý logic cho các dữ liệu nhận được
// trong controller các dữ liệu đều phải clean
import { NextFunction, Request, Response } from 'express'
// import { validationResult } from 'express-validator'
import {
  ChangePasswordReqBody,
  EmailVerifyReqQuery,
  ForgotPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  UpdateMeReqBody,
  VerifyForgotPasswordTokenReqBody
} from '~/models/requests/User.requests'
import usersServices from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import { USERS_MESSAGES } from '~/constants/messages'
import { UserVerifyStatus } from '~/constants/enums'
import { result } from 'lodash'

export const loginController = async (
  req: Request<ParamsDictionary, any, LoginReqBody>, //
  res: Response
) => {
  //body có email và password
  //lên server kiểm tra email và password có khớp không, nếu khớp
  let result = await usersServices.login(req.body)
  //thì gửi lại ac và rf để suy trì đăng nhập
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result //ac và rf để duy trì đăng nhập
  })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  //ở đây dữ liệu xem như đã được kiểm tra valid
  //mình chỉ xài theo mục đích thôi
  const { email, password } = req.body

  //kiểm tra xem confirm password và password có giống nhau không
  //kiểm tra email có tồn tại hay không
  let isEmailExisted = await usersServices.checkEmailExist(email)
  if (isEmailExisted) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY, //422
      message: 'Email has been used'
    })
  }
  //tạo user và lưu vào database(ra lệnh cho data base tạo user từ các thông tin trên)
  // call services yêu cầu tạo user
  const result = await usersServices.register(req.body)
  //đóng gói kiện nếu tạo thành công
  return res.status(HTTP_STATUS.OK).json({
    message: 'Register success',
    result
  })
}

export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutReqBody>, //
  res: Response
) => {
  //tới đây là qua 2 middleware rồi
  //và 2 middleware này đã decoded access và refresh
  const { user_id: user_id_ac } = req.decoded_authorization as TokenPayload
  const { user_id: user_id_rf } = req.decoded_authorization as TokenPayload
  if (user_id_ac !== user_id_rf) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED,
      message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
    })
  }
  //nếu ac và rf có thông tin khớp nhau luôn thì quá ngon
  //mình xóa rf trên db là xong
  const { refresh_token } = req.body
  //kiểm tra xem refresh_token còn trên hệ thống hay không?
  await usersServices.checkRefreshToken({
    user_id: user_id_ac,
    refresh_token
  })
  //nếu mà có thì logout
  await usersServices.logout(refresh_token)
  //
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGOUT_SUCCESS
  })
}

export const emailVerifyController = async (
  req: Request<ParamsDictionary, any, any, EmailVerifyReqQuery>, //
  res: Response
) => {
  const { email_verify_token } = req.query
  const { user_id } = req.decoded_email_verify_token as TokenPayload

  //kiểm tra xem user_id này có còn sở hữu mã email_verify_token này không?
  await usersServices.checkEmailVerifyToken({ user_id, email_verify_token })
  //nếu còn thì đổi trạng thái verify của account
  await usersServices.verifyEmail(user_id)
  //nếu oke hết thì sao
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS
  })
}

export const resendEmailVerifyController = async (
  req: Request, //
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const verifyStatus = await usersServices.getUserVerifyStatus(user_id)
  //nếu mà trạng thái hiện tại là verify rồi thì xin làm gì
  if (verifyStatus == UserVerifyStatus.Verified) {
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  //nếu mà trạng thái là banner thì sao
  if (verifyStatus == UserVerifyStatus.Banned) {
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.ACCOUNT_HAS_BEEN_BANNED
    })
  }
  //nếu chưa verify thì gửi mã
  if (verifyStatus == UserVerifyStatus.Unverified) {
    await usersServices.resendEmailVerify(user_id)
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.CHECK_YOUR_EMAIL
    })
  }
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>, //
  res: Response
) => {
  const { email } = req.body
  //kiểm tra email có tồn tại không
  const isExisted = await usersServices.checkEmailExist(email)
  if (!isExisted) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED,
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  //nếu có tồn tại thì tạo link reset password và gửi vào email
  await usersServices.forgotPassword(email)
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.CHECK_YOUR_EMAIL
  })
}

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordTokenReqBody>, //
  res: Response
) => {
  //kiểm tra xem user_id hiện tạo có còn sỡ hữu forgot_password_token này không
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { forgot_password_token } = req.body
  //kiểm tra(tìm) user có sỡ hữu forgot_password_token
  await usersServices.checkForgotPasswordToken({
    user_id,
    forgot_password_token
  })
  //nếu vượt qua kiểm tra thì
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  //kiểm tra xem forgot_password_token có còn đúng với user_id
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { forgot_password_token, password } = req.body
  await usersServices.checkForgotPasswordToken({
    user_id,
    forgot_password_token
  })
  //neeuscos thì tiến hành đổi password
  await usersServices.resetPassword({
    user_id,
    password
  })
  //nếu đổi password oke thì
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
  })
}

export const getMeController = async (
  req: Request, //
  res: Response
) => {
  //thông qua user_id tìm user và gửi các thông tin client
  //phải loại bỏ các thông tin nhạy cảm
  const { user_id } = req.decoded_authorization as TokenPayload
  const userInfor = await usersServices.getMe(user_id) // gọi server lấy thông tin
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: userInfor
  })
}

export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>, //
  res: Response
) => {
  //muốn account phải verified thì mới cho update profile
  const { user_id } = req.decoded_authorization as TokenPayload
  const verifyStatus = await usersServices.getUserVerifyStatus(user_id)
  if (verifyStatus !== UserVerifyStatus.Verified) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED,
      message: USERS_MESSAGES.YOU_MUST_VERIFY_YOUR_ACCOUNT_TO_UPDATE_PROFILE
    })
  }
  //tiến hành update profile, payload là nd cần update
  const userInfor = await usersServices.updateMe({ user_id, payload: req.body })
  //update thành công thì
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.UPDATE_PROFILE_SUCCESS,
    result: userInfor
  })
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>, //
  res: Response
) => {
  //lấy user_id để biết phải update cho ai
  const { user_id } = req.decoded_authorization as TokenPayload
  const { old_password, password } = req.body
  //tiến hành update cho user_id này
  await usersServices.changePassword({
    user_id,
    old_password,
    password
  })
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
  })
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>, //
  res: Response
) => {
  //mình cần ktra xem refresh_token người dùng đưa còn trên database không
  const { user_id } = req.decoded_refresh_token as TokenPayload
  const { refresh_token } = req.body
  await usersServices.checkRefreshToken({
    user_id,
    refresh_token
  })
  //hàm này nhận vào user_id và refresh_token tiến hành tạo access và refresh_token mới
  //gửi cho người dùng để duy trì đăng nhập
  const result = await usersServices.refreshToken({ user_id, refresh_token })
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS
  })
}
