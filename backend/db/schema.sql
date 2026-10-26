SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS lesson_progress;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS career_applications;
DROP TABLE IF EXISTS careers;
DROP TABLE IF EXISTS subscription_deliveries;
DROP TABLE IF EXISTS subscription_campaigns;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS contact_info;
DROP TABLE IF EXISTS blogs;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS progress;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'student') NOT NULL DEFAULT 'student',
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  session_version INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(255) NULL,
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE courses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  subtitle VARCHAR(255) NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500) NULL,
  preview_video_url VARCHAR(500) NULL,
  instructor_name VARCHAR(120) NULL,
  level VARCHAR(40) NULL,
  language VARCHAR(40) NOT NULL DEFAULT 'English',
  total_minutes INT UNSIGNED NULL,
  outcomes JSON NULL,
  requirements JSON NULL,
  includes JSON NULL,
  outline JSON NULL,
  category_id INT UNSIGNED NOT NULL,
  status ENUM('draft', 'published', 'coming_soon') NOT NULL DEFAULT 'draft',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'ETB',
  source_slug VARCHAR(160) NULL,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_courses_source_slug (source_slug),
  CONSTRAINT fk_courses_category FOREIGN KEY (category_id) REFERENCES categories (id),
  CONSTRAINT fk_courses_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  KEY idx_courses_status (status),
  KEY idx_courses_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enrollments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  status ENUM('active', 'completed', 'withdrawn') NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_enrollment (user_id, course_id),
  CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  KEY idx_enrollments_course (course_id),
  KEY idx_enrollments_status (status),
  KEY idx_enrollments_enrolled_at (enrolled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE progress (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progress (user_id, course_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT chk_progress_percent CHECK (percent <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id INT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id INT UNSIGNED NULL,
  details VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL,
  KEY idx_activity_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE blogs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  excerpt VARCHAR(500) NULL,
  body MEDIUMTEXT NOT NULL,
  cover_image_url VARCHAR(500) NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  author_id INT UNSIGNED NULL,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_blogs_slug (slug),
  KEY idx_blogs_status_published (status, published_at),
  CONSTRAINT fk_blogs_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contact_info (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
  organization_name VARCHAR(160) NOT NULL DEFAULT 'EduAdmin Learning',
  headline VARCHAR(255) NULL,
  intro TEXT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(60) NULL,
  whatsapp VARCHAR(60) NULL,
  telegram VARCHAR(120) NULL,
  address_line VARCHAR(255) NULL,
  city VARCHAR(120) NULL,
  region VARCHAR(120) NULL,
  country VARCHAR(120) NULL,
  hours VARCHAR(255) NULL,
  map_url VARCHAR(500) NULL,
  updated_by INT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_contact_singleton CHECK (id = 1),
  CONSTRAINT fk_contact_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contact_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  status ENUM('new', 'read', 'archived') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_contact_messages_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  KEY idx_contact_messages_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subscriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(120) NULL,
  status ENUM('active', 'unsubscribed') NOT NULL DEFAULT 'active',
  source VARCHAR(40) NOT NULL DEFAULT 'web',
  user_id INT UNSIGNED NULL,
  subscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_subscriptions_email (email),
  KEY idx_subscriptions_status (status),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subscription_campaigns (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  recipient_count INT UNSIGNED NOT NULL DEFAULT 0,
  delivered_count INT UNSIGNED NOT NULL DEFAULT 0,
  failed_count INT UNSIGNED NOT NULL DEFAULT 0,
  delivery_mode ENUM('smtp', 'log') NOT NULL DEFAULT 'log',
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscription_campaigns_actor FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subscription_deliveries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT UNSIGNED NOT NULL,
  subscription_id INT UNSIGNED NULL,
  email VARCHAR(255) NOT NULL,
  status ENUM('sent', 'failed', 'logged') NOT NULL,
  error_message VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscription_deliveries_campaign FOREIGN KEY (campaign_id) REFERENCES subscription_campaigns (id) ON DELETE CASCADE,
  CONSTRAINT fk_subscription_deliveries_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE SET NULL,
  KEY idx_subscription_deliveries_campaign (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE careers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  location VARCHAR(180) NULL,
  employment_type VARCHAR(60) NOT NULL DEFAULT 'Full time',
  department VARCHAR(120) NULL,
  summary VARCHAR(500) NULL,
  description MEDIUMTEXT NOT NULL,
  application_email VARCHAR(255) NULL,
  deadline DATE NULL,
  status ENUM('draft', 'open', 'closed') NOT NULL DEFAULT 'draft',
  created_by INT UNSIGNED NULL,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_careers_slug (slug),
  KEY idx_careers_status (status, published_at),
  CONSTRAINT fk_careers_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE career_applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  career_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(60) NULL,
  cover_letter TEXT NOT NULL,
  resume_url VARCHAR(500) NULL,
  status ENUM('new', 'reviewed', 'shortlisted', 'rejected', 'hired') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_career_applications_career FOREIGN KEY (career_id) REFERENCES careers (id) ON DELETE CASCADE,
  CONSTRAINT fk_career_applications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  KEY idx_career_applications_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
