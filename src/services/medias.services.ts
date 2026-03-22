import { Request } from 'express'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { getNameFromFullName, handleUploadSingleImage, handleUploadVideo, handleUploadImage } from '~/utils/file'
import fs from 'fs'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/Other'

class MediasServices {
  //tạo hàm xử lí upload 1 image
  async handleUploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req)
    //đưa đường dẫn của file vừa nhận được vào sharp để xử lí
    const newFileName = getNameFromFullName(file.newFilename) + '.jpg'
    const newPath = `${UPLOAD_IMAGE_DIR}/${newFileName}`
    const info = await sharp(file.filepath).jpeg().toFile(newPath)
    //xóa file tạm
    fs.unlinkSync(file.filepath)
    //mình k nên trả ra tất cả file nữa, trả ra đường dẫn cho người dùng xem là đủ
    const urlImage: Media = { url: `http://localhost:3000/static/image/${newFileName}`, type: MediaType.Image }
    return urlImage
  }

  async handleUploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result = await Promise.all(
      files.map(async (file) => {
        //đưa đường dẫn của file vừa nhận được vào sharp để xử lí
        const newFileName = getNameFromFullName(file.newFilename) + '.jpg'
        const newPath = `${UPLOAD_IMAGE_DIR}/${newFileName}`
        const info = await sharp(file.filepath).jpeg().toFile(newPath)
        //xóa file tạm
        fs.unlinkSync(file.filepath)
        //mình k nên trả ra tất cả file nữa, trả ra đường dẫn cho người dùng xem là đủ
        const urlImage: Media = { url: `http://localhost:3000/static/image/${newFileName}`, type: MediaType.Image }
        return urlImage
      })
    )
    return result
  }

  async uploadVideo(req: Request) {
    //
    const video = await handleUploadVideo(req)
    const { newFilename } = video
    return `http://localhost:3000/static/video/${newFilename}`
  }
}

const mediasServices = new MediasServices()
export default mediasServices
