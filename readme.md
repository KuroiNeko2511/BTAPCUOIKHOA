# S-Group Learning Platform — Backend API

Hệ thống Backend RESTful API quản lý lớp học, thành viên, tiến độ bài học và nộp/chấm bài tập nội bộ cho **S-Group**. Dự án được xây dựng theo kiến trúc phân tầng chuẩn (**Controller – Service – Repository**), tích hợp xác thực JWT, phân quyền đa cấp độ (RBAC & Class-level Ownership), lưu trữ tệp đám mây Cloudflare R2, tài liệu API tương tác bằng Swagger và đóng gói Docker triển khai trên AWS EC2.

---

## Mục lục

- [1. Công nghệ sử dụng](#1-công-nghệ-sử-dụng)
- [2. Kiến trúc & Cấu trúc thư mục](#2-kiến-trúc--cấu-trúc-thư-mục)
- [3. Phân quyền & Quy tắc nghiệp vụ cốt lõi](#3-phân-quyền--quy-tắc-nghiệp-vụ-cốt-lõi)
- [4. Hướng dẫn cài đặt & Chạy Local](#4-hướng-dẫn-cài-đặt--chạy-local)
- [5. Chạy dự án bằng Docker & Deploy EC2](#5-chạy-dự-án-bằng-docker--deploy-ec2)
- [6. Tài liệu API (Swagger) & Tài khoản mẫu](#6-tài-liệu-api-swagger--tài-khoản-mẫu)
- [7. Danh sách API Endpoints chính](#7-danh-sách-api-endpoints-chính)

---

## 1. Công nghệ sử dụng

- **Runtime & Framework:** Node.js (ES Modules), Express.js
- **Cơ sở dữ liệu:** PostgreSQL (tương thích Local PostgreSQL & Neon Serverless PostgreSQL)
- **Driver Database:** `pg` (`node-postgres`) với Connection Pool (SSL) & Parameterized Queries (`$1, $2...`)
- **Xác thực & Bảo mật:** JSON Web Token (`jsonwebtoken`), mã hóa mật khẩu một chiều `bcrypt`
- **Validation & Error Handling:** `express-validator`, Custom Exception Classes (`ApiError`), Centralized Error Middleware
- **Cloud Storage:** Cloudflare R2 (tương thích AWS S3 SDK)
- **API Documentation:** Swagger UI (`swagger-ui-express`, `swagger-jsdoc`)
- **DevOps & Deployment:** Docker (Multi-arch AMD64/ARM64), Docker Hub, AWS EC2

---

## 2. Kiến trúc & Cấu trúc thư mục

Dự án tuân thủ mô hình **Layered Architecture (Controller – Service – Repository)** giúp tách biệt rõ ràng giữa tiếp nhận HTTP, xử lý nghiệp vụ và truy vấn dữ liệu:

```text
├── src/
│   ├── config/              # Cấu hình DB Pool (PostgreSQL/Neon), biến môi trường, R2, Swagger
│   ├── controller/          # Tiếp nhận Request, trích xuất params/body và trả Response chuẩn hóa
│   ├── core/                # Các lớp lỗi kế thừa ApiError (400, 401, 403, 404, 409) & hằng số
│   ├── database/
│   │   ├── migrations/      # File SQL khởi tạo schema, constraints, index, triggers
│   │   └── seeds/           # Script seed dữ liệu tài khoản mẫu (seed.js)
│   ├── docs/                # File đặc tả OpenAPI/Swagger (.yaml)
│   ├── middleware/          # Auth JWT, Role check, Class Mentor check, Validator, Error Handler
│   ├── repository/          # Tầng truy vấn SQL trực tiếp với PostgreSQL
│   ├── route/               # Định nghĩa các nhóm RESTful API endpoints
│   ├── service/             # Xử lý toàn bộ Business Logic & phân quyền chi tiết
│   ├── utils/               # Helper (catchAsync, responseHelper, password, jwt)
│   └── index.js             # Entry point khởi chạy Express Server
├── .dockerignore
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 3. Phân quyền & Quy tắc nghiệp vụ cốt lõi

Hệ thống sử dụng 2 vai trò chính trong bảng `users` (`ADMIN`, `MEMBER`) kết hợp phân quyền động theo lớp học:

- **ADMIN:** Quản lý người dùng (tạo, sửa, xóa mềm `is_active = FALSE`), khởi tạo lớp học, chỉ định Mentor cho lớp, thêm hoặc xóa học viên khỏi lớp.
- **MENTOR (Dynamic Role):** Là người dùng có `role = MEMBER` nhưng được gán vào trường `mentor_id` của một lớp học cụ thể. Chỉ Mentor của chính lớp đó (hoặc Admin) mới có quyền tạo/sửa/xóa bài học (`Lessons`), tạo/quản lý bài tập (`Assignments`) và chấm điểm bài nộp (`Review Submissions`) của lớp mình.
- **MEMBER (Học viên):** Chỉ xem được các lớp học mà mình được Admin thêm vào (`class_members`), xem bài học, đánh dấu hoàn thành bài học, theo dõi phần trăm tiến độ (`% progress`), nộp bài tập và xem điểm/nhận xét.
- **Ràng buộc dữ liệu (Business Rules):**
  - Một học viên không thể bị thêm trùng 2 lần vào cùng một lớp (`UNIQUE (class_id, member_id)`).
  - Thứ tự bài học (`order_index`) là duy nhất trong phạm vi một lớp (`UNIQUE (class_id, order_index)`).
  - Học viên không thể đánh dấu hoàn thành lặp lại cho cùng một bài học (`409 Conflict`).
  - Điểm chấm bài (`score`) bắt buộc nằm trong khoảng hợp lệ `[0, maximumScore]`.

---

## 4. Hướng dẫn cài đặt & Chạy Local

### Yêu cầu hệ thống

- Node.js phiên bản `>= 18.x` (khuyên dùng Node 20 LTS)
- PostgreSQL (`>= 14.x`) chạy ở Local hoặc tài khoản [Neon Cloud](https://neon.tech)

### Bước 1: Clone mã nguồn và cài đặt thư viện

```bash
git clone https://github.com/KuroiNeko2511/BTAPCUOIKHOA.git
cd D:/
npm install
```

### Bước 2: Cấu hình biến môi trường

Tạo file `.env` tại thư mục gốc (tham khảo từ `.env.example`) và điền thông tin kết nối của bạn:

```env
PORT=3000
NODE_ENV=development

# Cấu hình PostgreSQL / Neon Cloud
DATABASE_URL=postgresql://<user>:<password>@<host>/<db_name>?sslmode=require
PGSSLMODE=require
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=sgroup_learning_db

# Cấu hình JWT
JWT_SECRET=sgroup_super_secret_jwt_key_2026
JWT_EXPIRES_IN=1d
```

### Bước 3: Khởi tạo Database (Migration) & Dữ liệu mẫu (Seed)

1. Chạy file SQL khởi tạo bảng trong `src/database/` (qua pgAdmin hoặc Neon SQL Editor) để tạo đầy đủ các bảng: `users`, `classes`, `class_members`, `lessons`, `lesson_progress`, `assignments`, `submissions`.
2. Chạy script seed để tạo sẵn tài khoản Admin và các tài khoản Member mẫu:

```bash
node src/database/seeds/seed.js
```

### Bước 4: Khởi động Server

```bash
# Chạy chế độ development (tự động reload khi sửa code)
npm run dev

# Hoặc chạy thông thường
node src/index.js
```

Server khởi chạy thành công tại địa chỉ: `http://localhost:3000`.

---

## 5. Chạy dự án bằng Docker & Deploy EC2

### Chạy môi trường Development bằng Docker Compose

```bash
docker compose up -d --build
docker compose logs -f app
```

### Build Image & Deploy lên AWS EC2 (hỗ trợ chip ARM64 `t4g`)

```bash
# 1. Build và Push lên Docker Hub (trên máy local)
docker build --platform linux/arm64 -t phancam/btck:latest .
docker push phancam/btck:latest

# 2. Pull và Run Container (trên máy chủ AWS EC2)
docker pull phancam/btck:latest
docker run -d \
  --name backend_ck \
  -p 3001:3000 \
  --restart unless-stopped \
  --env-file .env \
  phancam/btck:latest
```

---

## 6. Tài liệu API (Swagger) & Tài khoản mẫu

### Truy cập Swagger UI

Sau khi khởi động server, mở trình duyệt và truy cập đường dẫn sau để xem mô tả chi tiết và test trực tiếp các API:

- **Local:** `http://localhost:3000/api-docs`

_(Nhấn nút **Authorize** trên góc phải Swagger UI và nhập `Bearer <accessToken>` lấy từ API đăng nhập để xác thực cho các private endpoints)_.

### Dữ liệu mẫu mặc định (Sau khi chạy Seed)

#### 1. Danh sách tài khoản

| Vai trò    | Email                                             | Mật khẩu   | Vai trò trong lớp mẫu               |
| :--------- | :------------------------------------------------ | :--------- | :---------------------------------- |
| **ADMIN**  | `admin@gmail.com`                                 | `admin123` | Quản trị viên hệ thống (Toàn quyền) |
| **MEMBER** | `user1@gmail.com`                                 | `user123`  | Mentor lớp `BE Basic - Batch 01`    |
| **MEMBER** | `user2@gmail.com`                                 | `user123`  | Mentor lớp `FE Basic - Batch 01`    |
| **MEMBER** | `user3@gmail.com` $\rightarrow$ `user6@gmail.com` | `user123`  | Học viên tham gia các lớp học mẫu   |

#### 2. Danh sách lớp học mẫu

| Tên lớp                 | Mentor phụ trách  | Học viên trong lớp        | Thời gian học                           |
| :---------------------- | :---------------- | :------------------------ | :-------------------------------------- |
| **BE Basic - Batch 01** | `user1@gmail.com` | `user3`, `user4`, `user5` | `2026-11-01` $\rightarrow$ `2027-01-31` |
| **FE Basic - Batch 01** | `user2@gmail.com` | `user4`, `user5`, `user6` | `2026-11-15` $\rightarrow$ `2027-02-15` |

---

## 7. Danh sách API Endpoints chính

| Nhóm chức năng  | Method                  | Endpoint                                          | Quyền truy cập           | Mô tả                                          |
| :-------------- | :---------------------- | :------------------------------------------------ | :----------------------- | :--------------------------------------------- |
| **Auth**        | `POST`                  | `/auth/register`                                  | Public                   | Đăng ký tài khoản mới (mặc định `MEMBER`)      |
|                 | `POST`                  | `/auth/login`                                     | Public                   | Đăng nhập và nhận JWT `accessToken`            |
|                 | `GET`                   | `/auth/me`                                        | Authenticated            | Lấy thông tin cá nhân đang đăng nhập           |
| **Users**       | `GET / POST`            | `/users`                                          | `ADMIN`                  | Lấy danh sách / Tạo mới người dùng             |
|                 | `GET / PATCH / DELETE`  | `/users/:id`                                      | `ADMIN`                  | Xem chi tiết / Cập nhật / Xóa mềm người dùng   |
| **Classes**     | `GET`                   | `/classes`                                        | Authenticated            | Admin xem tất cả lớp; Member xem lớp tham gia  |
|                 | `POST / PATCH / DELETE` | `/classes`, `/classes/:id`                        | `ADMIN`                  | Tạo, chỉnh sửa, chỉ định Mentor và xóa lớp học |
|                 | `GET / POST / DELETE`   | `/classes/:id/members`                            | `ADMIN` / Member lớp     | Quản lý và xem danh sách học viên trong lớp    |
| **Lessons**     | `GET`                   | `/classes/:classId/lessons`                       | Admin / Member lớp       | Lấy danh sách bài học của lớp                  |
|                 | `POST / PATCH / DELETE` | `/classes/:classId/lessons`, `/lessons/:lessonId` | `ADMIN` / Mentor lớp     | Tạo, cập nhật, xóa bài học                     |
|                 | `POST`                  | `/lessons/:lessonId/complete`                     | Member thuộc lớp         | Đánh dấu hoàn thành bài học                    |
|                 | `GET`                   | `/classes/:classId/progress`                      | Member lớp / Mentor      | Thống kê phần trăm tiến độ học tập             |
| **Assignments** | `GET / POST`            | `/classes/:classId/assignments`                   | Member lớp / Mentor lớp  | Xem danh sách / Tạo bài tập mới cho lớp        |
|                 | `GET / PATCH / DELETE`  | `/assignments/:id`                                | Member lớp / Mentor lớp  | Xem chi tiết / Cập nhật / Xóa bài tập          |
| **Submissions** | `POST / GET`            | `/assignments/:assignmentId/submissions`          | Member lớp / Mentor lớp  | Học viên nộp bài / Xem danh sách bài nộp       |
|                 | `GET`                   | `/submissions/:id`                                | Chủ bài nộp / Mentor lớp | Xem chi tiết bài nộp, điểm và nhận xét         |
|                 | `PATCH`                 | `/submissions/:id/review`                         | `ADMIN` / Mentor lớp     | Chấm điểm (`score`) và nhận xét (`feedback`)   |
