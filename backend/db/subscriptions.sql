CREATE TABLE IF NOT EXISTS subscriptions (
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

CREATE TABLE IF NOT EXISTS subscription_campaigns (
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

CREATE TABLE IF NOT EXISTS subscription_deliveries (
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
