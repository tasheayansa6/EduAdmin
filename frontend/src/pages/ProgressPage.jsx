import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, buildQuery } from '../api/client.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useListParams } from '../hooks/useListParams.js';
import { useResource } from '../hooks/useResource.js';
import { formatDate } from '../lib/format.js';
import {
  DataPanel,
  Field,
  Filters,
  PageHeader,
  Pagination,
  ProgressBar,
  SelectInput,
  StatusBadge,
  TableSkeleton,
  TextInput,
} from '../components/ui.jsx';

export function ProgressPage() {
  const list = useListParams();
  const debouncedDraft = useDebouncedValue(list.draft, 400);

  useEffect(() => {
    if (debouncedDraft.trim() === list.q) return;
    list.update({ q: debouncedDraft.trim(), status: list.status, courseId: list.courseId });
  }, [debouncedDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  const resource = useResource(
    () => api(`/api/v1/progress${buildQuery({
      q: list.q,
      status: list.status,
      courseId: list.courseId,
      page: list.page,
      limit: 8,
    })}`),
    [list.q, list.status, list.courseId, list.page],
  );
  const lookups = useResource(() => api('/api/v1/lookups'), []);
  const rows = resource.data?.data ?? [];
  const filtered = Boolean(list.q || list.status || list.courseId);

  return (
    <>
      <PageHeader
        title="Learning progress"
        description="Course progress percentages stored for non-withdrawn enrollments. This platform tracks percent completion per student and course; it does not store individual lesson completions."
        actions={(
          <Link to="/enrollments" className="btn-secondary">View enrollments</Link>
        )}
      />

      <Filters
        onSubmit={(event) => {
          event.preventDefault();
          list.update({ q: list.draft.trim(), status: list.status, courseId: list.courseId });
        }}
      >
        <Field id="progress-search" label="Search" className="min-w-[16rem] flex-1">
          <TextInput
            id="progress-search"
            value={list.draft}
            onChange={(event) => list.setDraft(event.target.value)}
            placeholder="Student or course"
          />
        </Field>
        <Field id="progress-course" label="Course">
          <SelectInput
            id="progress-course"
            value={list.courseId}
            onChange={(event) => list.update({ q: list.q, status: list.status, courseId: event.target.value })}
          >
            <option value="">All courses</option>
            {(lookups.data?.data.courses ?? []).map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </SelectInput>
        </Field>
        <Field id="progress-status" label="Progress status">
          <SelectInput
            id="progress-status"
            value={list.status}
            onChange={(event) => list.update({ q: list.q, status: event.target.value, courseId: list.courseId })}
          >
            <option value="">All progress</option>
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </SelectInput>
        </Field>
        <button type="submit" className="btn-primary">Search</button>
      </Filters>

      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        isEmpty={rows.length === 0}
        emptyTitle={filtered ? 'No matching progress' : 'No progress records'}
        emptyMessage={
          filtered
            ? 'Try another student, course, or progress state.'
            : 'Progress rows are created when a student is enrolled. Withdrawn enrollments are excluded here.'
        }
        skeleton={<TableSkeleton />}
      >
        <div className="table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Course</th>
                <th scope="col">Progress</th>
                <th scope="col">Status</th>
                <th scope="col">Enrollment</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold text-ink">{row.studentName}</div>
                    <div className="text-sm text-ink-muted">{row.email}</div>
                  </td>
                  <td>{row.courseTitle}</td>
                  <td><ProgressBar value={row.percent} /></td>
                  <td><StatusBadge status={row.status} /></td>
                  <td><StatusBadge status={row.enrollmentStatus} /></td>
                  <td>{formatDate(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={resource.data?.meta} onPage={(page) => list.update({ page }, { resetPage: false })} />
        </div>
      </DataPanel>
    </>
  );
}
