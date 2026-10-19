export function likePattern(value) {
  const escaped = value.replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
}

export function likeClause(column) {
  return `${column} LIKE ? ESCAPE '\\\\'`;
}

export function toPage(data, total, page, limit) {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
