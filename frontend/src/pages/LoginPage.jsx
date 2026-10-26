import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { homePath } from '../auth/ProtectedRoutes.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fieldErrors } from '../lib/format.js';
import { validateLogin } from '../lib/validate.js';
import { Mark } from '../components/icons.jsx';
import { Field, PasswordInput, TextInput } from '../components/ui.jsx';

function safeNextPath(raw, role) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('://')) {
    return homePath({ role });
  }
  if (role === 'student') {
    return raw.startsWith('/learn') ? raw : '/learn';
  }
  if (raw.startsWith('/learn') || raw.startsWith('/login') || raw.startsWith('/register')) {
    return '/';
  }
  return raw;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

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
      const account = await login(form.email.trim(), form.password);
      navigate(safeNextPath(params.get('next'), account.role), { replace: true });
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
          <p className="mt-4 max-w-md text-base text-slate-300">Students review their courses and progress. Administrators manage the academic record.</p>
        </div>
        <p className="text-sm text-slate-400">Use the account that matches your role.</p>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm" noValidate>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Mark />
            <span className="text-lg font-semibold">EduAdmin</span>
          </div>
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-2 text-sm text-ink-muted">Students open their learning page. Administrators open the dashboard.</p>
          {formError ? <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">{formError}</p> : null}
          <div className="mt-6 space-y-4">
            <Field id="email" label="Email" error={errors.email}>
              <TextInput id="email" name="email" type="email" autoComplete="username" value={form.email} onChange={update} error={errors.email} />
            </Field>
            <Field id="password" label="Password" error={errors.password}>
              <PasswordInput id="password" name="password" autoComplete="current-password" value={form.password} onChange={update} error={errors.password} />
            </Field>
          </div>
          <button type="submit" className="btn-primary mt-6 w-full" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="mt-4 text-sm text-ink-muted">
            New student? <Link to="/register" className="font-semibold text-accent hover:text-accent-hover">Create an account</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
