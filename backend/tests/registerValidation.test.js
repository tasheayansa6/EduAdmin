import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { validateLogin, validateRegister } from '../../frontend/src/lib/validate.js';

describe('Registration form validation', () => {
  test('accepts a complete student registration', () => {
    const errors = validateRegister({
      name: 'Amina Yusuf',
      email: 'amina@students.test',
      password: 'Student123!',
      confirmPassword: 'Student123!',
    });
    assert.deepEqual(errors, {});
  });

  test('reports missing fields, a weak password, and a mismatch', () => {
    const errors = validateRegister({
      name: 'A',
      email: 'not-an-email',
      password: 'password',
      confirmPassword: 'other',
    });
    assert.equal(errors.name, 'Enter at least 2 characters.');
    assert.equal(errors.email, 'Enter a valid email address.');
    assert.match(errors.password, /letter and a number/);
    assert.equal(errors.confirmPassword, 'Passwords do not match.');
  });

  test('login requires an email and a password before the request', () => {
    const errors = validateLogin({ email: '', password: '' });
    assert.ok(errors.email);
    assert.ok(errors.password);
  });
});