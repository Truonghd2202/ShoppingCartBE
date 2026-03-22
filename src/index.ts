import express from 'express'
import userRouter from './routes/users.routes'
import databaseServices from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRoutes from './routes/medias.routes'
import { initFolder } from './utils/file'
import staticRouter from './routes/static.routes'

const app = express() //khởi tạo server
const PORT = 3000 // mở cổng backend với PORT 3000

databaseServices.connect()
initFolder()
app.use(express.json()) //servr dùng middleware biển đổi các chuỗi json gửi lên
app.use('/users', userRouter)
app.use('/medias', mediasRoutes)
app.use('/static', staticRouter)
// userRouter sẽ có một middleware

//Error Handle Tổng của toàn bộ app
app.use(defaultErrorHandler)
//cho server mở cổng lắng nghe
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
