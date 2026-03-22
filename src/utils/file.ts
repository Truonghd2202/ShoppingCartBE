//hàm tạo sẵn thư mục uploads nếu chưa có
import { Request } from 'express'
import formidable, { File, Files } from 'formidable'
import fs from 'fs' //file system(tạo thư mục, xóa file,...)

import path from 'path' //xử lí đường dẫn
import { UPLOAD_IMAGE_DIR, UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

export const handleUploadSingleImage = (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_IMAGE_TEMP_DIR),
    maxFiles: 1,
    keepExtensions: true, //giữ lại đuôi của file
    maxFileSize: 300 * 1024, //300kb
    //thêm 1 cái option để kiểm tra file có phải image(custom)
    filter: function ({ name, originalFilename, mimetype }) {
      //name là trường dữ liệu được gửi lên
      //originalFilename: tên gốc ban đầu của file
      //mimetype: kiểu của file dc gửi lên 'video/mp4'
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('file type is not valid') as any)
      }
      return valid
    }
  })
  //
  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!files.image) {
        return reject(new Error('Image is empty'))
      }
      //qua hết thì
      resolve((files.image as File[])[0])
    })
  })
}

export const handleUploadImage = (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_IMAGE_TEMP_DIR),
    maxFiles: 4, //tối đa 4 file
    keepExtensions: true, //giữ lại đuôi của file
    maxFileSize: 300 * 1024, //300kb
    maxTotalFileSize: 300 * 1024 * 4,
    //thêm 1 cái option để kiểm tra file có phải image(custom)
    filter: function ({ name, originalFilename, mimetype }) {
      //name là trường dữ liệu được gửi lên
      //originalFilename: tên gốc ban đầu của file
      //mimetype: kiểu của file dc gửi lên 'video/mp4'
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('file type is not valid') as any)
      }
      return valid
    }
  })
  //
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!files.image) {
        return reject(new Error('Image is empty'))
      }
      //qua hết thì
      resolve(files.image as File[])
    })
  })
}

//làm hàm get file name để tương lai mình thay đổi đuôi
//vd: ban đầu ngta gửi mình file abc.asdasdasd.adasda.png
//mình phải lấy được abc.asdasdasd.adasda + .jpg

export const getNameFromFullName = (filename: string) => {
  //băm bằng dấu chấm
  const nameArr = filename.split('.') //xóa phần tử ở cuối
  nameArr.pop()
  return nameArr.join('.') //nối lại thành chuỗi
}

export const getExtension = (filename: string) => {
  const nameArr = filename.split('.')
  return nameArr[nameArr.length - 1]
}

export const handleUploadVideo = (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_VIDEO_DIR),
    maxFiles: 1,
    // keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, //50mb
    //thêm 1 cái option để kiểm tra file có phải image(custom)
    filter: function ({ name, originalFilename, mimetype }) {
      //name là trường dữ liệu được gửi lên
      const valid = name === 'video' && Boolean(mimetype?.includes('video/'))
      if (!valid) {
        form.emit('error' as any, new Error('file type is not valid') as any)
      }
      return valid
    }
  })
  //
  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!files.video) {
        return reject(new Error('Video is empty'))
      }
      //qua hết thì
      //xử lí đuôi file video
      const video = (files.video as File[])[0]
      const ext = getExtension(video.originalFilename as string)
      fs.renameSync(video.filepath, video.filepath + '.' + ext)
      video.newFilename = video.newFilename + '.' + ext

      return resolve(video)
    })
  })
}
