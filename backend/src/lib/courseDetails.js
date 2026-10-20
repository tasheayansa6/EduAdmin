/** Parses JSON columns that may arrive as strings from MySQL. */
export function parseJson(value, fallback = null) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function asStringList(value) {
  const list = parseJson(value, []);
  if (!Array.isArray(list)) return [];
  return list.map((item) => String(item).trim()).filter(Boolean).slice(0, 40);
}

export function asOutline(value) {
  const sections = parseJson(value, []);
  if (!Array.isArray(sections)) return [];
  return sections.slice(0, 40).map((section) => ({
    title: String(section?.title || 'Section').slice(0, 160),
    lessons: Array.isArray(section?.lessons)
      ? section.lessons.slice(0, 80).map((lesson) => ({
        title: String(lesson?.title || 'Lesson').slice(0, 180),
        durationMinutes: lesson?.durationMinutes == null || lesson.durationMinutes === ''
          ? null
          : Math.max(0, Math.min(24 * 60, Number(lesson.durationMinutes) || 0)),
        type: String(lesson?.type || 'lesson').slice(0, 40),
        isPreview: Boolean(lesson?.isPreview),
      }))
      : [],
  })).filter((section) => section.lessons.length || section.title);
}

/** Turns newline text from the admin form into a string list. */
export function linesToList(text) {
  if (text == null) return [];
  return String(text).split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 40);
}

/**
 * Outline editor format:
 * ## Section title
 * - Lesson title (10)
 * - Another lesson
 */
export function textToOutline(text) {
  if (!text || !String(text).trim()) return [];
  const sections = [];
  let current = null;
  for (const raw of String(text).split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      current = { title: line.slice(3).trim().slice(0, 160) || 'Section', lessons: [] };
      sections.push(current);
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (!bullet) continue;
    if (!current) {
      current = { title: 'Course content', lessons: [] };
      sections.push(current);
    }
    const body = bullet[1].trim();
    const timed = body.match(/^(.*?)\s*\((\d+)\s*m(?:in(?:utes)?)?\)$/i);
    current.lessons.push(timed
      ? { title: timed[1].trim().slice(0, 180), durationMinutes: Number(timed[2]), type: 'lesson', isPreview: false }
      : { title: body.slice(0, 180), durationMinutes: null, type: 'lesson', isPreview: false });
  }
  return asOutline(sections);
}

export function outlineToText(sections) {
  const list = asOutline(sections);
  if (!list.length) return '';
  return list.map((section) => {
    const lessons = section.lessons.map((lesson) => (
      lesson.durationMinutes
        ? `- ${lesson.title} (${lesson.durationMinutes})`
        : `- ${lesson.title}`
    ));
    return [`## ${section.title}`, ...lessons].join('\n');
  }).join('\n\n');
}

export function totalMinutesFromOutline(sections) {
  return asOutline(sections).reduce(
    (sum, section) => sum + section.lessons.reduce((acc, lesson) => acc + (lesson.durationMinutes || 0), 0),
    0,
  ) || null;
}
