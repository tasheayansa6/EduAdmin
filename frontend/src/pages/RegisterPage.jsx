import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fieldErrors } from '../lib/format.js';
import { validateRegister } from '../lib/validate.js';
import { Mark } from '../components/icons.jsx';
import { Field, PasswordInput, TextInput } from '../components/ui.jsx';

const empty = { name: '', email: '', password: '', confirmPassword: '' };

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
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
    const nextErrors = validateRegister(form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      navigate('/learn', { replace: true });
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
          <h1 className="max-w-md text-4xl font-semibold leading-tight">Create your student account.</h1>
          <p className="mt-4 max-w-md text-base text-slate-300">Registration opens a student record. It cannot create an administrator.</p>
        </div>
        <p className="text-sm text-slate-400">An administrator enrolls you in courses after your account exists.</p>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm" noValidate>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Mark />
            <span className="text-lg font-semibold">EduAdmin</span>
          </div>
          <h2 className="text-2xl font-semibold">Register</h2>
          <p className="mt-2 text-sm text-ink-muted">Use your own name and email. You will sign in as a student.</p>
          {formError ? <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">{formError}</p> : null}
          <div className="mt-6 space-y-4">
            <Field id="name" label="Full name" error={errors.name}>
              <TextInput id="name" name="name" autoComplete="name" value={form.name} onChange={update} error={errors.name} />
            </Field>
            <Field id="email" label="Email" error={errors.email}>
              <TextInput id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={update} error={errors.email} />
            </Field>
            <Field id="password" label="Password" error={errors.password}>
              <PasswordInput id="password" name="password" autoComplete="new-password" value={form.password} onChange={update} error={errors.password} />
            </Field>
            <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
              <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" value={form.confirmPassword} onChange={update} error={errors.confirmPassword} />
            </Field>
          </div>
          <button type="submit" className="btn-primary mt-6 w-full" disabled={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </button>
          <p className="mt-4 text-sm text-ink-muted">
            Already registered? <Link to="/login" className="font-semibold text-accent hover:text-accent-hover">Sign in</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
