import jwt from 'jsonwebtoken'
import { TokenPayload } from '~/models/requests/User.requests'

//payload: nội dung cần lưu
//privateKey: chữ kí bí mật của server
//options: chuẩn mã hóa, ngày hết hạn
export const signToken = ({
  payload, //
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: any
  privateKey: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) throw reject(error)
      resolve(token as string)
    })
  })
}

//verifyToken
//hàm này nhận vào token, kiểm tra token và trả ra payload

export const verifyToken = ({
  token, //
  privateKey
}: {
  token: string
  privateKey: string
}) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, privateKey, (error, decode) => {
      if (error) throw reject(error)
      resolve(decode as TokenPayload)
    })
  })
}
