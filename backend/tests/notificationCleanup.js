/**
 * Remembers the newest notification id so a test file can delete the notifications it caused.
 * Some admin tests act on whichever enrollment comes first, so this covers every account.
 */
export async function trackNotifications(pool) {
  const [[row]] = await pool.query('SELECT COALESCE(MAX(id), 0) AS id FROM notifications');
  return async () => {
    await pool.query('DELETE FROM notifications WHERE id > ?', [row.id]);
  };
}
