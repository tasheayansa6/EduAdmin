import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const categories = [
  ['Data', 'Working with data and evidence'],
  ['Education', 'Teaching, assessment, and learning design'],
  ['Humanities', 'Writing and critical reading'],
  ['Technology', 'Practical software and programming'],
  ['Research', 'Methods for study and inquiry'],
];

const courses = [
  ['Introduction to Data Analysis', 'Summarize data, read charts, and prepare a short findings brief.', 'Data', 'published'],
  ['Classroom Assessment Basics', 'Plan checks for understanding and give useful feedback.', 'Education', 'published'],
  ['Academic Writing Studio', 'Structure arguments, cite sources, and revise drafts.', 'Humanities', 'published'],
  ['Python for Beginners', 'Write small programs, use functions, and read error messages.', 'Technology', 'published'],
  ['Educational Psychology', 'Apply core ideas about motivation, memory, and learning.', 'Education', 'published'],
  ['Spreadsheets for Administrators', 'Organize records, formulas, and simple operational reports.', 'Technology', 'published'],
  ['Research Methods', 'Frame a question, choose a method, and review evidence.', 'Research', 'draft'],
  ['Digital Literacy', 'Work safely with files, accounts, and online sources.', 'Technology', 'published'],
  ['Learning Design Fundamentals', 'Draft outcomes, activities, and a short course outline.', 'Education', 'draft'],
];

const students = [
  ['Amina Yusuf', 'amina.yusuf@students.test', 'active', 6],
  ['Daniel Okonkwo', 'daniel.okonkwo@students.test', 'active', 5],
  ['Sofia Alvarez', 'sofia.alvarez@students.test', 'active', 5],
  ['Noah Kim', 'noah.kim@students.test', 'active', 4],
  ['Priya Shah', 'priya.shah@students.test', 'active', 4],
  ['Lucas Berger', 'lucas.berger@students.test', 'active', 3],
  ['Fatima Diallo', 'fatima.diallo@students.test', 'active', 3],
  ['Ethan Brooks', 'ethan.brooks@students.test', 'active', 2],
  ['Mei Chen', 'mei.chen@students.test', 'active', 2],
  ['Omar Haddad', 'omar.haddad@students.test', 'active', 6],
  ['Hannah Weber', 'hannah.weber@students.test', 'active', 1],
  ['Jonah Mensah', 'jonah.mensah@students.test', 'active', 1],
  ['Leah Cohen', 'leah.cohen@students.test', 'active', 5],
  ['Mateo Rossi', 'mateo.rossi@students.test', 'active', 4],
  ['Grace Adeyemi', 'grace.adeyemi@students.test', 'active', 2],
  ['Samuel Nwosu', 'samuel.nwosu@students.test', 'suspended', 3],
  ['Ingrid Larsen', 'ingrid.larsen@students.test', 'inactive', 6],
  ['Yusuf Rahman', 'yusuf.rahman@students.test', 'inactive', 4],
];

const roster = [
  ['amina.yusuf@students.test', 'Introduction to Data Analysis', 'active', 45, 1],
  ['amina.yusuf@students.test', 'Python for Beginners', 'completed', 100, 4],
  ['daniel.okonkwo@students.test', 'Classroom Assessment Basics', 'active', 20, 0],
  ['daniel.okonkwo@students.test', 'Educational Psychology', 'active', 60, 2],
  ['sofia.alvarez@students.test', 'Academic Writing Studio', 'completed', 100, 3],
  ['sofia.alvarez@students.test', 'Research Methods', 'active', 10, 0],
  ['noah.kim@students.test', 'Python for Beginners', 'active', 72, 1],
  ['noah.kim@students.test', 'Digital Literacy', 'completed', 100, 5],
  ['priya.shah@students.test', 'Introduction to Data Analysis', 'active', 15, 0],
  ['priya.shah@students.test', 'Spreadsheets for Administrators', 'active', 55, 2],
  ['lucas.berger@students.test', 'Educational Psychology', 'active', 5, 0],
  ['lucas.berger@students.test', 'Classroom Assessment Basics', 'withdrawn', 30, 4],
  ['fatima.diallo@students.test', 'Academic Writing Studio', 'active', 80, 1],
  ['fatima.diallo@students.test', 'Learning Design Fundamentals', 'active', 0, 0],
  ['ethan.brooks@students.test', 'Spreadsheets for Administrators', 'completed', 100, 5],
  ['ethan.brooks@students.test', 'Python for Beginners', 'active', 38, 2],
  ['mei.chen@students.test', 'Digital Literacy', 'active', 64, 1],
  ['mei.chen@students.test', 'Introduction to Data Analysis', 'active', 90, 3],
  ['omar.haddad@students.test', 'Research Methods', 'active', 25, 2],
  ['omar.haddad@students.test', 'Academic Writing Studio', 'completed', 100, 5],
  ['hannah.weber@students.test', 'Classroom Assessment Basics', 'active', 48, 3],
  ['hannah.weber@students.test', 'Educational Psychology', 'active', 12, 0],
  ['jonah.mensah@students.test', 'Python for Beginners', 'active', 8, 1],
  ['jonah.mensah@students.test', 'Digital Literacy', 'active', 50, 4],
  ['leah.cohen@students.test', 'Spreadsheets for Administrators', 'active', 33, 3],
  ['leah.cohen@students.test', 'Introduction to Data Analysis', 'withdrawn', 40, 5],
  ['mateo.rossi@students.test', 'Learning Design Fundamentals', 'active', 18, 1],
  ['mateo.rossi@students.test', 'Educational Psychology', 'completed', 100, 4],
  ['grace.adeyemi@students.test', 'Digital Literacy', 'active', 70, 2],
  ['grace.adeyemi@students.test', 'Academic Writing Studio', 'active', 22, 0],
  ['samuel.nwosu@students.test', 'Python for Beginners', 'active', 14, 3],
  ['ingrid.larsen@students.test', 'Classroom Assessment Basics', 'completed', 100, 5],
  ['yusuf.rahman@students.test', 'Spreadsheets for Administrators', 'active', 28, 4],
];

