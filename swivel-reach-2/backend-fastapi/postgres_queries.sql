-- PostgreSQL Database Schema Creation Queries
-- Employee Work Tracking System

-- 1. Create Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- Seed basic roles
INSERT INTO roles (name, description) VALUES 
('admin', 'Full access to manage employees, assign tasks, and view reports'),
('employee', 'Access to view assigned tasks, update progress, and submit daily updates')
ON CONFLICT (name) DO NOTHING;

-- 2. Create Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee',
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Employees table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    date_of_joining VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Create Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    assigned_to VARCHAR(100),
    priority VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high'
    due_date VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignee FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL
);

-- 5. Create Task Updates table
CREATE TABLE IF NOT EXISTS task_updates (
    id VARCHAR(100) PRIMARY KEY,
    task_id VARCHAR(100) NOT NULL,
    employee_id VARCHAR(100) NOT NULL,
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments TEXT NOT NULL,
    progress_percentage INTEGER NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    attachment_name VARCHAR(255),
    attachment_size VARCHAR(50),
    attachment_data TEXT, -- Base64 encoded or S3 URL
    CONSTRAINT fk_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 6. Indexes for Performance Optimization
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_updates_task_id ON task_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_task_updates_employee_id ON task_updates(employee_id);

-- 7. Basic queries for dashboard stats
-- Total Employees
SELECT COUNT(*) FROM employees WHERE status = 'active';

-- Task status counts
SELECT status, COUNT(*) FROM tasks GROUP BY status;

-- Employee progress overview
SELECT e.name, COUNT(t.id) as total_tasks, 
       SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
FROM employees e
LEFT JOIN tasks t ON e.id = t.assigned_to
GROUP BY e.id, e.name;
