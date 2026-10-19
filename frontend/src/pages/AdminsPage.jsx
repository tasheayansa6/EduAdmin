import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useResource } from '../hooks/useResource.js';
import { fieldErrors, roleLabel } from '../lib/format.js';
import { validatePassword, validatePerson } from '../lib/validate.js';
import {
  DataPanel,
  Field,
  Modal,
  PageIntro,
  StatusBadge,
  TableSkeleton,
  TextInput,
} from '../components/ui.jsx';

const emptyAdmin = { name: '', email: '', password: '' };

export function AdminsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const resource = useResource(() => api('/api/v1/administrators'), []);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [pending, setPending] = useState(false);
  const rows = resource.data?.data ?? [];

  async function setStatus() {
    setPending(true);
    try {
      await api(`/api/v1/administrators/${confirm.id}`, { method: 'PATCH', body: { status: confirm.next } });
      toast.success(confirm.next === 'active' ? 'Administrator activated.' : 'Administrator deactivated.');
      setConfirm(null);
      resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageIntro action={<button type="button" className="btn-primary" onClick={() => setCreating(true)}>Add administrator</button>}>
        People who can sign in to this dashboard. Super administrator access stays in place.
      </PageIntro>
      <DataPanel status={resource.status} error={resource.error} onRetry={resource.reload} skeleton={<TableSkeleton rows={4} />}>
        <div className="table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((account) => {
                const isSelf = account.id === user.id;
                const locked = account.role === 'super_admin';
                return (
                  <tr key={account.id}>
                    <td className="font-semibold">{account.name}</td>
                    <td>{account.email}</td>
                    <td>{roleLabel(account.role)}</td>
                    <td><StatusBadge status={account.status} /></td>
                    <td className="text-right">
                      {locked || isSelf ? (
                        <span className="text-sm text-ink-muted">{isSelf ? 'Signed in' : 'Protected'}</span>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setConfirm({ ...account, next: account.status === 'active' ? 'inactive' : 'active' })}
                        >
                          {account.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DataPanel>
      {confirm ? (
        <Modal title={confirm.next === 'active' ? 'Activate administrator' : 'Deactivate administrator'} onClose={() => setConfirm(null)}>
          <p className="text-sm">
            {confirm.next === 'active'
              ? `${confirm.name} will be able to sign in again.`
              : `${confirm.name} will no longer be able to sign in.`}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
            <button type="button" className={confirm.next === 'active' ? 'btn-primary' : 'btn-danger'} disabled={pending} onClick={setStatus}>
              {pending ? 'Saving…' : confirm.next === 'active' ? 'Activate' : 'Deactivate'}
            </button>
          </div>
        </Modal>
      ) : null}
      {creating ? (
        <AdminDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            toast.success('Administrator added.');
            setCreating(false);
            resource.reload();
          }}
        />
      ) : null}
    </>
  );
}

function AdminDialog({ onClose, onSaved }) {
  const [form, setForm] = useState(emptyAdmin);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validatePerson(form);
    const passwordError = validatePassword(form.password);
    if (passwordError) nextErrors.password = passwordError;
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;
    setPending(true);
    try {
      await api('/api/v1/administrators', {
        method: 'POST',
        body: { name: form.name.trim(), email: form.email.trim(), password: form.password },
      });
      onSaved();
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (!Object.keys(fields).length) setFormError(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title="Add administrator" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? <p role="alert" className="text-sm font-semibold text-red-800">{formError}</p> : null}
        <Field id="admin-name" label="Name" error={errors.name}>
          <TextInput id="admin-name" name="name" value={form.name} error={errors.name} onChange={update} />
        </Field>
        <Field id="admin-email" label="Email" error={errors.email}>
          <TextInput id="admin-email" name="email" type="email" autoComplete="off" value={form.email} error={errors.email} onChange={update} />
        </Field>
        <Field id="admin-password" label="Temporary password" error={errors.password}>
          <TextInput id="admin-password" name="password" type="password" autoComplete="new-password" value={form.password} error={errors.password} onChange={update} />
        </Field>
        <p className="text-sm text-ink-muted">At least 8 characters, with a letter and a number.</p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Add administrator'}</button>
        </div>
      </form>
    </Modal>
  );
}
