/** Saves an in-app notification. Pass the transaction connection so it commits with the change it describes. */
export async function notify(executor, userId, { type, title, body = null, link = null }) {
  await executor.query(
    'INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)',
    [userId, type, String(title).slice(0, 160), body ? String(body).slice(0, 500) : null, link],
  );
}

/** Where a student opens a course: AilgAdmin courses by slug, older EduAdmin courses by id. */
/** Tells every active student that a course is now open to them. */
export async function notifyAllStudents(executor, { type, title, body = null, link = null }) {
  await executor.query(
    `INSERT INTO notifications (user_id, type, title, body, link)
     SELECT id, ?, ?, ?, ? FROM users WHERE role = 'student' AND status = 'active'`,
    [type, String(title).slice(0, 160), body ? String(body).slice(0, 500) : null, link],
  );
}

export function courseLink({ source_slug: slug, id }) {
  return slug ? `/learn/courses/${slug}/learn` : `/learn/my-courses/${id}`;
}
