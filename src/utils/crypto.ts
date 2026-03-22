import { createHash } from 'crypto'
import dotenv from 'dotenv'
dotenv.config()

//hàm biến 1 đoạn nội dung thành đoạn mã sh-256
function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

//hàm mã hóa password + mật khẩu bí mật của mình
export function hashPassword(password: string) {
  return sha256(password + process.env.PASSWORD_SECRET)
}
