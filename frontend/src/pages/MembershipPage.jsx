import { useEffect, useState } from 'react';
import { api, buildQuery } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { useResource } from '../hooks/useResource.js';
import { fieldErrors, formatDateTime } from '../lib/format.js';
import {
  DataPanel,
  Field,
  Filters,
  Modal,
  PageIntro,
  Pagination,
  SelectInput,
  StatusBadge,
  TableSkeleton,
  TextArea,
  TextInput,
} from '../components/ui.jsx';

const emptyForm = {
  enabled: true,
  eyebrow: '',
  headline: '',
  intro: '',
  ctaLabel: '',
  ctaUrl: '',
};

const emptyRequest = {
  name: '',
  email: '',
  phone: '',
  organization: '',
  message: '',
};

export function MembershipPage() {
  const [tab, setTab] = useState('requests');

  return (
    <>
      <PageIntro>
        Review membership join requests and edit the AILG membership CTA copy.
      </PageIntro>

      <div role="tablist" aria-label="Membership sections" className="mb-5 flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1">
        {[
          { key: 'requests', label: 'Requests' },
          { key: 'settings', label: 'CTA settings' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === item.key ? 'bg-accent text-white shadow-soft' : 'text-ink-muted hover:text-ink'
            }`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'requests' ? <MembershipRequests /> : <MembershipSettings />}
    </>
  );
}

function MembershipSettings() {
  const toast = useToast();
  const resource = useResource(() => api('/api/v1/membership'), []);
  const [form, setForm] = useState(emptyForm);
  const [fieldError, setFieldError] = useState({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const data = resource.data?.data;
    if (!data) return;
    setForm({
      enabled: Boolean(data.enabled),
      eyebrow: data.eyebrow || '',
      headline: data.headline || '',
      intro: data.intro || '',
      ctaLabel: data.ctaLabel || '',
      ctaUrl: data.ctaUrl || '',
    });
  }, [resource.data]);

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function save(event) {
    event.preventDefault();
    setPending(true);
    setFieldError({});
    try {
      await api('/api/v1/membership', {
        method: 'PUT',
        body: {
          enabled: form.enabled,
          eyebrow: form.eyebrow.trim(),
          headline: form.headline.trim(),
          intro: form.intro.trim() || null,
          ctaLabel: form.ctaLabel.trim(),
          ctaUrl: form.ctaUrl.trim(),
        },
      });
      toast.success('Membership CTA saved.');
      resource.reload();
    } catch (error) {
      const fields = fieldErrors(error);
      setFieldError(fields);
      if (!Object.keys(fields).length) toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  const data = resource.data?.data;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        loadingLabel="Loading membership settings"
      >
        <form onSubmit={save} className="space-y-4">
          <label className="flex items-start gap-3 rounded-2xl border border-line bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              name="enabled"
              checked={form.enabled}
              onChange={update}
              className="mt-1 h-4 w-4 rounded border-line text-accent focus:ring-accent"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">Membership CTA enabled</span>
              <span className="mt-0.5 block text-sm text-ink-muted">
                Controls whether the public membership CTA is active for the AILG site merge.
              </span>
            </span>
          </label>

          <Field id="membership-eyebrow" label="Eyebrow" error={fieldError.eyebrow}>
            <TextInput id="membership-eyebrow" name="eyebrow" value={form.eyebrow} onChange={update} required maxLength={80} />
          </Field>
          <Field id="membership-headline" label="Headline" error={fieldError.headline}>
            <TextInput id="membership-headline" name="headline" value={form.headline} onChange={update} required maxLength={255} />
          </Field>
          <Field id="membership-intro" label="Supporting text" error={fieldError.intro}>
            <TextArea id="membership-intro" name="intro" value={form.intro} onChange={update} rows={4} maxLength={2000} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="membership-cta-label" label="Button label" error={fieldError.ctaLabel}>
              <TextInput id="membership-cta-label" name="ctaLabel" value={form.ctaLabel} onChange={update} required maxLength={80} />
            </Field>
            <Field id="membership-cta-url" label="Button URL" error={fieldError.ctaUrl}>
              <TextInput id="membership-cta-url" name="ctaUrl" type="url" value={form.ctaUrl} onChange={update} required maxLength={500} />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? 'Saving…' : 'Save membership'}
            </button>
            {data?.updatedAt ? (
              <p className="text-sm text-ink-muted">Last saved {formatDateTime(data.updatedAt)}</p>
            ) : null}
          </div>
        </form>
      </DataPanel>

      <aside className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-line bg-[#fbfcf9] shadow-soft">
          <div className="border-b border-line/80 bg-gradient-to-r from-emerald-50 via-transparent to-amber-50/40 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800">
              {form.eyebrow || 'AILG membership'}
            </p>
          </div>
          <div className="space-y-3 p-4">
            <h3 className="font-display text-xl font-extrabold text-ink">
              {form.headline || 'Join the membership'}
            </h3>
            <p className="text-sm leading-relaxed text-ink-muted">
              {form.intro || 'Supporting text appears here.'}
            </p>
            <span className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-amber-100 px-4 text-sm font-bold text-emerald-900">
              {form.ctaLabel || 'Join membership'}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function MembershipRequests() {
  const toast = useToast();
  const list = useListParams();
  const stats = useResource(() => api('/api/v1/membership/requests/stats'), []);
  const resource = useResource(
    () => api(`/api/v1/membership/requests${buildQuery({
      q: list.q,
      status: list.status,
      page: list.page,
      limit: 8,
    })}`),
    [list.q, list.status, list.page],
  );
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyRequest);
  const [fieldError, setFieldError] = useState({});
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const rows = resource.data?.data ?? [];
  const summary = stats.data?.data;
  const filtered = Boolean(list.q || list.status);

  useEffect(() => {
    setNotes(selected?.adminNotes || '');
  }, [selected]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function createRequest(event) {
    event.preventDefault();
    setPending(true);
    setFieldError({});
    try {
      await api('/api/v1/membership/requests', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          organization: form.organization.trim() || null,
          message: form.message.trim() || null,
        },
      });
      toast.success('Membership request added.');
      setCreating(false);
      setForm(emptyRequest);
      resource.reload();
      stats.reload();
    } catch (error) {
      const fields = fieldErrors(error);
      setFieldError(fields);
      if (!Object.keys(fields).length) toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  async function setStatus(id, status) {
    setPending(true);
    try {
      await api(`/api/v1/membership/requests/${id}`, {
        method: 'PATCH',
        body: { status, adminNotes: notes.trim() || null },
      });
      toast.success(`Marked as ${status}.`);
      setSelected(null);
      resource.reload();
      stats.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  async function remove(id) {
    setPending(true);
    try {
      await api(`/api/v1/membership/requests/${id}`, { method: 'DELETE' });
      toast.success('Request deleted.');
      setSelected(null);
      resource.reload();
      stats.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {summary ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-4">
          {[
            { label: 'New', value: summary.new },
            { label: 'Reviewing', value: summary.reviewing },
            { label: 'Approved', value: summary.approved },
            { label: 'Total', value: summary.total },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-line bg-white p-4 shadow-soft">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">{item.label}</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-4 flex justify-end">
        <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
          Add request
        </button>
      </div>

      <Filters onSubmit={(event) => event.preventDefault()}>
        <Field id="membership-req-search" label="Search" className="min-w-[16rem] flex-1">
          <TextInput
            id="membership-req-search"
            value={list.draft}
            onChange={(event) => list.setDraft(event.target.value)}
            placeholder="Name, email, or organization"
            autoComplete="off"
          />
        </Field>
        <Field id="membership-req-status" label="Status">
          <SelectInput
            id="membership-req-status"
            value={list.status}
            onChange={(event) => list.update({ q: list.q, status: event.target.value })}
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </SelectInput>
        </Field>
      </Filters>

      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        isEmpty={!rows.length}
        emptyTitle={filtered ? 'No matching requests' : 'No membership requests yet'}
        emptyMessage={filtered ? 'Try another search or status.' : 'Add a request manually, or receive them from the public membership form.'}
        skeleton={<TableSkeleton cols={5} />}
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Applicant</th>
                <th scope="col">Organization</th>
                <th scope="col">Status</th>
                <th scope="col">Received</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <p className="font-semibold text-ink">{row.name}</p>
                    <p className="text-sm text-ink-muted">{row.email}</p>
                  </td>
                  <td className="text-sm text-ink-muted">{row.organization || '—'}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td className="whitespace-nowrap text-sm text-ink-muted">{formatDateTime(row.createdAt)}</td>
                  <td>
                    <button type="button" className="btn-secondary text-xs" onClick={() => setSelected(row)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={resource.data?.meta} onPage={(page) => list.update({ q: list.q, status: list.status, page }, { resetPage: false })} />
      </DataPanel>

      {creating ? (
        <Modal title="Add membership request" onClose={() => !pending && setCreating(false)}>
          <form onSubmit={createRequest} className="space-y-4" noValidate>
            <Field id="req-name" label="Full name" error={fieldError.name}>
              <TextInput id="req-name" name="name" value={form.name} onChange={updateForm} required />
            </Field>
            <Field id="req-email" label="Email" error={fieldError.email}>
              <TextInput id="req-email" name="email" type="email" value={form.email} onChange={updateForm} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="req-phone" label="Phone" error={fieldError.phone}>
                <TextInput id="req-phone" name="phone" value={form.phone} onChange={updateForm} />
              </Field>
              <Field id="req-org" label="Organization" error={fieldError.organization}>
                <TextInput id="req-org" name="organization" value={form.organization} onChange={updateForm} />
              </Field>
            </div>
            <Field id="req-message" label="Message" error={fieldError.message}>
              <TextArea id="req-message" name="message" rows={4} value={form.message} onChange={updateForm} />
            </Field>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" className="btn-secondary" disabled={pending} onClick={() => setCreating(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={pending}>
                {pending ? 'Saving…' : 'Add request'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {selected ? (
        <Modal title={selected.name} onClose={() => !pending && setSelected(null)} wide>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <span className="text-sm text-ink-muted">Received {formatDateTime(selected.createdAt)}</span>
              <span className="text-sm text-ink-muted">· Source: {selected.source}</span>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-ink-muted">Email</dt>
                <dd className="font-semibold text-ink">{selected.email}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Phone</dt>
                <dd className="font-semibold text-ink">{selected.phone || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-ink-muted">Organization</dt>
                <dd className="font-semibold text-ink">{selected.organization || '—'}</dd>
              </div>
            </dl>
            {selected.message ? (
              <div className="rounded-2xl border border-line bg-slate-50 p-4 text-sm leading-relaxed text-ink">
                {selected.message}
              </div>
            ) : null}
            <Field id="req-notes" label="Admin notes">
              <TextArea id="req-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <button type="button" className="btn-secondary" disabled={pending} onClick={() => setStatus(selected.id, 'reviewing')}>
                Reviewing
              </button>
              <button type="button" className="btn-primary" disabled={pending} onClick={() => setStatus(selected.id, 'approved')}>
                Approve
              </button>
              <button type="button" className="btn-secondary" disabled={pending} onClick={() => setStatus(selected.id, 'rejected')}>
                Reject
              </button>
              <button type="button" className="btn-secondary text-red-700" disabled={pending} onClick={() => remove(selected.id)}>
                Delete
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
