import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { fieldErrors, roleLabel } from '../lib/format.js';
import { validatePerson } from '../lib/validate.js';
import { Field, TextInput } from '../components/ui.jsx';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validatePerson({ name });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setPending(true);
    try {
      const result = await api('/api/v1/auth/me', { method: 'PATCH', body: { name: name.trim() } });
      updateUser(result.user);
      toast.success('Profile updated.');
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (!Object.keys(fields).length) toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4 rounded-lg border border-line bg-white p-6 shadow-card" noValidate>
      <p className="text-sm text-ink-muted">This is the account you use to sign in. Email and role are managed with the existing account record.</p>
      <Field id="profile-name" label="Name" error={errors.name}>
        <TextInput id="profile-name" value={name} error={errors.name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field id="profile-email" label="Email">
        <TextInput id="profile-email" value={user.email} disabled />
      </Field>
      <Field id="profile-role" label="Role">
        <TextInput id="profile-role" value={roleLabel(user.role)} disabled />
      </Field>
      <button type="submit" className="btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save profile'}</button>
    </form>
  );
}
