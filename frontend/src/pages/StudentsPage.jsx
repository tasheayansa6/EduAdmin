import { useEffect, useState } from 'react';
import { api, buildQuery } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { useResource } from '../hooks/useResource.js';
import { fieldErrors, formatDate } from '../lib/format.js';
import { validatePassword, validatePerson } from '../lib/validate.js';
import {
  DataPanel,
  Field,
  Filters,
  Modal,
  PageIntro,
  Pagination,
  ProgressBar,
  SelectInput,
  StatusBadge,
  TableSkeleton,
  TextInput,
} from '../components/ui.jsx';

const emptyStudent = { name: '', email: '', password: '' };

export function StudentsPage() {
  const toast = useToast();
  const list = useListParams();
  const resource = useResource(
    () => api(`/api/v1/students${buildQuery({ q: list.q, status: list.status, page: list.page, limit: 8 })}`),
    [list.q, list.status, list.page],
  );
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);

  const rows = resource.data?.data ?? [];
  const filtered = Boolean(list.q || list.status);

  return (
    <>
      <PageIntro action={<button type="button" className="btn-primary" onClick={() => setCreating(true)}>Add student</button>}>
        Create student accounts, then update a name, email, or status.
      </PageIntro>
      <Filters onSubmit={(event) => { event.preventDefault(); list.update({ q: list.draft.trim(), status: list.status }); }}>
        <Field id="student-search" label="Search" className="min-w-[16rem] flex-1">
          <TextInput id="student-search" value={list.draft} onChange={(event) => list.setDraft(event.target.value)} placeholder="Name or email" />
        </Field>
        <Field id="student-status" label="Status">
          <SelectInput id="student-status" value={list.status} onChange={(event) => list.update({ q: list.q, status: event.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </SelectInput>
        </Field>
        <button type="submit" className="btn-primary">Search</button>
      </Filters>
      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        isEmpty={rows.length === 0}
        emptyTitle={filtered ? 'No matching students' : 'No students yet'}
        emptyMessage={filtered ? 'Try a different name, email, or status.' : 'Use Add student to create the first account.'}
        skeleton={<TableSkeleton />}
      >
        <div className="table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Enrollments</th>
                <th>Joined</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((student) => (
                <tr key={student.id}>
                  <td className="font-semibold">{student.name}</td>
                  <td>{student.email}</td>
                  <td><StatusBadge status={student.status} /></td>
                  <td className="tabular-nums">{student.enrollmentCount}</td>
                  <td>{formatDate(student.createdAt)}</td>
                  <td className="text-right">
                    <button type="button" className="btn-secondary" onClick={() => setSelectedId(student.id)}>Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={resource.data?.meta} onPage={(page) => list.update({ page }, { resetPage: false })} />
        </div>
      </DataPanel>
      {selectedId ? (
        <StudentDialog
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onSaved={() => {
            toast.success('Student updated.');
            setSelectedId(null);
            resource.reload();
          }}
        />
      ) : null}
      {creating ? (
        <CreateStudentDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            toast.success('Student added.');
            setCreating(false);
            resource.reload();
          }}
        />
      ) : null}
    </>
  );
}

function CreateStudentDialog({ onClose, onSaved }) {
  const [form, setForm] = useState(emptyStudent);
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
      await api('/api/v1/students', {
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
    <Modal title="Add student" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? <p role="alert" className="text-sm font-semibold text-red-800">{formError}</p> : null}
        <Field id="new-student-name" label="Name" error={errors.name}>
          <TextInput id="new-student-name" name="name" value={form.name} error={errors.name} onChange={update} />
        </Field>
        <Field id="new-student-email" label="Email" error={errors.email}>
          <TextInput id="new-student-email" name="email" type="email" autoComplete="off" value={form.email} error={errors.email} onChange={update} />
        </Field>
        <Field id="new-student-password" label="Temporary password" error={errors.password}>
          <TextInput id="new-student-password" name="password" type="password" autoComplete="new-password" value={form.password} error={errors.password} onChange={update} />
        </Field>
        <p className="text-sm text-ink-muted">At least 8 characters, with a letter and a number. Share this with the student so they can sign in.</p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Add student'}</button>
        </div>
      </form>
    </Modal>
  );
}

function StudentDialog({ id, onClose, onSaved }) {
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    api(`/api/v1/students/${id}`)
      .then((result) => {
        if (active) setStudent(result.data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validatePerson(student);
    setFieldError(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setPending(true);
    try {
      await api(`/api/v1/students/${id}`, {
        method: 'PATCH',
        body: { name: student.name.trim(), email: student.email.trim(), status: student.status },
      });
      onSaved();
    } catch (saveError) {
      const fields = fieldErrors(saveError);
      setFieldError(fields);
      if (!Object.keys(fields).length) setError(saveError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title="Manage student" onClose={onClose}>
      {!student && !error ? <p className="text-sm text-ink-muted">Loading student…</p> : null}
      {error ? <p role="alert" className="text-sm font-semibold text-red-800">{error}</p> : null}
      {student ? (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field id="student-name" label="Name" error={fieldError.name}>
            <TextInput id="student-name" value={student.name} error={fieldError.name} onChange={(event) => setStudent({ ...student, name: event.target.value })} />
          </Field>
          <Field id="student-email" label="Email" error={fieldError.email}>
            <TextInput id="student-email" type="email" value={student.email} error={fieldError.email} onChange={(event) => setStudent({ ...student, email: event.target.value })} />
          </Field>
          <Field id="student-edit-status" label="Status" error={fieldError.status}>
            <SelectInput id="student-edit-status" value={student.status} error={fieldError.status} onChange={(event) => setStudent({ ...student, status: event.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </SelectInput>
          </Field>
          <div>
            <h3 className="text-sm font-semibold">Enrollments</h3>
            {student.enrollments.length ? (
              <ul className="mt-2 space-y-2">
                {student.enrollments.map((enrollment) => (
                  <li key={enrollment.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{enrollment.courseTitle}</span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={enrollment.status} />
                      <ProgressBar value={enrollment.percent} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-ink-muted">No enrollments for this student.</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save student'}</button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
