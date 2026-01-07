

CREATE DATABASE IF NOT EXISTS zenvy_db;
USE zenvy_db;

CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'HR', 'Employee') DEFAULT 'Employee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  UNIQUE KEY unique_email_per_company (email, company_id)
);

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('Present', 'Absent', 'Leave') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_attendance (company_id, user_id, date)
);

CREATE TABLE salary_components (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  basic DECIMAL(10, 2) NOT NULL DEFAULT 0,
  allowances DECIMAL(10, 2) NOT NULL DEFAULT 0,
  deductions DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_salary (company_id, user_id)
);

CREATE TABLE payroll (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  month VARCHAR(7) NOT NULL, -- format: YYYY-MM
  net_salary DECIMAL(10, 2) NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_payroll (company_id, user_id, month)
);

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  action TEXT NOT NULL,
  performed_by INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (performed_by) REFERENCES users(id)
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_attendance_company_user ON attendance(company_id, user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_salary_company_user ON salary_components(company_id, user_id);
CREATE INDEX idx_payroll_company_user ON payroll(company_id, user_id);
CREATE INDEX idx_payroll_month ON payroll(month);
CREATE INDEX idx_audit_company ON audit_logs(company_id);

INSERT INTO companies (name) VALUES ('Test Company Inc');

INSERT INTO users (company_id, name, email, password_hash, role) 
VALUES (1, 'Admin User', 'admin@test.com', '$2b$10$XQZqW8k7YqVq7.8Qq9K8p.VqO4CqW8k7YqVq7.8Qq9K8p.VqO4Cq', 'HR');