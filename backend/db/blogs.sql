CREATE TABLE IF NOT EXISTS blogs (
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
