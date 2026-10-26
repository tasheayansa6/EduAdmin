import { readFile } from 'fs/promises';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';
import { assignLessonIds } from '../src/lib/courseDetails.js';
import { AGRI_PROGRAMS, LIVESTOCK_CATEGORY } from './agriPrograms.js';

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
    await connection.query(await readFile(new URL('./blogs.sql', import.meta.url), 'utf8'));
    console.log('Blogs table is ready.');
    await connection.query(await readFile(new URL('./contact.sql', import.meta.url), 'utf8'));
    console.log('Contact tables are ready.');
    await connection.query(await readFile(new URL('./subscriptions.sql', import.meta.url), 'utf8'));
    console.log('Subscription tables are ready.');
    await connection.query(await readFile(new URL('./careers.sql', import.meta.url), 'utf8'));
    console.log('Careers tables are ready.');
    await connection.query(
      `UPDATE contact_info SET email = 'tasheayansa6@gmail.com' WHERE id = 1`,
    );

    const [statusColumn] = await connection.query(
      `SELECT COLUMN_TYPE AS columnType FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'courses' AND COLUMN_NAME = 'status'`,
      [env.db.database],
    );
    if (statusColumn[0] && !String(statusColumn[0].columnType).includes('coming_soon')) {
      await connection.query(
        `ALTER TABLE courses
         MODIFY COLUMN status ENUM('draft', 'published', 'coming_soon') NOT NULL DEFAULT 'draft'`,
      );
      console.log('Added courses.status coming_soon');
    }

    const agriCategories = [
      LIVESTOCK_CATEGORY,
      ['Communications', 'Speaking, media, and audience messaging'],
      ['Media', 'Journalism, production, and digital storytelling'],
      ['Writing', 'Writing craft, editing, and narrative'],
    ];
    for (const [name, description] of agriCategories) {
      await connection.query(
        `INSERT INTO categories (name, description) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [name, description],
      );
    }
    console.log('Categories are ready (including Livestock).');

    const [[livestock]] = await connection.query('SELECT id FROM categories WHERE name = ?', [LIVESTOCK_CATEGORY[0]]);
    if (livestock?.id) {
      const [[admin]] = await connection.query(
        `SELECT id FROM users WHERE role IN ('super_admin', 'admin') ORDER BY id ASC LIMIT 1`,
      );
      for (const program of AGRI_PROGRAMS) {
        const outline = JSON.stringify(assignLessonIds(program.outline));
        const outcomes = JSON.stringify(program.outcomes ?? []);
        const requirements = JSON.stringify(program.requirements ?? []);
        const includes = JSON.stringify(program.includes ?? []);
        const [existing] = await connection.query(
          `SELECT id FROM courses WHERE title = ? AND source_slug IS NULL LIMIT 1`,
          [program.title],
        );
        if (existing[0]) {
          await connection.query(
            `UPDATE courses SET
               subtitle = ?, description = ?, image_url = ?, instructor_name = ?, level = ?, language = ?,
               outcomes = CAST(? AS JSON), requirements = CAST(? AS JSON), includes = CAST(? AS JSON),
               outline = CAST(? AS JSON), category_id = ?, status = ?, price = ?, currency = ?
             WHERE id = ?`,
            [
              program.subtitle, program.description, program.imageUrl, program.instructorName,
              program.level, program.language, outcomes, requirements, includes, outline,
              livestock.id, program.status, program.price, program.currency, existing[0].id,
            ],
          );
        } else {
          await connection.query(
            `INSERT INTO courses
               (title, subtitle, description, image_url, instructor_name, level, language,
                outcomes, requirements, includes, outline, category_id, status, price, currency, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), ?, ?, ?, ?, ?)`,
            [
              program.title, program.subtitle, program.description, program.imageUrl,
              program.instructorName, program.level, program.language,
              outcomes, requirements, includes, outline,
              livestock.id, program.status, program.price, program.currency, admin?.id ?? null,
            ],
          );
        }
      }
      console.log('Livestock agri programs are ready (Cattle Fattening + Coming Soon).');
    }
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
