import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

import { AGRI_PROGRAMS, LIVESTOCK_CATEGORY } from './agriPrograms.js';
import { assignLessonIds } from '../src/lib/courseDetails.js';

/** Categories + livestock agri programs (Ailg-aligned). No fake students. */
const categories = [
  LIVESTOCK_CATEGORY,
  ['Communications', 'Speaking, media, and audience messaging'],
  ['Media', 'Journalism, production, and digital storytelling'],
  ['Writing', 'Writing craft, editing, and narrative'],
  ['Education', 'Teaching, assessment, and learning design'],
  ['Research', 'Methods for study and inquiry'],
];

async function connect() {
  for (let attempt = 1; attempt <= 15; attempt += 1) {
    try {
      return await mysql.createConnection({
        ...env.db,
        multipleStatements: true,
        timezone: 'Z',
        charset: 'utf8mb4',
      });
    } catch (error) {
      if (attempt === 15) throw error;
      console.log(`Waiting for MySQL (${attempt}/15)...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  return null;
}

/**
 * Rebuilds the schema and creates only the super admin plus empty categories.
 * Does not invent students, courses, enrollments, or progress.
 */
async function seed() {
  const connection = await connect();
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await connection.query(schema);
  await connection.query(await readFile(new URL('./store.sql', import.meta.url), 'utf8'));

  const adminHash = await bcrypt.hash('Admin123!', 10);

  try {
    await connection.beginTransaction();

    for (const [name, description] of categories) {
      await connection.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
    }

    const [adminResult] = await connection.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, 'super_admin', 'active')`,
      ['Administrator', 'super@eduadmin.test', adminHash],
    );
    const adminId = adminResult.insertId;
    const [[livestock]] = await connection.query('SELECT id FROM categories WHERE name = ?', [LIVESTOCK_CATEGORY[0]]);

    for (const program of AGRI_PROGRAMS) {
      const outline = JSON.stringify(assignLessonIds(program.outline));
      await connection.query(
        `INSERT INTO courses
           (title, subtitle, description, image_url, instructor_name, level, language,
            outcomes, requirements, includes, outline, category_id, status, price, currency, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), ?, ?, ?, ?, ?)`,
        [
          program.title, program.subtitle, program.description, program.imageUrl,
          program.instructorName, program.level, program.language,
          JSON.stringify(program.outcomes ?? []),
          JSON.stringify(program.requirements ?? []),
          JSON.stringify(program.includes ?? []),
          outline,
          livestock.id, program.status, program.price, program.currency, adminId,
        ],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }

  console.log('Seed complete (admin + Livestock agri programs).');
  console.log('Super admin    super@eduadmin.test');
  console.log('Password       Admin123!');
}

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
