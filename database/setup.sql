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
