const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(input) {
  const errors = {};
  if (!emailPattern.test(input.email.trim())) errors.email = 'Enter a valid email address.';
  if (!input.password) errors.password = 'Enter your password.';
  return errors;
}

export function validatePerson(input) {
  const errors = {};
  if (input.name.trim().length < 2) errors.name = 'Enter at least 2 characters.';
  if (input.email !== undefined && !emailPattern.test(input.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  return errors;
}

export function validateCourse(input) {
  const errors = {};
  if (input.title.trim().length < 3) errors.title = 'Enter a title of at least 3 characters.';
  if (input.description.trim().length < 10) errors.description = 'Enter a description of at least 10 characters.';
  if (!input.categoryId) errors.categoryId = 'Choose a category.';
  if (!['draft', 'published'].includes(input.status)) errors.status = 'Choose a status.';
  if (input.price !== undefined && input.price !== '') {
    const price = Number(input.price);
    if (!Number.isFinite(price) || price < 0) errors.price = 'Enter a price of 0 or more.';
  }
  if (input.currency !== undefined && String(input.currency).trim().length !== 3) {
    errors.currency = 'Use a 3-letter currency code.';
  }
  for (const [key, label] of [['imageUrl', 'cover image'], ['previewVideoUrl', 'preview video']]) {
    const value = String(input[key] || '').trim();
    if (value && !/^https?:\/\//i.test(value)) errors[key] = `Enter a full ${label} address starting with http:// or https://.`;
  }
  return errors;
}

/** One item per line for outcomes / requirements / includes. */
export function linesToList(text) {
  return String(text || '').split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 40);
}

/** Admin outline editor: ## Section then - Lesson (minutes). */
export function textToOutline(text) {
  const sections = [];
  let current = null;
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      current = { title: line.slice(3).trim() || 'Section', lessons: [] };
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
      ? { title: timed[1].trim(), durationMinutes: Number(timed[2]), type: 'lesson', isPreview: false }
      : { title: body, durationMinutes: null, type: 'lesson', isPreview: false });
  }
  return sections;
}

export function validateEnrollment(input) {
  const errors = {};
  if (!input.userId) errors.userId = 'Choose a student.';
  if (!input.courseId) errors.courseId = 'Choose a course.';
  return errors;
}

export function validatePassword(password) {
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Use at least 8 characters, with a letter and a number.';
  }
  if (password.length > 72) return 'Use at most 72 characters.';
  return '';
}

export function validateRegister(input) {
  const errors = {};
  if (input.name.trim().length < 2) errors.name = 'Enter at least 2 characters.';
  if (!emailPattern.test(input.email.trim())) errors.email = 'Enter a valid email address.';
  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;
  if (!input.confirmPassword) errors.confirmPassword = 'Confirm your password.';
  else if (input.password !== input.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}
