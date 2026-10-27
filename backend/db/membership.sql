CREATE TABLE IF NOT EXISTS membership_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  eyebrow VARCHAR(80) NOT NULL DEFAULT 'AILG membership',
  headline VARCHAR(255) NOT NULL DEFAULT 'Join the membership',
  intro TEXT NULL,
  cta_label VARCHAR(80) NOT NULL DEFAULT 'Join membership',
  cta_url VARCHAR(500) NOT NULL DEFAULT 'https://test.ailgagro.com/#membership',
  updated_by INT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_membership_singleton CHECK (id = 1),
  CONSTRAINT fk_membership_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO membership_settings (id, enabled, eyebrow, headline, intro, cta_label, cta_url)
VALUES (
  1,
  1,
  'AILG membership',
  'Join the membership',
  'Mentorship, academy access, and field programs from Agricultural Leadership & Investment Group.',
  'Join membership',
  'https://test.ailgagro.com/#membership'
)
ON DUPLICATE KEY UPDATE id = id;

CREATE TABLE IF NOT EXISTS membership_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(60) NULL,
  organization VARCHAR(180) NULL,
  message TEXT NULL,
  status ENUM('new', 'reviewing', 'approved', 'rejected') NOT NULL DEFAULT 'new',
  admin_notes TEXT NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_membership_requests_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  KEY idx_membership_requests_status (status, created_at),
  KEY idx_membership_requests_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
