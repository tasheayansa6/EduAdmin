import { useState } from 'react';
import { api, buildQuery } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { useResource } from '../hooks/useResource.js';
import { fieldErrors, formatDate } from '../lib/format.js';
import { validateCourse } from '../lib/validate.js';
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

const emptyCourse = { title: '', description: '', categoryId: '', status: 'draft' };

export function CoursesPage() {
  const toast = useToast();
  const list = useListParams();
  const resource = useResource(
    () => api(`/api/v1/courses${buildQuery({
      q: list.q,
      status: list.status,
      categoryId: list.categoryId,
      page: list.page,
      limit: 6,
    })}`),
    [list.q, list.status, list.categoryId, list.page],
  );
  const lookups = useResource(() => api('/api/v1/lookups'), []);
  const [editing, setEditing] = useState(null);
  const categories = lookups.data?.data.categories ?? [];
  const rows = resource.data?.data ?? [];
  const filtered = Boolean(list.q || list.status || list.categoryId);

  return (
    <>
      <PageIntro action={<button type="button" className="btn-primary" onClick={() => setEditing(emptyCourse)}>New course</button>}>
        Create and maintain the catalog. Publishing makes a course available in the platform record.
      </PageIntro>
      <Filters onSubmit={(event) => {
        event.preventDefault();
        list.update({ q: list.draft.trim(), status: list.status, categoryId: list.categoryId });
      }}
      >
        <Field id="course-search" label="Search" className="min-w-[16rem] flex-1">
          <TextInput id="course-search" value={list.draft} onChange={(event) => list.setDraft(event.target.value)} placeholder="Title or description" />
        </Field>
        <Field id="course-category" label="Category">
          <SelectInput id="course-category" value={list.categoryId} onChange={(event) => list.update({ q: list.q, status: list.status, categoryId: event.target.value })}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </SelectInput>
        </Field>
        <Field id="course-status" label="Status">
          <SelectInput id="course-status" value={list.status} onChange={(event) => list.update({ q: list.q, status: event.target.value, categoryId: list.categoryId })}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </SelectInput>
        </Field>
        <button type="submit" className="btn-primary">Search</button>
      </Filters>
      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        isEmpty={rows.length === 0}
        emptyTitle={filtered ? 'No matching courses' : 'No courses yet'}
        emptyMessage={filtered ? 'Try another title, category, or status.' : 'Create the first course to build the catalog.'}
        skeleton={<TableSkeleton />}
      >
        <div className="table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Students</th>
                <th>Updated</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((course) => (
                <tr key={course.id}>
                  <td className="max-w-xs">
                    <div className="font-semibold">{course.title}</div>
                    <div className="mt-1 line-clamp-2 text-ink-muted">{course.description}</div>
                  </td>
                  <td>{course.categoryName}</td>
                  <td><StatusBadge status={course.status} /></td>
                  <td className="tabular-nums">{course.enrollmentCount}</td>
                  <td>{formatDate(course.updatedAt)}</td>
                  <td className="text-right">
                    <button type="button" className="btn-secondary" onClick={() => setEditing(course)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={resource.data?.meta} onPage={(page) => list.update({ page }, { resetPage: false })} />
        </div>
      </DataPanel>
      {editing ? (
        <CourseDialog
          course={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            toast.success(message);
            setEditing(null);
            resource.reload();
            lookups.reload();
          }}
        />
      ) : null}
    </>
  );
}

function CourseDialog({ course, categories, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: course.title,
    description: course.description,
    categoryId: course.categoryId ? String(course.categoryId) : '',
    status: course.status,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validateCourse(form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      categoryId: Number(form.categoryId),
      status: form.status,
    };
    setPending(true);
    try {
      if (course.id) {
        await api(`/api/v1/courses/${course.id}`, { method: 'PATCH', body });
        onSaved('Course updated.');
      } else {
        await api('/api/v1/courses', { method: 'POST', body });
        onSaved('Course created.');
      }
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (!Object.keys(fields).length) setFormError(error.message);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    try {
      await api(`/api/v1/courses/${course.id}`, { method: 'DELETE' });
      onSaved('Course unpublished and moved to draft.');
    } catch (error) {
      setConfirming(false);
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title={course.id ? 'Edit course' : 'New course'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? <p role="alert" className="text-sm font-semibold text-red-800">{formError}</p> : null}
        <Field id="course-title" label="Title" error={errors.title}>
          <TextInput id="course-title" name="title" value={form.title} error={errors.title} onChange={update} />
        </Field>
        <Field id="course-description" label="Description" error={errors.description}>
          <TextArea id="course-description" name="description" rows="4" value={form.description} error={errors.description} onChange={update} />
        </Field>
        <Field id="course-edit-category" label="Category" error={errors.categoryId}>
          <SelectInput id="course-edit-category" name="categoryId" value={form.categoryId} error={errors.categoryId} onChange={update}>
            <option value="">Choose a category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </SelectInput>
        </Field>
        <Field id="course-edit-status" label="Status" error={errors.status}>
          <SelectInput id="course-edit-status" name="status" value={form.status} error={errors.status} onChange={update}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </SelectInput>
        </Field>
        {confirming ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-ink">
              Unpublish “{course.title}”? The course stays in the catalog as a draft. Existing enrollments and progress are kept.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>Keep published</button>
              <button type="button" className="btn-danger" disabled={pending} onClick={remove}>
                {pending ? 'Unpublishing…' : 'Unpublish course'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between gap-2 pt-2">
            {course.id && course.status === 'published' ? (
              <button type="button" className="btn-danger" onClick={() => setConfirming(true)}>Unpublish</button>
            ) : <span />}
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save course'}</button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
