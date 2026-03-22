import express from 'express'
import {
  uploadSingleImageController,
  uploadVideoController,
  uploadImageController
} from '~/controllers/medias.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'

const mediasRoutes = express.Router()

/*upload-images(single)
path: /medias/upload-image
method: POST
*/
mediasRoutes.post(
  '/upload-image', //
  accessTokenValidator,
  wrapAsync(uploadSingleImageController)
)
mediasRoutes.post(
  '/upload-image', //
  accessTokenValidator,
  wrapAsync(uploadImageController)
)

mediasRoutes.post(
  '/upload-video', //
  accessTokenValidator,
  wrapAsync(uploadVideoController)
)

export default mediasRoutes
