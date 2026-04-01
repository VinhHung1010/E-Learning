# E-Learning API - Chức năng 1: Quản lý Người dùng

## Mô tả
API cho chức năng Quản lý Người dùng (users) trong hệ thống E-Learning.

## Tính năng
- Đăng ký tài khoản mới
- Đăng nhập với JWT token
- Xem thông tin cá nhân
- Admin: Xem danh sách tất cả người dùng
- Admin: Cập nhật thông tin người dùng
- Admin: Xóa người dùng

## Cài đặt
```bash
npm install
```

## Khởi tạo Database
1. Mở phpMyAdmin (http://localhost/phpmyadmin)
2. Import file `database/setup.sql`
3. Hoặc chạy trực tiếp: `mysql -u root -p < database/setup.sql`

## Chạy Server
```bash
npm start
# Hoặc chế độ development:
npm run dev
```

## API Endpoints

### Authentication
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | /api/users/register | Đăng ký tài khoản mới |
| POST | /api/users/login | Đăng nhập |
| GET | /api/users/profile | Xem thông tin cá nhân (cần token) |

### Admin Routes (cần token của admin)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | /api/users | Danh sách tất cả người dùng |
| GET | /api/users/:id | Xem chi tiết người dùng |
| PUT | /api/users/:id | Cập nhật người dùng |
| DELETE | /api/users/:id | Xóa người dùng |

## Ví dụ sử dụng

### Đăng ký
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Nguyen Van A", "email": "admin@example.com", "password": "123456"}'
```

### Đăng nhập
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "123456"}'
```

### Lấy thông tin cá nhân
```bash
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Cấu trúc Project
```
elearning-api/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── userRoutes.js
│   └── server.js
├── database/
│   └── setup.sql
├── .env
├── package.json
└── README.md
```

## Environment Variables
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=elearning
JWT_SECRET=your_secret_key
```
