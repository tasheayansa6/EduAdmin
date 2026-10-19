export function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatMonth(key) {
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit' }).format(new Date(year, month - 1, 1));
}

export function statusLabel(status) {
  return String(status).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function roleLabel(role) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  return 'Student';
}

export function fieldErrors(error) {
  const fields = {};
  for (const item of error?.errors || []) {
    if (item.field) fields[item.field] = item.message;
  }
  return fields;
}
