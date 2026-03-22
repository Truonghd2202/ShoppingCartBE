import { error, log } from 'console'
import express from 'express'
import {
  changePasswordController,
  emailVerifyController,
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  updateMeController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
import { wrapAsync } from '~/utils/handlers'
const userRouter = express.Router() //tạo userRoute chứa api liên quan đến user

// userRouter.use(
//   (req, res, next) => {
//     console.log('Time1', Date.now())
//     next()
//     // return res.status(400).json({
//     //   data: 'not allowed'
//     // })
//     // console.log('123123123'); //không return là dòng này chạy đó
//   },
//   (req, res, next) => {
//     console.log('Time2', Date.now())
//     next()
//   }
// )

// userRouter.get('/get-me', (req, res) => {
//   res.json({
//     data: {
//       fname: 'Điệp',
//       yob: 1999
//     }
//   })
// })

/*login
path: /users/login 
method: post
body: {email, password}
*/
userRouter.post('/login', loginValidator, wrapAsync(loginController))
/*Register
path: /users/register
method: post
body: {
    email: string,
    password: string,
    confirm_password: string,
    date_of_birth: ISO8601
}
*/
userRouter.post('/register', registerValidator, wrapAsync(registerController))

/*logout: đăng xuất
method: post
Header{
    Authorization: 'Bearer access_token'
}
body{
    refresh_token: string,
}
*/
userRouter.post(
  '/logout',
  accessTokenValidator, //
  refreshTokenValidator,
  wrapAsync(logoutController)
)

/*verify-email
khi người dùng nhấn vào link trong email sẽ lập tức gửi token lên route này
mình sẽ verify token thông qua link này và verify người dùng
path: /users/verify-email/?email_verify_token=string
method: GET
*/
userRouter.get(
  '/verify-email/',
  emailVerifyTokenValidator, //
  wrapAsync(emailVerifyController)
)

/*Resend email verify token
des:khi người dùng k nhận được email verify token có thể yêu cầu gửi lại
path: /users/resend-verify-email
method: POST
header: {
    Authorization: 'Bearer access_token'
}
*/
userRouter.post(
  '/resend-verify-email', //
  accessTokenValidator,
  wrapAsync(resendEmailVerifyController)
)

/*forgot-password
des: khi người dùng quên mật khẩu có thể yêu cầu gửi email đặt lại mật khẩu, ta tạo link và gửi vào email
path: /users/forgot-password
method: POST
body: {
    email: string
}
*/
userRouter.post(
  '/forgot-password', //
  forgotPasswordValidator,
  wrapAsync(forgotPasswordController)
)

/*verify-forgot-password
des: khi người dùng bấm link forgot-password
và guiwrmax cho FE, FE sẽ gửi mã ho mình để xác thực
nếu mã đúng thì FE sẽ hiển thị giao diện nhận lại password mới
path: /users/verify-forgot-password
method: POST
body{
  forgot_password_token: string
}
*/
userRouter.post(
  '/verify-forgot-password', //
  verifyForgotPasswordValidator, //hàm kiểm tra forgot_password_token
  wrapAsync(verifyForgotPasswordController)
)

/*reset-password
des: sau khi người dùng sài giao diện đổi mậtkhaaur
FE sẽ gửi password mới , confirm_password mới và forgot_password_token lên cho mình đổi
path: /users/reset-password
method: POST
body{
  password: string,
  confirm_password: string,
  forgot_password_token: string
}
*/
userRouter.post(
  '/reset-password', //
  verifyForgotPasswordValidator,
  resetPasswordValidator, //kiểm tra password và confirm_password
  wrapAsync(resetPasswordController)
)

/*getMe
des: xem thông tin cá nhân của mình
path: /users/me
method: post
header{
    Authorization: 'Bearer access_token'
}
*/
userRouter.post(
  '/me',
  accessTokenValidator, //
  wrapAsync(getMeController)
)

/*
des: update profile của user
path: '/me'
method: patch
Header: {Authorization: Bearer <access_token>}
body: {
  name?: string
  date_of_birth?: Date
  bio?: string // optional
  location?: string // optional
  website?: string // optional
  username?: string // optional
  avatar?: string // optional
  cover_photo?: string // optional}
*/

userRouter.patch(
  '/me',
  accessTokenValidator, //
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>([
    'bio',
    'username',
    'avatar',
    'cover_photo',
    'date_of_birth',
    'location',
    'name',
    'website'
  ]),
  wrapAsync(updateMeController)
)

/*change password
des: người dùng đang đăng nhập và muốn đổi mật khẩu
path: /change-password
method: PUT
header: {Authorization: 'Bearer <access_token>'}
body: {
    old_password: string,
    password: string,
    confirm_new_password: string
}
*/
userRouter.put(
  '/change-password', //
  accessTokenValidator,
  changePasswordValidator,
  wrapAsync(changePasswordController)
)

/*refresh token
des: khi access_token hết hạn thì mình phải tạo gửi lên mã refresh_token để xin lại mã access_token khác
path:/refresh-token
method: POST
body: {
    refresh_token: string
}
*/
userRouter.post(
  '/refresh-token', //
  refreshTokenValidator,
  wrapAsync(refreshTokenController)
)

export default userRouter