function monthsAgo(months, day, hour = 10) {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  date.setUTCDate(Math.min(day, 28));
  date.setUTCHours(hour, 15, 0, 0);
  return date;
}

function progressStatus(percent) {
  if (percent >= 100) return 'completed';
  if (percent <= 0) return 'not_started';
  return 'in_progress';
}

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

async function seed() {
  const connection = await connect();
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await connection.query(schema);

  const adminHash = await bcrypt.hash('Admin123!', 10);
  const studentHash = await bcrypt.hash('Student123!', 10);
  const categoryIds = new Map();
  const courseIds = new Map();
  const userIds = new Map();

  try {
    await connection.beginTransaction();

    for (const [name, description] of categories) {
      const [result] = await connection.query(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        [name, description],
      );
      categoryIds.set(name, result.insertId);
    }

    const staff = [
      ['Helena Okoye', 'super@eduadmin.test', adminHash, 'super_admin', 'active', monthsAgo(8, 3)],
    ];
    for (const [name, email, passwordHash, role, status, createdAt] of staff) {
      const [result] = await connection.query(
        `INSERT INTO users (name, email, password_hash, role, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, passwordHash, role, status, createdAt],
      );
      userIds.set(email, result.insertId);
    }

    for (const [name, email, status, age] of students) {
      const [result] = await connection.query(
        `INSERT INTO users (name, email, password_hash, role, status, created_at)
         VALUES (?, ?, ?, 'student', ?, ?)`,
        [name, email, studentHash, status, monthsAgo(age, 8)],
      );
      userIds.set(email, result.insertId);
    }

    for (const [title, description, category, status] of courses) {
      const [result] = await connection.query(
        `INSERT INTO courses (title, description, category_id, status, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description, categoryIds.get(category), status, userIds.get('super@eduadmin.test'), monthsAgo(6, 4)],
      );
      courseIds.set(title, result.insertId);
    }

    for (const [email, title, status, percent, months] of roster) {
      const userId = userIds.get(email);
      const courseId = courseIds.get(title);
      if (!userId || !courseId) {
        throw new Error(`Unknown enrollment: ${email} / ${title}`);
      }
      const enrolledAt = monthsAgo(months, 6 + (userId % 10));
      await connection.query(
        `INSERT INTO enrollments (user_id, course_id, status, enrolled_at) VALUES (?, ?, ?, ?)`,
        [userId, courseId, status, enrolledAt],
      );
      await connection.query(
        `INSERT INTO progress (user_id, course_id, percent, status, updated_at) VALUES (?, ?, ?, ?, ?)`,
        [userId, courseId, percent, progressStatus(percent), enrolledAt],
      );
    }

    const helena = userIds.get('super@eduadmin.test');
    const activity = [
      [helena, 'course.published', 'course', courseIds.get('Python for Beginners'), 'Published Python for Beginners', monthsAgo(5, 9, 11)],
      [helena, 'enrollment.created', 'enrollment', null, 'Amina Yusuf enrolled in Introduction to Data Analysis', monthsAgo(1, 6, 14)],
      [helena, 'student.updated', 'user', userIds.get('samuel.nwosu@students.test'), 'Updated Samuel Nwosu', monthsAgo(0, 4, 16)],
      [helena, 'course.created', 'course', courseIds.get('Research Methods'), 'Created Research Methods', monthsAgo(0, 2, 9)],
      [helena, 'enrollment.updated', 'enrollment', null, 'Sofia Alvarez marked completed in Academic Writing Studio', monthsAgo(0, 8, 13)],
    ];
    for (const [actorId, action, entityType, entityId, details, createdAt] of activity) {
      await connection.query(
        `INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [actorId, action, entityType, entityId, details, createdAt],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }

  console.log('Seed complete.');
  console.log('Super admin    super@eduadmin.test');
  console.log('Password       Admin123!');
}

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
