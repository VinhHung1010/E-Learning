-- Database Setup Script for E-Learning
-- Run this script in phpMyAdmin or MySQL CLI

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS elearning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elearning;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student','admin') DEFAULT 'student',
  is_active TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  category_id INT,
  price DECIMAL(10,2) DEFAULT 0,
  thumbnail TEXT NULL,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_average_rating (average_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT,
  title VARCHAR(255),
  content TEXT,
  video_url VARCHAR(255),
  position INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Progress tracking table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id INT NOT NULL,
  is_completed TINYINT(1) DEFAULT 0,
  progress_percent INT DEFAULT 0,
  last_position INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  UNIQUE KEY unique_user_lesson (user_id, lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Course reviews table
CREATE TABLE IF NOT EXISTS course_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  course_id INT,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending','active') DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wishlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_course_wishlist (user_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  type VARCHAR(50) DEFAULT 'system',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- Insert sample categories
INSERT INTO categories (name) VALUES 
('Lập trình'),
('Marketing'),
('Kinh doanh'),
('Kỹ năng mềm'),
('Học để giỏi'),
('Máy tính cơ bản');

-- Insert sample courses
INSERT INTO courses (title, description, category_id, price) VALUES 
('JavaScript Cơ Bản', 'Khóa học JavaScript từ cơ bản đến nâng cao', 1, 0),
('HTML & CSS', 'Xây dựng giao diện web với HTML và CSS', 1, 0),
('Node.js Backend', 'Lập trình Backend với Node.js', 1, 299000),
('Marketing Online', 'Chiến lược marketing hiệu quả trên mạng xã hội', 2, 199000);

-- Insert sample lessons
INSERT INTO lessons (course_id, title, content, video_url, position) VALUES 
(1, 'Bài 1: Giới thiệu JavaScript', 'JavaScript là ngôn ngữ lập trình phổ biến nhất thế giới.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1),
(1, 'Bài 2: Biến và Kiểu dữ liệu', 'Tìm hiểu về var, let, const và các kiểu dữ liệu.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2),
(1, 'Bài 3: Toán tử', 'Các toán tử số học, so sánh và logic.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 3),
(1, 'Bài 4: Câu lệnh điều kiện', 'If else và switch case.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 4),
(1, 'Bài 5: Vòng lặp', 'For, while và do-while.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5),
(2, 'Bài 1: HTML cơ bản', 'Cấu trúc cơ bản của một trang web HTML.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1),
(2, 'Bài 2: CSS cơ bản', 'Styling cho trang web với CSS.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2),
(2, 'Bài 3: Flexbox', 'Bố cục linh hoạt với Flexbox.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 3),
(3, 'Bài 1: Giới thiệu Node.js', 'Tổng quan về Node.js và npm.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1),
(3, 'Bài 2: Express.js', 'Xây dựng web server với Express.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2),
(3, 'Bài 3: REST API', 'Thiết kế và xây dựng REST API.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 3),
(4, 'Bài 1: Marketing Online là gì?', 'Tổng quan về marketing trực tuyến.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1),
(4, 'Bài 2: SEO cơ bản', 'Tối ưu hóa công cụ tìm kiếm.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2);

-- Insert sample admin user (password: admin123)
INSERT INTO users (name, email, password, role, is_active) VALUES 
('Admin', 'admin@elearning.com', '$2a$10$6ytEzFDrScmCqy7b7tEXnelQtRXDCdOasovKBrp290r5jYqf9/3BS', 'admin', 1);
