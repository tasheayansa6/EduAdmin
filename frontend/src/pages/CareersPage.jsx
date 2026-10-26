import { useEffect, useState } from 'react';
import { api, buildQuery } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { useResource } from '../hooks/useResource.js';
import { fieldErrors, formatDate, formatDateTime } from '../lib/format.js';
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
  title: '',
  location: '',
  employmentType: 'Full time',
  department: '',
  summary: '',
  description: '',
  applicationEmail: 'tasheayansa6@gmail.com',
  deadline: '',
  status: 'draft',
};

export function CareersPage() {
  const toast = useToast();
  const [tab, setTab] = useState('roles');
  const list = useListParams();
  const resource = useResource(
    () => api(`/api/v1/careers${buildQuery({ q: list.q, status: list.status, page: list.page, limit: 8 })}`),
    [list.q, list.status, list.page],
  );
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const rows = resource.data?.data ?? [];

  return (
    <>
      <PageIntro action={tab === 'roles' ? <button type="button" className="btn-primary" onClick={() => setCreating(true)}>Post role</button> : null}>
        Publish open positions. Applications are emailed to tasheayansa6@gmail.com and stored here.
      </PageIntro>

      <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1">
        {[
          { key: 'roles', label: 'Openings' },
          { key: 'applications', label: 'Applications' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
              tab === item.key ? 'bg-accent text-white shadow-soft' : 'text-ink-muted hover:text-ink'
            }`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'roles' ? (
        <>
          <Filters onSubmit={(event) => event.preventDefault()}>
            <Field id="career-search" label="Search" className="min-w-[16rem] flex-1">
              <TextInput
                id="career-search"
                value={list.draft}
                onChange={(event) => list.setDraft(event.target.value)}
                placeholder="Type to search title or location"
                autoComplete="off"
              />
            </Field>
            <Field id="career-status" label="Status">
              <SelectInput id="career-status" value={list.status} onChange={(event) => list.update({ q: list.q, status: event.target.value })}>
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </SelectInput>
            </Field>
          </Filters>

          <DataPanel
            status={resource.status}
            error={resource.error}
            onRetry={resource.reload}
            isEmpty={rows.length === 0}
            emptyTitle="No career posts yet"
            emptyMessage="Use Post role to publish the first opening."
            skeleton={<TableSkeleton />}
          >
            <div className="table-wrap overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Apps</th>
                    <th>Deadline</th>
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="font-semibold">{row.title}</div>
                        {row.department ? <div className="text-sm text-ink-muted">{row.department}</div> : null}
                      </td>
                      <td>{row.location || '—'}</td>
                      <td>{row.employmentType}</td>
                      <td><StatusBadge status={row.status} /></td>
                      <td className="tabular-nums">{row.applicationCount ?? 0}</td>
                      <td>{row.deadline ? formatDate(row.deadline) : '—'}</td>
                      <td className="text-right">
                        <button type="button" className="btn-secondary" onClick={() => setEditingId(row.id)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination meta={resource.data?.meta} onPage={(page) => list.update({ page }, { resetPage: false })} />
            </div>
          </DataPanel>
        </>
      ) : (
        <ApplicationsPanel toast={toast} />
      )}

      {creating ? (
        <CareerEditor
          onClose={() => setCreating(false)}
          onSaved={(message) => {
            toast.success(message);
            setCreating(false);
            resource.reload();
          }}
        />
      ) : null}
      {editingId ? (
        <CareerEditor
          id={editingId}
          onClose={() => setEditingId(null)}
          onSaved={(message) => {
            toast.success(message);
            setEditingId(null);
            resource.reload();
          }}
        />
      ) : null}
    </>
  );
}

function CareerEditor({ id, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [fieldError, setFieldError] = useState({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!id) return undefined;
    let active = true;
    api(`/api/v1/careers/${id}`)
      .then((result) => {
        if (!active) return;
        const row = result.data;
        setForm({
          title: row.title || '',
          location: row.location || '',
          employmentType: row.employmentType || 'Full time',
          department: row.department || '',
          summary: row.summary || '',
          description: row.description || '',
          applicationEmail: row.applicationEmail || 'tasheayansa6@gmail.com',
          deadline: row.deadline ? String(row.deadline).slice(0, 10) : '',
          status: row.status || 'draft',
        });
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save(nextStatus) {
    const payload = {
      title: form.title.trim(),
      location: form.location.trim() || null,
      employmentType: form.employmentType.trim() || 'Full time',
      department: form.department.trim() || null,
      summary: form.summary.trim() || null,
      description: form.description.trim(),
      applicationEmail: form.applicationEmail.trim() || 'tasheayansa6@gmail.com',
      deadline: form.deadline || null,
      status: nextStatus || form.status,
    };
    setPending(true);
    setFieldError({});
    setError('');
    try {
      if (id) {
        await api(`/api/v1/careers/${id}`, { method: 'PATCH', body: payload });
        onSaved(payload.status === 'open' ? 'Role published.' : 'Role saved.');
      } else {
        await api('/api/v1/careers', { method: 'POST', body: payload });
        onSaved(payload.status === 'open' ? 'Role published.' : 'Draft saved.');
      }
    } catch (saveError) {
      const fields = fieldErrors(saveError);
      setFieldError(fields);
      if (!Object.keys(fields).length) setError(saveError.message);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    try {
      await api(`/api/v1/careers/${id}`, { method: 'DELETE' });
      onSaved('Role deleted.');
    } catch (deleteError) {
      setConfirmingDelete(false);
      toast.error(deleteError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Modal title={id ? 'Edit role' : 'Post role'} onClose={onClose} wide>
        {loading ? <p className="text-sm text-ink-muted">Loading…</p> : null}
        {error ? <p role="alert" className="text-sm font-semibold text-red-800">{error}</p> : null}
        {!loading ? (
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); save(); }} noValidate>
            <Field id="role-title" label="Title" error={fieldError.title}>
              <TextInput id="role-title" name="title" value={form.title} error={fieldError.title} onChange={update} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="role-location" label="Location" error={fieldError.location}>
                <TextInput id="role-location" name="location" value={form.location} error={fieldError.location} onChange={update} placeholder="Addis Ababa · Modjo" />
              </Field>
              <Field id="role-type" label="Employment type" error={fieldError.employmentType}>
                <SelectInput id="role-type" name="employmentType" value={form.employmentType} error={fieldError.employmentType} onChange={update}>
                  <option>Full time</option>
                  <option>Part time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </SelectInput>
              </Field>
              <Field id="role-dept" label="Department" error={fieldError.department}>
                <TextInput id="role-dept" name="department" value={form.department} error={fieldError.department} onChange={update} placeholder="Regional Enterprise" />
              </Field>
              <Field id="role-deadline" label="Deadline" error={fieldError.deadline}>
                <TextInput id="role-deadline" name="deadline" type="date" value={form.deadline} error={fieldError.deadline} onChange={update} />
              </Field>
            </div>
            <Field id="role-summary" label="Summary" error={fieldError.summary}>
              <TextArea id="role-summary" name="summary" rows="2" value={form.summary} error={fieldError.summary} onChange={update} />
            </Field>
            <Field id="role-description" label="Description" error={fieldError.description}>
              <TextArea id="role-description" name="description" rows="10" value={form.description} error={fieldError.description} onChange={update} />
            </Field>
            <Field id="role-email" label="Applications go to" error={fieldError.applicationEmail}>
              <TextInput id="role-email" name="applicationEmail" type="email" value={form.applicationEmail} error={fieldError.applicationEmail} onChange={update} />
            </Field>
            <Field id="role-status" label="Status" error={fieldError.status}>
              <SelectInput id="role-status" name="status" value={form.status} error={fieldError.status} onChange={update}>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </SelectInput>
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
              {id ? (
                <button type="button" className="btn-danger" disabled={pending} onClick={() => setConfirmingDelete(true)}>Delete</button>
              ) : <span />}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" disabled={pending} onClick={onClose}>Cancel</button>
                <button type="button" className="btn-secondary" disabled={pending} onClick={() => save('draft')}>Save draft</button>
                <button type="button" className="btn-primary" disabled={pending} onClick={() => save('open')}>
                  {pending ? 'Saving…' : 'Publish open'}
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </Modal>
      {confirmingDelete ? (
        <Modal title="Delete role" onClose={() => { if (!pending) setConfirmingDelete(false); }}>
          <p className="text-sm">Permanently delete “{form.title}”? Applications for this role will also be removed.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn-secondary" disabled={pending} onClick={() => setConfirmingDelete(false)}>Cancel</button>
            <button type="button" className="btn-danger" disabled={pending} onClick={remove}>{pending ? 'Deleting…' : 'Delete'}</button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function ApplicationsPanel({ toast }) {
  const list = useListParams();
  const resource = useResource(
    () => api(`/api/v1/careers/applications${buildQuery({ q: list.q, status: list.status, page: list.page, limit: 8 })}`),
    [list.q, list.status, list.page],
  );
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(false);
  const rows = resource.data?.data ?? [];

  async function setStatus(id, status) {
    setPending(true);
    try {
      await api(`/api/v1/careers/applications/${id}`, { method: 'PATCH', body: { status } });
      toast.success(`Marked as ${status}.`);
      setSelected(null);
      resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Filters onSubmit={(event) => event.preventDefault()}>
        <Field id="app-search" label="Search" className="min-w-[16rem] flex-1">
          <TextInput id="app-search" value={list.draft} onChange={(event) => list.setDraft(event.target.value)} placeholder="Name, email, or role" autoComplete="off" />
        </Field>
        <Field id="app-status" label="Status">
          <SelectInput id="app-status" value={list.status} onChange={(event) => list.update({ q: list.q, status: event.target.value })}>
            <option value="">All</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="hired">Hired</option>
          </SelectInput>
        </Field>
      </Filters>
      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        isEmpty={rows.length === 0}
        emptyTitle="No applications yet"
        emptyMessage="When candidates apply to open roles, they appear here."
        skeleton={<TableSkeleton />}
      >
        <div className="table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Role</th>
                <th>Status</th>
                <th>Submitted</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold">{row.name}</div>
                    <div className="text-sm text-ink-muted">{row.email}</div>
                  </td>
                  <td>{row.careerTitle}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td>{formatDateTime(row.createdAt)}</td>
                  <td className="text-right">
                    <button type="button" className="btn-secondary" onClick={() => setSelected(row)}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={resource.data?.meta} onPage={(page) => list.update({ page }, { resetPage: false })} />
        </div>
      </DataPanel>

      {selected ? (
        <Modal title={selected.careerTitle || 'Application'} onClose={() => setSelected(null)} wide>
          <p className="text-sm text-ink-muted">{selected.name} · {selected.email}{selected.phone ? ` · ${selected.phone}` : ''} · {formatDateTime(selected.createdAt)}</p>
          {selected.resumeUrl ? (
            <p className="mt-2 text-sm">
              <a href={selected.resumeUrl} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">Resume link</a>
            </p>
          ) : null}
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">{selected.coverLetter}</p>
          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            {['reviewed', 'shortlisted', 'rejected', 'hired'].map((status) => (
              <button key={status} type="button" className="btn-secondary capitalize" disabled={pending || selected.status === status} onClick={() => setStatus(selected.id, status)}>
                {status}
              </button>
            ))}
            <button type="button" className="btn-primary" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
