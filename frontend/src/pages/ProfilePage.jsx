import { useProfileForm } from '../hooks/useProfileForm.js';
import { roleLabel } from '../lib/format.js';
import { Field, TextInput } from '../components/ui.jsx';

export function ProfilePage() {
  const { user, name, setName, errors, pending, onSubmit } = useProfileForm();

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
