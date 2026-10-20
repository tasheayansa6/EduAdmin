import { env } from '../config/env.js';
import { AppError } from './errors.js';

const unavailable = () => new AppError(502, 'The course catalog is unavailable right now. Try again shortly.');

async function fetchCatalog(path) {
  let response;
  try {
    response = await fetch(`${env.ailgApiUrl}/api/v1/public${path}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw unavailable();
  }
  if (response.status === 404) return null;
  if (!response.ok) throw unavailable();
  const payload = await response.json().catch(() => null);
  if (!payload || !('data' in payload)) throw unavailable();
  return payload.data;
}

/** Published AilgAdmin courses (summary fields only). */
export async function listCatalogCourses() {
  return (await fetchCatalog('/courses')) ?? [];
}

/** One published course with description, outcomes, and curriculum, or null when it is not published. */
export function getCatalogCourse(slug) {
  return fetchCatalog(`/courses/${encodeURIComponent(slug)}`);
}

/** Every lesson with its video or text. Only call this after checking the student is enrolled. */
export async function getCourseContent(slug) {
  if (!env.ailgPartnerKey) throw new AppError(503, 'Course lessons are not connected yet. Ask an administrator to finish the setup.');
  let response;
  try {
    response = await fetch(`${env.ailgApiUrl}/api/v1/partner/courses/${encodeURIComponent(slug)}/content`, {
      headers: { Accept: 'application/json', 'X-Partner-Key': env.ailgPartnerKey },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw unavailable();
  }
  if (response.status === 404) return null;
  if (!response.ok) throw unavailable();
  const payload = await response.json().catch(() => null);
  if (!payload?.data?.sections) throw unavailable();
  return payload.data;
}
