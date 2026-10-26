const TOKEN_KEY = 'eduadmin.token';

let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = 'GET', body, timeoutMs = 20000 } = {}) {
  const token = getToken();
  let response;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller && timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    response = await fetch(path, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller?.signal,
    });
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    const next = new Error(timedOut
      ? 'The server is taking too long to respond. Try again in a moment.'
      : 'Cannot reach the server. Check your connection and try again.');
    next.status = 0;
    throw next;
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && !path.includes('/auth/login')) onUnauthorized();
    const error = new Error(payload.message || 'The request could not be completed.');
    error.status = response.status;
    error.errors = payload.errors;
    throw error;
  }

  return payload;
}

export function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}` !== '') {
      search.set(key, String(value));
    }
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}
