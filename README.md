# E-Learning Platform

Hệ thống học trực tuyến (E-Learning) được xây dựng bằng Node.js (Backend API) và HTML/CSS/JS (Frontend).

## Cấu trúc dự án

```
E-Learning/
├── elearning-api/          # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Auth middleware
│   │   └── server.js       # Server entry point
│   └── package.json
└── frontend/               # Frontend (HTML/CSS/JS)
    ├── css/
    ├── js/
    └── *.html              # Pages
```

## Yêu cầu hệ thống

- Node.js >= 14.x
- MySQL 5.7+
- XAMPP (hoặc MySQL server tương đương)

## Cài đặt

### 1. Backend API

```bash
cd elearning-api
npm install
```

Tạo file `.env` trong thư mục `elearning-api/`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=elearning
JWT_SECRET=your_secret_key_here
```

Chạy server:

```bash
npm start
```

API sẽ chạy tại: http://localhost:3000/api

### 2. Frontend

Frontend được phục vụ qua XAMPP Apache. Truy cập:

```
http://localhost/E-Learning/frontend/
```

Hoặc mở file `index.html` trực tiếp trong trình duyệt.

## Tính năng

### Người dùng
- Đăng ký / Đăng nhập
- Xem danh sách khóa học
- Tìm kiếm & lọc khóa học
- Đăng ký khóa học
- Xem khóa học đã đăng ký

### Quản trị (Admin)
- Quản lý người dùng
- Quản lý danh mục
- Quản lý khóa học
- Quản lý bài học
- Quản lý đăng ký

## API Endpoints

### Người dùng
- `POST /api/users/register` - Đăng ký
- `POST /api/users/login` - Đăng nhập
- `GET /api/users/profile` - Thông tin cá nhân (cần auth)

### Danh mục
- `GET /api/categories` - Danh sách danh mục
- `GET /api/categories/:id` - Chi tiết danh mục

### Khóa học
- `GET /api/courses` - Danh sách khóa học
- `GET /api/courses/featured` - Khóa học nổi bật
- `GET /api/courses/:id` - Chi tiết khóa học

### Bài học
- `GET /api/lessons/course/:courseId` - Bài học theo khóa

### Đăng ký
- `GET /api/enrollments/my-courses` - Khóa học của tôi
- `POST /api/enrollments` - Đăng ký khóa học

## Database Schema

Sử dụng MySQL với các bảng:
- `users` - Người dùng
- `categories` - Danh mục
- `courses` - Khóa học
- `lessons` - Bài học
- `enrollments` - Đăng ký khóa học

## License

MIT License
