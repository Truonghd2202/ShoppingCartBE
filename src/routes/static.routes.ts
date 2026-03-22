import express from 'express'
import { UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { serveImageController, serveVideoController } from '~/controllers/medias.controllers'
const staticRouter = express.Router()

staticRouter.get(
  '/image/:filename', //
  serveImageController
)

staticRouter.get(
  '/video/:filename', //
  serveVideoController
)

// staticRouter.use('/video', express.static(UPLOAD_VIDEO_DIR))
// 'lc:3000/static/image/abc.png'
export default staticRouter
