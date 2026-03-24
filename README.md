# 🛒 ShoppingCartBE

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![Express](https://img.shields.io/badge/Express-5.1-lightgrey.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.21-green.svg)

Backend API cho dự án E-commerce (Mua sắm trực tuyến) được xây dựng với hệ sinh thái Node.js (Express, TypeScript, MongoDB). 

Dự án tập trung vào việc xây dựng nền tảng API RESTful vững chắc, tối ưu bảo mật và tối ưu hóa xử lý file media.

## ✨ Tính năng nổi bật

- 🔐 **Xác thực & Phân quyền**: Áp dụng JWT (Access Token & Refresh Token).
- 👤 **Quản lý người dùng**: Đăng ký, Đăng nhập, Xác thực Email, Quên/Đổi mật khẩu, Cập nhật thông tin cá nhân.
- 📁 **Quản lý Media**: Upload, xử lý, nén ảnh (với sharp) và streaming video.
- 🌐 **Static serving**: Phục vụ file tĩnh chuyên nghiệp.
- 🏗️ **Kiến trúc chuẩn**: Phân tầng Controller - Middleware - Service - Model - Route rõ ràng.
- ✔️ **Validate data**: Sử dụng `express-validator` cho độ tin cậy và bảo mật cao.

## 🚀 Công nghệ sử dụng

- **Khung ứng dụng**: [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/)
- **Cơ sở dữ liệu**: [MongoDB](https://www.mongodb.com/) (Native Driver)
- **Bảo mật**: `jsonwebtoken`, `crypto`
- **Xử lý form & file**: `formidable`, `sharp`, `mime-types`
- **Công cụ phát triển**: `nodemon`, `eslint`, `prettier`, `ts-node`, `tsc-alias`

## 📂 Cấu trúc thư mục định hướng

```text
src/
├── constants/       # Hằng số toàn cục (HTTP status, message, RegExp...)
├── controllers/     # Tiếp nhận Request, gọi Service và trả về Response
├── middlewares/     # Xử lý các tác vụ trung gian (Auth, Error Handler, Validator)
├── models/          # Khai báo cấu trúc Schema DB, Interfaces, Types
├── routes/          # Khai báo và điều hướng các API endpoints
├── services/        # Nơi chứa các Business Logic cốt lõi & tương tác DB
├── utils/           # Các hàm tiện ích dùng chung (crypto, jwt, handler...)
└── index.ts         # Điểm khởi chạy của ứng dụng (Entry point)
```

## ⚙️ Yêu cầu hệ thống

- **Node.js**: Phiên bản 18.x trở lên
- **npm**: Phiên bản 9.x trở lên
- **MongoDB**: Dịch vụ Database (MongoDB Atlas hoặc MongoDB Local)

## 🛠️ Hướng dẫn cài đặt & Khởi chạy

### 1. Cài đặt dependencies

```bash
git clone <repository_url>
cd ShoppingCartBE
npm install
```

### 2. Thiết lập Biến môi trường

Tạo file `.env` ở thư mục gốc của dự án, sao chép cấu hình dưới đây và thay thế bằng các giá trị hợp lệ của bạn:

```env
# MongoDB Connection (Ví dụ cấu hình kết nối không dùng mongoose)
DB_USERNAME=your_mongodb_username
DB_PASSWORD=your_mongodb_password
DB_NAME=shopping_cart
DB_USERS_COLLECTION=users
DB_REFRESH_TOKENS_COLLECTION=refresh_tokens

# JWT Secrets
JWT_SECRET_ACCESS_TOKEN=your_access_token_secret
JWT_SECRET_REFRESH_TOKEN=your_refresh_token_secret
JWT_SECRET_EMAIL_VERIFY_TOKEN=your_email_verify_secret
JWT_SECRET_FORGOT_PASSWORD_TOKEN=your_forgot_pwd_secret

# Token Expiration Settings (ms format)
ACCESS_TOKEN_EXPIRE_IN=15m
REFRESH_TOKEN_EXPIRE_IN=7d
EMAIL_VERIFY_TOKEN_EXPIRE_IN=7d
FORGOT_PASSWORD_TOKEN_EXPIRE_IN=15m
```

### 3. Các lệnh chạy cơ bản (NPM Scripts)

- **Môi trường phát triển (Development):** Tự động restart server khi có thay đổi code.
  ```bash
  npm run dev
  ```
- **Kiểm tra và sửa cú pháp (Lint & Format):**
  ```bash
  npm run lint
  npm run prettier
  npm run lint:fix
  ```
- **Đóng gói dự án (Build Production):** Biên dịch code TS sang JS.
  ```bash
  npm run build
  ```
- **Chạy môi trường thực tế (Production):** Chạy trên thư mục `dist`.
  ```bash
  npm start
  ```

Server mặc định sẽ lắng nghe ở cổng từ biến môi trường `PORT` hoặc `3000` (http://localhost:3000).

## 📡 Tài liệu API (API Endpoints)

Base URL mặc định: `http://localhost:3000`
Tất cả các API được báo cáo lỗi với quy chuẩn chung (Error Handler Schema). Object lỗi Validation `422` đi kèm mảng `errors` mô tả rõ lý do vi phạm.

### Quản lý Người Dùng (Users)
| Phương thức | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/users/register` | Đăng ký tài khoản mới |
| `POST` | `/users/login` | Đăng nhập và nhận Tokens |
| `POST` | `/users/logout` | Đăng xuất (Thu hồi Refresh Token) - Cần `Bearer Token` |
| `POST` | `/users/refresh-token` | Cấp mới Access Token bằng Refresh Token |
| `GET` | `/users/verify-email` | Xác thực email |
| `POST` | `/users/resend-verify-email`| Gửi lại email xác thực - Cần `Bearer Token` |
| `POST` | `/users/forgot-password`| Yêu cầu gửi email reset mật khẩu |
| `POST` | `/users/verify-forgot-password`| Xác thực token quên mật khẩu |
| `POST` | `/users/reset-password` | Đặt lại mật khẩu mới |
| `POST`, `PATCH` | `/users/me` | Lấy/Cập nhật thông tin User hiện tại - Cần `Bearer Token` |
| `PUT` | `/users/change-password` | Đổi mật khẩu - Cần `Bearer Token` |

### Quản lý Media (Hình ảnh & Video)
| Phương thức | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/medias/upload-image` | Upload tối đa nhiều hình ảnh (Dùng `multipart/form-data`) - Cần `Bearer Token` |
| `POST` | `/medias/upload-video` | Upload tối đa nhiều video - Cần `Bearer Token` |

### Phục vụ Tệp Tĩnh (Static)
| Phương thức | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/static/image/:filename`| Xem/Lấy ảnh (Được tối ưu qua Sharp) |
| `GET` | `/static/video/:filename`| Xem/Stream một Video trực tiếp theo HTTP header `Range` |

## 🌟 Hướng phát triển tiếp theo (Roadmap)

- [ ] Viết tài liệu API với Swagger/OpenAPI.
- [ ] Bổ sung cơ chế gửi Email thực bằng SendGrid/Nodemailer thay vì in ra Console.
- [ ] Implement cấu trúc Response chuẩn hóa cho mọi API (Success / Error DTO).
- [ ] Triển khai phân trang cho danh sách (Pagination & Filtering).
- [ ] Tối ưu hóa hiệu năng, rate limit bảo vệ API.
- [ ] Setup Unit Test và Integration Test với Jest.
- [ ] Containerize bằng Docker.
