import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, buildQuery } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useListParams } from '../hooks/useListParams.js';
import { useResource } from '../hooks/useResource.js';
import { fieldErrors, formatDate, formatDateTime } from '../lib/format.js';
import { validateEnrollment } from '../lib/validate.js';
import {
  DataPanel,
  Field,
  Filters,
  Modal,
  PageHeader,
  Pagination,
  ProgressBar,
  SelectInput,
  StatusBadge,
  TableSkeleton,
  TextInput,
} from '../components/ui.jsx';

export function EnrollmentsPage() {
  const toast = useToast();
  const list = useListParams();
  const debouncedDraft = useDebouncedValue(list.draft, 400);

  useEffect(() => {
    if (debouncedDraft.trim() === list.q) return;
    list.update({ q: debouncedDraft.trim(), status: list.status, courseId: list.courseId });
  }, [debouncedDraft]); // eslint-disable-line react-hooks/exhaustive-deps -- sync search only

  const resource = useResource(
    () => api(`/api/v1/enrollments${buildQuery({
      q: list.q,
      status: list.status,
      courseId: list.courseId,
      page: list.page,
      limit: 8,
    })}`),
    [list.q, list.status, list.courseId, list.page],
  );
  const lookups = useResource(() => api('/api/v1/lookups'), []);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const courses = lookups.data?.data.courses ?? [];
  const rows = resource.data?.data ?? [];
  const filtered = Boolean(list.q || list.status || list.courseId);

  return (
    <>
      <PageHeader
        title="Enrollments"
        description="Connect students to published courses. Each student may hold one enrollment per course. Withdrawal keeps history and progress."
        actions={(
          <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
            Add enrollment
          </button>
        )}
      />

      <Filters onSubmit={(event) => event.preventDefault()}>
        <Field id="enrollment-search" label="Search" className="min-w-[16rem] flex-1">
          <TextInput
            id="enrollment-search"
            value={list.draft}
            onChange={(event) => list.setDraft(event.target.value)}
            placeholder="Type to search student or course"
            autoComplete="off"
          />
        </Field>
        <Field id="enrollment-course" label="Course">
          <SelectInput
            id="enrollment-course"
            value={list.courseId}
            onChange={(event) => list.update({ q: list.q, status: list.status, courseId: event.target.value })}
          >
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </SelectInput>
        </Field>
        <Field id="enrollment-status" label="Status">
          <SelectInput
            id="enrollment-status"
            value={list.status}
            onChange={(event) => list.update({ q: list.q, status: event.target.value, courseId: list.courseId })}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="withdrawn">Withdrawn</option>
          </SelectInput>
        </Field>
      </Filters>

      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        isEmpty={rows.length === 0}
        emptyTitle={filtered ? 'No matching enrollments' : 'No enrollments yet'}
        emptyMessage={filtered ? 'Try another student, course, or status.' : 'Add an enrollment to connect a student with a published course.'}
        skeleton={<TableSkeleton />}
      >
        <div className="table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Student</th>
                <th scope="col">Course</th>
                <th scope="col">Enrolled</th>
                <th scope="col">Status</th>
                <th scope="col">Progress</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td className="tabular-nums text-ink-muted">#{enrollment.id}</td>
                  <td>
                    <div className="font-semibold text-ink">{enrollment.studentName}</div>
                    <div className="text-sm text-ink-muted">{enrollment.email}</div>
                  </td>
                  <td>{enrollment.courseTitle}</td>
                  <td>{formatDate(enrollment.enrolledAt)}</td>
                  <td><StatusBadge status={enrollment.status} /></td>
                  <td>
                    <div className="space-y-1">
                      <ProgressBar value={enrollment.percent} />
                      {enrollment.progressStatus ? (
                        <div className="text-xs text-ink-muted">
                          <StatusBadge status={enrollment.progressStatus} />
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="text-right">
                    <button type="button" className="btn-secondary" onClick={() => setSelectedId(enrollment.id)}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={resource.data?.meta} onPage={(page) => list.update({ page }, { resetPage: false })} />
        </div>
      </DataPanel>

      {creating ? (
        <CreateEnrollment
          lookups={lookups.data?.data}
          onClose={() => setCreating(false)}
          onSaved={() => {
            toast.success('Enrollment added.');
            setCreating(false);
            resource.reload();
          }}
        />
      ) : null}

      {selectedId ? (
        <ManageEnrollment
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onSaved={(message) => {
            toast.success(message);
            setSelectedId(null);
            resource.reload();
          }}
        />
      ) : null}
    </>
  );
}

function CreateEnrollment({ lookups, onClose, onSaved }) {
  const [form, setForm] = useState({ userId: '', courseId: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const publishedCourses = (lookups?.courses ?? []).filter((course) => course.status === 'published');

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validateEnrollment(form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;
    setPending(true);
    try {
      await api('/api/v1/enrollments', {
        method: 'POST',
        body: { userId: Number(form.userId), courseId: Number(form.courseId) },
      });
      onSaved();
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      setFormError(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title="Add enrollment" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? <p role="alert" className="text-sm font-semibold text-red-800">{formError}</p> : null}
        <p className="text-sm text-ink-muted">
          Only active students and published courses are listed. Duplicate active enrollments are rejected.
        </p>
        <Field id="enroll-student" label="Student" error={errors.userId}>
          <SelectInput
            id="enroll-student"
            value={form.userId}
            error={errors.userId}
            onChange={(event) => setForm({ ...form, userId: event.target.value })}
          >
            <option value="">Choose a student</option>
            {(lookups?.students ?? []).map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.email})
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field id="enroll-course" label="Course" error={errors.courseId}>
          <SelectInput
            id="enroll-course"
            value={form.courseId}
            error={errors.courseId}
            onChange={(event) => setForm({ ...form, courseId: event.target.value })}
          >
            <option value="">Choose a published course</option>
            {publishedCourses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </SelectInput>
        </Field>
        {!publishedCourses.length ? (
          <p className="text-sm text-amber-900">
            No published courses available.{' '}
            <Link to="/courses" className="font-semibold text-accent hover:text-accent-hover">Publish a course</Link>
            {' '}first.
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={pending || !publishedCourses.length}>
            {pending ? 'Saving…' : 'Add enrollment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ManageEnrollment({ id, onClose, onSaved }) {
  const toast = useToast();
  const detail = useResource(() => api(`/api/v1/enrollments/${id}`), [id]);
  const enrollment = detail.data?.data;
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState('');

  useEffect(() => {
    if (enrollment?.status) setStatus(enrollment.status);
  }, [enrollment?.status]);

  async function save() {
    if (status === 'withdrawn' && enrollment.status !== 'withdrawn' && confirming !== 'withdraw') {
      setConfirming('withdraw');
      return;
    }
    setPending(true);
    try {
      await api(`/api/v1/enrollments/${id}`, { method: 'PATCH', body: { status } });
      onSaved('Enrollment updated.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  async function withdraw() {
    setPending(true);
    try {
      await api(`/api/v1/enrollments/${id}`, { method: 'DELETE' });
      onSaved('Enrollment withdrawn. The record and progress history are kept.');
    } catch (error) {
      toast.error(error.message);
      setConfirming('');
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title="Enrollment details" onClose={onClose}>
      {detail.status === 'loading' ? (
        <p className="text-sm text-ink-muted">Loading enrollment…</p>
      ) : null}
      {detail.status === 'error' ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm font-semibold text-red-800">{detail.error?.message}</p>
          <button type="button" className="btn-secondary" onClick={detail.reload}>Try again</button>
        </div>
      ) : null}
      {enrollment ? (
        <div className="space-y-4">
          <dl className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-ink-muted">Enrollment ID</dt>
              <dd className="mt-1 tabular-nums text-ink">#{enrollment.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-muted">Enrolled</dt>
              <dd className="mt-1 text-ink">{formatDate(enrollment.enrolledAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-muted">Student</dt>
              <dd className="mt-1 text-ink">
                <div className="font-semibold">{enrollment.studentName}</div>
                <div className="text-ink-muted">{enrollment.email}</div>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-muted">Course</dt>
              <dd className="mt-1 text-ink">{enrollment.courseTitle}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-semibold text-ink-muted">Learning progress</dt>
              <dd className="mt-2 space-y-2">
                <ProgressBar value={enrollment.percent} />
                {enrollment.progressStatus ? <StatusBadge status={enrollment.progressStatus} /> : null}
                {enrollment.progressUpdatedAt ? (
                  <p className="text-xs text-ink-muted">Updated {formatDateTime(enrollment.progressUpdatedAt)}</p>
                ) : null}
                <p className="text-xs text-ink-muted">
                  Progress percentages come from the platform progress records (not lesson counts). This product does not store per-lesson completion.
                </p>
              </dd>
            </div>
          </dl>

          <Field id="manage-status" label="Enrollment status">
            <SelectInput
              id="manage-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setConfirming('');
              }}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="withdrawn">Withdrawn</option>
            </SelectInput>
          </Field>
          <p className="text-sm text-ink-muted">Marking completed sets progress to 100%. Withdrawal keeps the enrollment and progress rows.</p>

          {confirming === 'withdraw' ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
              Withdraw {enrollment.studentName} from {enrollment.courseTitle}?
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setConfirming('')}>Cancel</button>
                <button type="button" className="btn-primary" disabled={pending} onClick={save}>Confirm withdraw</button>
              </div>
            </div>
          ) : null}

          {confirming === 'delete' ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
              Withdraw this enrollment? History and progress remain available with status “withdrawn”.
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setConfirming('')}>Keep enrollment</button>
                <button type="button" className="btn-danger" disabled={pending} onClick={withdraw}>
                  {pending ? 'Withdrawing…' : 'Withdraw enrollment'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between gap-2">
              {enrollment.status !== 'withdrawn' ? (
                <button type="button" className="btn-danger" onClick={() => setConfirming('delete')}>Withdraw</button>
              ) : <span />}
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={pending || confirming === 'withdraw' || status === enrollment.status}
                  onClick={save}
                >
                  {pending ? 'Saving…' : 'Save status'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
