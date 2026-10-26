CREATE TABLE IF NOT EXISTS careers (
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

CREATE TABLE IF NOT EXISTS career_applications (
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

UPDATE contact_info
SET email = 'tasheayansa6@gmail.com'
WHERE id = 1 AND (email IS NULL OR email LIKE '%@eduadmin.test' OR email = '');
