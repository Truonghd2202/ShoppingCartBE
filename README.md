# ShoppingCartBE

Backend API cho bài thực hành MERN (Node.js + Express + TypeScript + MongoDB), tập trung vào:

- Xác thực người dùng bằng JWT (access token, refresh token)
- Quản lý tài khoản: đăng ký, đăng nhập, xác minh email, quên mật khẩu, đổi mật khẩu
- Upload media (ảnh, video) và phục vụ file tĩnh

## Mục đích

- Xây dựng nền tảng backend cho ứng dụng shopping cart theo kiến trúc REST API.
- Thực hành luồng xác thực/ủy quyền người dùng bằng JWT và refresh token.
- Chuẩn hóa quy trình upload, lưu trữ và truy xuất media (image/video).
- Tổ chức code theo mô hình controller - middleware - service để dễ mở rộng và bảo trì.

## 1) Công nghệ sử dụng

- Node.js
- TypeScript
- Express 5
- MongoDB (MongoDB Node Driver)
- JWT (jsonwebtoken)
- express-validator
- formidable + sharp (upload và xử lý ảnh)

## 2) Cấu trúc chính

```text
src/
	index.ts                  # entry server
	controllers/              # xử lý request/response
	middlewares/              # validate và auth
	routes/                   # khai báo endpoint
	services/                 # business logic + truy cập DB
	models/                   # schema/model + request types
	utils/                    # hàm tiện ích
	constants/                # hằng số hệ thống
uploads/
	image/
		temp/
	video/
```

## 3) Yêu cầu môi trường

- Node.js 18+
- npm 9+
- MongoDB Atlas (hoặc MongoDB phù hợp với connection string hiện tại)

## 4) Cài đặt và chạy

1. Cài dependencies:

```bash
npm install
```

2. Tạo file `.env` ở root project (tham khảo mục bên dưới).

3. Chạy môi trường development:

```bash
npm run dev
```

Server mặc định chạy tại: `http://localhost:3000`

4. Build production:

```bash
npm run build
```

5. Chạy bản build:

```bash
npm start
```

## 5) Scripts có sẵn

- `npm run dev`: chạy bằng nodemon + ts-node
- `npm run build`: xóa `dist`, biên dịch TypeScript, resolve path alias
- `npm start`: chạy file build ở `dist/index.js`
- `npm run lint`: lint toàn bộ dự án
- `npm run lint:fix`: tự sửa lỗi lint cơ bản
- `npm run prettier`: kiểm tra format
- `npm run prettier:fix`: format code

## 6) Cấu hình biến môi trường (.env)

Tạo file `.env` với nội dung mẫu:

```env
# MongoDB
DB_USERNAME=your_mongodb_username
DB_PASSWORD=your_mongodb_password
DB_NAME=shopping_cart
DB_USERS_COLLECTION=users
DB_REFRESH_TOKENS_COLLECTION=refresh_tokens

# JWT secrets
JWT_SECRET_ACCESS_TOKEN=your_access_secret
JWT_SECRET_REFRESH_TOKEN=your_refresh_secret
JWT_SECRET_EMAIL_VERIFY_TOKEN=your_email_verify_secret
JWT_SECRET_FORGOT_PASSWORD_TOKEN=your_forgot_password_secret

# Token expiration (chuẩn thư viện ms, ví dụ: 15m, 7d, 1h)
ACCESS_TOKEN_EXPIRE_IN=15m
REFRESH_TOKEN_EXPIRE_IN=7d
EMAIL_VERIFY_TOKEN_EXPIRE_IN=7d
FORGOT_PASSWORD_TOKEN_EXPIRE_IN=15m
```

## 7) API chính

Base URL: `http://localhost:3000`

### 7.1 User APIs (`/users`)

1. POST `/users/register`

- Body:
  - `name`: string
  - `email`: string
  - `password`: string (8-50, strong password)
  - `confirm_password`: string
  - `date_of_birth`: ISO8601 string

2. POST `/users/login`

- Body:
  - `email`: string
  - `password`: string

3. POST `/users/logout`

- Headers:
  - `Authorization: Bearer <access_token>`
- Body:
  - `refresh_token`: string

4. GET `/users/verify-email?email_verify_token=...`

- Query:
  - `email_verify_token`: string

5. POST `/users/resend-verify-email`

- Headers:
  - `Authorization: Bearer <access_token>`

6. POST `/users/forgot-password`

- Body:
  - `email`: string

7. POST `/users/verify-forgot-password`

- Body:
  - `forgot_password_token`: string

8. POST `/users/reset-password`

- Body:
  - `password`: string
  - `confirm_password`: string
  - `forgot_password_token`: string

9. POST `/users/me`

- Headers:
  - `Authorization: Bearer <access_token>`

10. PATCH `/users/me`

- Headers:
  - `Authorization: Bearer <access_token>`
- Body (optional fields):
  - `name`, `date_of_birth`, `bio`, `location`, `website`, `username`, `avatar`, `cover_photo`

11. PUT `/users/change-password`

- Headers:
  - `Authorization: Bearer <access_token>`
- Body:
  - `old_password`: string
  - `password`: string
  - `confirm_password`: string

12. POST `/users/refresh-token`

- Body:
  - `refresh_token`: string

### 7.2 Media APIs (`/medias`)

1. POST `/medias/upload-image`

- Headers:
  - `Authorization: Bearer <access_token>`
- Content-Type: `multipart/form-data`
- Mục đích: upload ảnh (service xử lý ảnh bằng sharp, convert sang jpg)

2. POST `/medias/upload-video`

- Headers:
  - `Authorization: Bearer <access_token>`
- Content-Type: `multipart/form-data`

### 7.3 Static APIs (`/static`)

1. GET `/static/image/:filename`

- Trả file ảnh đã upload

2. GET `/static/video/:filename`

- Stream video theo `Range` header (Partial Content)

## 8) Format phản hồi lỗi

API sử dụng error handler tổng, thường trả về dạng:

```json
{
  "message": "..."
}
```

Với lỗi validate (`422`), trả thêm object `errors` theo field.

## 9) Ghi chú triển khai

- Dự án dùng path alias `~/*` trỏ đến `src/*`.
- Thư mục upload được khởi tạo khi app start.
- Link verify email và reset password hiện đang được in ra console để mô phỏng gửi email.

## 10) Định hướng cải thiện

- Thêm tài liệu OpenAPI/Swagger
- Chuẩn hóa response success/error theo 1 schema cố định
- Thêm unit test/integration test
- Thêm cơ chế gửi email thật (SMTP / provider)
- Bổ sung cơ chế phân trang, rate limit, logging chuẩn production
