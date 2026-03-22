import User from '~/models/User.schema'
import databaseServices from './database.services'
import { LoginReqBody, RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import dotenv from 'dotenv'
import ms from 'ms'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshToken from '~/models/refreshToken.schema'
import { ObjectId } from 'mongodb'
import { update } from 'lodash'
dotenv.config()

class UsersServices {
  //method giúp tạo token
  private signAccessToken(user_id: string) {
    return signToken({
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN as ms.StringValue }
    })
  }
  //method giúp tạo token
  private signRefreshToken(user_id: string) {
    return signToken({
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN as ms.StringValue }
    })
  }

  private signEmailVerifyToken(user_id: string) {
    return signToken({
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      payload: { user_id, token_type: TokenType.EmailVerificationToken },
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN as ms.StringValue }
    })
  }

  private signForgotPasswordToken(user_id: string) {
    return signToken({
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      payload: { user_id, token_type: TokenType.ForgotPasswordToken },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN as ms.StringValue }
    })
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    //tạo user và lưu vào database
    const result = await databaseServices.users.insertOne(
      new User({
        ...payload,
        username: `user${user_id.toString()}`,
        _id: user_id,
        date_of_birth: new Date(payload.date_of_birth),
        //vì user cần date còn payload thì dùng string
        //mình sẽ ghi đè thuộc tính date_of_birth
        password: hashPassword(payload.password),
        //mã hóa trước khi đẩy lên
        email_verify_token
      })
    )
    //trả ra kết quả việc thêm (id của object vừa thêm)
    //lấy user_id từ result sau khởi tạo user
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id.toString()),
      this.signRefreshToken(user_id.toString())
    ])
    //lưu rf vào database
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({
        user_id,
        token: refresh_token
      })
    )
    //hàm gửi mail
    console.log(`http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}`)

    return {
      access_token,
      refresh_token
    }
  }

  async checkEmailExist(email: string): Promise<boolean> {
    const user = await databaseServices.users.findOne({ email })
    return Boolean(user)
  }

  async login(payload: LoginReqBody) {
    //lên server tìm user sở hữu cả 2 thông tin email và password cùng lúc
    const user = await databaseServices.users.findOne({
      ...payload,
      password: hashPassword(payload.password)
    })
    //nếu k có user
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY, //422
        message: USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT
      })
    }
    //nếu có user thì tạo ac và rf từ user_id
    const user_id = user._id.toString()

    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
    //
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id as string),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async checkRefreshToken({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    const refreshtoken = await databaseServices.refreshTokens.findOne({
      user_id: new ObjectId(user_id),
      token: refresh_token
    })
    //nếu tìm k thấy
    if (!refreshtoken) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
      })
    }
    //nếu có thì
    return true
  }

  async logout(refresh_token: string) {
    await databaseServices.refreshTokens.deleteOne({
      token: refresh_token
    })
    return true
  }

  async checkEmailVerifyToken({
    user_id, //
    email_verify_token
  }: {
    user_id: string
    email_verify_token: string
  }) {
    const user = await databaseServices.users.findOne({
      email_verify_token,
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY
      })
    }

    return true
  }

  //hàm đổi trạng thái verify của user
  async verifyEmail(user_id: string) {
    //cập nhật thông tin của user đó
    await databaseServices.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            verify: UserVerifyStatus.Verified,
            email_verify_token: '',
            updated_at: '$$NOW'
          }
        }
      ]
    )
    return
  }

  //lấy thông tin verify của user
  async getUserVerifyStatus(user_id: string) {
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    //nếu có user thì return
    return user.verify
  }

  //hàm résend email verify token
  async resendEmailVerify(user_id: string) {
    //tạo lại email verify token
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    //cập nhật vào database
    await databaseServices.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            email_verify_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    //gửi email
    console.log(`http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}`)
    return
  }

  async forgotPassword(email: string) {
    //tìm user theo email
    const user = (await databaseServices.users.findOne({ email })) as User
    //lấy user_id
    const user_id = (user._id as ObjectId).toString()
    //tạo mã forgotPassword
    const forgot_password_token = await this.signForgotPasswordToken(user_id)
    //cập nhật thêm forgot_password_token cho user
    await databaseServices.users.updateOne(
      {
        _id: user._id
      },
      [
        {
          $set: { forgot_password_token, updated_at: '$$NOW' }
        }
      ]
    )
    //gửi mail cái link
    console.log(`http://localhost:8000/users/reset-password/?forgot_password_token=${forgot_password_token}`)
    return
  }

  async checkForgotPasswordToken({
    user_id,
    forgot_password_token
  }: {
    user_id: string
    forgot_password_token: string
  }) {
    //dùng 2 thông tin trên tìm user
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(user_id),
      forgot_password_token
    })
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID
      })
    }
    //nếu có thì oke, k cần làm gì cả
  }

  async resetPassword({
    user_id, //
    password
  }: {
    user_id: string
    password: string
  }) {
    await databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) }, //filter
      [
        {
          $set: {
            password: hashPassword(password),
            forgot_password_token: '',
            updated_at: '$$NOW'
          }
        }
      ]
    )
    //oke thì thôi
  }

  async getMe(user_id: string) {
    const user = await databaseServices.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    //nếu k có user thì làm sao
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    //nếu có thì
    return user
  }

  async updateMe({ user_id, payload }: { user_id: string; payload: UpdateMeReqBody }) {
    //trong payload có 1 thông tin cần fix
    const _payload = {
      ...payload,
      date_of_birth: new Date(payload.date_of_birth as string)
    }
    //nếu user muốn update username thì phải xem username có tồn tại không?
    if (_payload.username) {
      const user = await databaseServices.users.findOne({ username: _payload.username })
      if (user) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.UNPROCESSABLE_ENTITY, //422
          message: USERS_MESSAGES.USERNAME_ALREADY_EXISTS
        })
      }
    }
    //nếu k bị trùng thì update thoi
    const user = await databaseServices.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) }, //
      [
        {
          $set: {
            ..._payload, //tất cả những gì trong payload "mới",
            updated_at: '$$NOW'
          }
        }
      ],
      {
        returnDocument: 'after', //trả ra object sau update
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user //đây là document sau khi update
  }

  async changePassword({
    user_id,
    old_password,
    password
  }: {
    user_id: string
    old_password: string
    password: string
  }) {
    //tìm user với user_id và old_password để xem có user không, trước khi update
    //password mới
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(user_id),
      password: hashPassword(old_password)
    })
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    //nếu có thì đổi
    await databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) }, //filter
      [
        {
          $set: {
            password: hashPassword(password),
            updated_at: '$$NOW'
          }
        }
      ]
    )
    //nếu xong thì thôi
  }

  async refreshToken({
    user_id, //
    refresh_token
  }: {
    user_id: string
    refresh_token: string
  }) {
    //xóa cũ
    await databaseServices.refreshTokens.deleteOne({
      token: refresh_token
    })
    //tạo 2 mã mới và gửi cho người dùng
    const [access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
    //
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id as string),
        token: new_refresh_token
      })
    )
    return {
      access_token,
      refresh_token: new_refresh_token
    }
  }
}

const usersServices = new UsersServices()
export default usersServices
