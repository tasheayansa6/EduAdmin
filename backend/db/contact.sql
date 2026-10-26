CREATE TABLE IF NOT EXISTS contact_info (
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

INSERT INTO contact_info (id, organization_name, headline, intro, email, phone, hours)
VALUES (
  1,
  'EduAdmin Learning',
  'Contact us',
  'Questions about courses, enrollments, or your account? Reach the learning team using the details below or send a message.',
  'tasheayansa6@gmail.com',
  '+251 11 000 0000',
  'Mon–Fri, 9:00–17:00 EAT'
)
ON DUPLICATE KEY UPDATE id = id;

CREATE TABLE IF NOT EXISTS contact_messages (
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
