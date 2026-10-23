import { readFile } from 'fs/promises';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

/** Adds the store tables and the AilgAdmin course link to an existing database. Never drops data. */
async function migrate() {
  const connection = await mysql.createConnection({ ...env.db, multipleStatements: true, timezone: 'Z', charset: 'utf8mb4' });
  try {
    const [columns] = await connection.query(
      `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'courses' AND COLUMN_NAME = 'source_slug'`,
      [env.db.database],
    );
    if (!Number(columns[0].total)) {
      await connection.query('ALTER TABLE courses ADD COLUMN source_slug VARCHAR(160) NULL, ADD UNIQUE KEY uq_courses_source_slug (source_slug)');
      console.log('Added courses.source_slug');
    }
    const [priceColumns] = await connection.query(
      `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'courses' AND COLUMN_NAME = 'price'`,
      [env.db.database],
    );
    if (!Number(priceColumns[0].total)) {
      await connection.query(
        `ALTER TABLE courses
         ADD COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER status,
         ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'ETB' AFTER price`,
      );
      console.log('Added courses.price and courses.currency');
    }
    const [detailColumns] = await connection.query(
      `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'courses' AND COLUMN_NAME = 'subtitle'`,
      [env.db.database],
    );
    if (!Number(detailColumns[0].total)) {
      await connection.query(
        `ALTER TABLE courses
         ADD COLUMN subtitle VARCHAR(255) NULL AFTER title,
         ADD COLUMN image_url VARCHAR(500) NULL AFTER description,
         ADD COLUMN preview_video_url VARCHAR(500) NULL AFTER image_url,
         ADD COLUMN instructor_name VARCHAR(120) NULL AFTER preview_video_url,
         ADD COLUMN level VARCHAR(40) NULL AFTER instructor_name,
         ADD COLUMN language VARCHAR(40) NOT NULL DEFAULT 'English' AFTER level,
         ADD COLUMN total_minutes INT UNSIGNED NULL AFTER language,
         ADD COLUMN outcomes JSON NULL AFTER total_minutes,
         ADD COLUMN requirements JSON NULL AFTER outcomes,
         ADD COLUMN includes JSON NULL AFTER requirements,
         ADD COLUMN outline JSON NULL AFTER includes`,
      );
      console.log('Added courses detail fields for the student course page');
    }
    await connection.query(await readFile(new URL('./store.sql', import.meta.url), 'utf8'));
    console.log('Store tables are ready.');

    const communicationsCategories = [
      ['Communications', 'Speaking, media, and audience messaging'],
      ['Media', 'Journalism, production, and digital storytelling'],
      ['Writing', 'Writing craft, editing, and narrative'],
    ];
    for (const [name, description] of communicationsCategories) {
      await connection.query(
        `INSERT INTO categories (name, description) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [name, description],
      );
    }
    console.log('Communications categories are ready.');
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
