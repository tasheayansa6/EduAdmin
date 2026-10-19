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
  return errors;
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
