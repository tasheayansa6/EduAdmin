export async function logActivity(executor, entry) {
  await executor.query(
    `INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      entry.actorId,
      entry.action,
      entry.entityType,
      entry.entityId ?? null,
      entry.details ?? null,
      entry.createdAt ?? new Date(),
    ],
  );
}
