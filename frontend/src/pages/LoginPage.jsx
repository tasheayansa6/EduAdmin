import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fieldErrors } from '../lib/format.js';
import { validateLogin } from '../lib/validate.js';
import { Mark } from '../components/icons.jsx';
import { Field, TextInput } from '../components/ui.jsx';

export function LoginPage() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFormError('');
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validateLogin(form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    try {
      await login(form.email.trim(), form.password);
    } catch (error) {
      const fields = fieldErrors(error);
      if (Object.keys(fields).length) setErrors(fields);
      setFormError(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Mark />
          <span className="text-lg font-semibold">EduAdmin</span>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-semibold leading-tight">One place to run the learning platform.</h1>
          <p className="mt-4 max-w-md text-base text-slate-300">Students, courses, enrollments, and progress, kept current for administrators.</p>
        </div>
        <p className="text-sm text-slate-400">Authorized administrators only.</p>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm" noValidate>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Mark />
            <span className="text-lg font-semibold">EduAdmin</span>
          </div>
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-2 text-sm text-ink-muted">Use your administrator account to open the dashboard.</p>
          {formError ? <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">{formError}</p> : null}
          <div className="mt-6 space-y-4">
            <Field id="email" label="Email" error={errors.email}>
              <TextInput id="email" name="email" type="email" autoComplete="username" value={form.email} onChange={update} error={errors.email} />
            </Field>
            <Field id="password" label="Password" error={errors.password}>
              <TextInput id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={update} error={errors.password} />
            </Field>
          </div>
          <button type="submit" className="btn-primary mt-6 w-full" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  );
}
