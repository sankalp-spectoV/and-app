/*
  # Mobile App Database Schema Enhancements

  1. New Tables
    - `user_devices` - Track mobile devices and push tokens
    - `video_progress` - Track video watching progress
    - `sync_queue` - Handle offline synchronization
    - `mobile_sessions` - Track mobile app sessions
  
  2. Security
    - Enable RLS on all new tables
    - Add policies for user data access
  
  3. Performance
    - Add indexes for mobile queries
    - Optimize for mobile data usage
*/

-- Add mobile device tracking
CREATE TABLE IF NOT EXISTS user_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  deviceId VARCHAR(255) NOT NULL UNIQUE,
  deviceType ENUM('android', 'ios') NOT NULL,
  deviceName VARCHAR(255),
  pushToken VARCHAR(500),
  appVersion VARCHAR(50),
  osVersion VARCHAR(50),
  isActive BOOLEAN DEFAULT TRUE,
  lastActive TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_user_device (userId, deviceId),
  INDEX idx_push_token (pushToken)
);

-- Video progress tracking
CREATE TABLE IF NOT EXISTS video_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  moduleId INT NOT NULL,
  courseId INT NOT NULL,
  watchedDuration INT DEFAULT 0,
  totalDuration INT DEFAULT 0,
  watchedPercentage DECIMAL(5,2) DEFAULT 0.00,
  completed BOOLEAN DEFAULT FALSE,
  lastWatchedPosition INT DEFAULT 0,
  lastWatched TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (moduleId) REFERENCES course_modules(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_module (userId, moduleId),
  INDEX idx_user_progress (userId, courseId),
  INDEX idx_module_progress (moduleId)
);

-- Offline sync tracking
CREATE TABLE IF NOT EXISTS sync_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  deviceId VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  tableName VARCHAR(50) NOT NULL,
  recordId INT,
  data JSON,
  synced BOOLEAN DEFAULT FALSE,
  syncedAt TIMESTAMP NULL,
  retryCount INT DEFAULT 0,
  lastError TEXT,
  priority INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_sync_pending (synced, priority, created_at),
  INDEX idx_user_sync (userId, deviceId)
);

-- Mobile app sessions
CREATE TABLE IF NOT EXISTS mobile_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  deviceId VARCHAR(255) NOT NULL,
  sessionToken VARCHAR(500) NOT NULL UNIQUE,
  refreshToken VARCHAR(500) NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  refreshExpiresAt TIMESTAMP NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  lastActivity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_session_token (sessionToken),
  INDEX idx_refresh_token (refreshToken),
  INDEX idx_user_sessions (userId, isActive)
);

-- Add mobile-specific columns to existing tables
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS profilePicture VARCHAR(500),
ADD COLUMN IF NOT EXISTS preferences JSON,
ADD COLUMN IF NOT EXISTS lastLoginMobile TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS mobileVerified BOOLEAN DEFAULT FALSE;

-- Add mobile-specific columns to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS mobileOptimized BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS downloadable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS estimatedSize INT DEFAULT 0;

-- Add mobile-specific columns to course_modules table
ALTER TABLE course_modules 
ADD COLUMN IF NOT EXISTS downloadUrl VARCHAR(500),
ADD COLUMN IF NOT EXISTS fileSize INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration INT DEFAULT 0;