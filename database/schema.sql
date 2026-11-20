CREATE DATABASE IF NOT EXISTS studyflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE studyflow;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  subject VARCHAR(80) NOT NULL DEFAULT 'General',
  due_date DATE NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tasks_user_due (user_id, due_date),
  INDEX idx_tasks_user_status (user_id, status)
);

-- Demo profile used by the unauthenticated starter API.
INSERT INTO users (id, name, email, password_hash)
VALUES (1, 'Ronak & Kavish', 'ronak.kavish@example.com', 'demo-no-login')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO tasks (user_id, title, description, subject, due_date, priority, status) VALUES
(1, 'Research paper: Climate & cities', 'Find sources and draft the first version.', 'Environmental Science', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'high', 'in_progress'),
(1, 'Calculus problem set 08', 'Complete questions 1–12.', 'Mathematics', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'high', 'pending'),
(1, 'Read chapter 6: The Great Gatsby', 'Read and make notes on key themes.', 'Literature', DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'medium', 'pending'),
(1, 'Chemistry lab report', 'Write up results and submit the report.', 'Chemistry', DATE_ADD(CURDATE(), INTERVAL 6 DAY), 'low', 'completed');
