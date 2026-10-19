import { useState } from 'react';
import { api, buildQuery, getToken } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { useResource } from '../hooks/useResource.js';
import { formatMonth } from '../lib/format.js';
import {
  BookIcon,
  ClipboardIcon,
  PercentIcon,
  UsersIcon,
} from '../components/icons.jsx';
import {
  BarChart,
  DashboardSkeleton,
  DataPanel,
  EmptyState,
  Field,
  Filters,
  PageHeader,
  ProgressBar,
  SelectInput,
  SplitBar,
  StatCard,
  StatusBadge,
  TextInput,
} from '../components/ui.jsx';

export function ReportsPage() {
  const toast = useToast();
  const list = useListParams();
  const [exporting, setExporting] = useState(false);
  const lookups = useResource(() => api('/api/v1/lookups'), []);
  const resource = useResource(
    () => api(`/api/v1/reports${buildQuery({
      from: list.from,
      to: list.to,
      courseId: list.courseId,
    })}`),
    [list.from, list.to, list.courseId],
  );
  const data = resource.data?.data;
  const courses = lookups.data?.data.courses ?? [];

  async function downloadCsv() {
    setExporting(true);
    try {
      const query = buildQuery({
        from: list.from,
        to: list.to,
        courseId: list.courseId,
      });
      const response = await fetch(`/api/v1/reports/export${query}`, {
        headers: {
          Accept: 'text/csv',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'Export failed.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `eduadmin-course-report-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Course report downloaded.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setExporting(false);
    }
  }

  const periodLabel = [
    list.from ? `from ${list.from}` : null,
    list.to ? `to ${list.to}` : null,
  ].filter(Boolean).join(' ') || 'all dates';

  return (
    <>
      <PageHeader
        title="Reports & analytics"
        description="Aggregates from the live database. Enrollment metrics exclude withdrawn records unless noted. Dates use UTC; the end date is inclusive."
        actions={(
          <button type="button" className="btn-secondary" disabled={exporting || resource.status !== 'ready'} onClick={downloadCsv}>
            {exporting ? 'Exporting…' : 'Export course CSV'}
          </button>
        )}
      />

      <Filters
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <Field id="report-from" label="From">
          <TextInput
            id="report-from"
            type="date"
            value={list.from}
            onChange={(event) => list.update({ from: event.target.value, to: list.to, courseId: list.courseId })}
          />
        </Field>
        <Field id="report-to" label="To">
          <TextInput
            id="report-to"
            type="date"
            value={list.to}
            onChange={(event) => list.update({ from: list.from, to: event.target.value, courseId: list.courseId })}
          />
        </Field>
        <Field id="report-course" label="Course">
          <SelectInput
            id="report-course"
            value={list.courseId}
            onChange={(event) => list.update({ from: list.from, to: list.to, courseId: event.target.value })}
          >
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </SelectInput>
        </Field>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => list.update({ from: '', to: '', courseId: '' })}
        >
          Reset filters
        </button>
      </Filters>

      <p className="mb-4 text-sm text-ink-muted">Reporting period: <span className="font-semibold text-ink">{periodLabel}</span></p>

      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        skeleton={<DashboardSkeleton />}
      >
        {data ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Students"
                value={data.students.total}
                detail={`${data.students.active} active · ${data.students.inactive} inactive · ${data.students.suspended} suspended`}
                icon={UsersIcon}
                tone="sky"
              />
              <StatCard
                label="Courses"
                value={data.courses}
                detail={`${data.publishedCourses} published · ${data.draftCourses} draft`}
                icon={BookIcon}
                tone="accent"
              />
              <StatCard
                label="Enrollments in period"
                value={data.enrollments}
                detail="Active + completed (withdrawn excluded)"
                icon={ClipboardIcon}
                tone="violet"
              />
              <StatCard
                label="Completion rate"
                value={`${data.completionRate}%`}
                detail={`${data.enrollmentsByStatus.completed} completed in period`}
                icon={PercentIcon}
                tone="amber"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="surface-card p-5">
                <h2 className="text-base font-semibold">Students by status</h2>
                <p className="mt-1 text-sm text-ink-muted">Current account status (not limited by enrollment dates).</p>
                <div className="mt-4">
                  <SplitBar
                    parts={[
                      { label: 'Active', value: data.students.active, className: 'bg-accent' },
                      { label: 'Inactive', value: data.students.inactive, className: 'bg-slate-400' },
                      { label: 'Suspended', value: data.students.suspended, className: 'bg-red-500' },
                    ]}
                  />
                </div>
              </section>
              <section className="surface-card p-5">
                <h2 className="text-base font-semibold">Enrollments by status</h2>
                <p className="mt-1 text-sm text-ink-muted">Counts inside the selected date range (includes withdrawn in this breakdown).</p>
                <div className="mt-4">
                  <SplitBar
                    parts={[
                      { label: 'Active', value: data.enrollmentsByStatus.active, className: 'bg-accent' },
                      { label: 'Completed', value: data.enrollmentsByStatus.completed, className: 'bg-emerald-500' },
                      { label: 'Withdrawn', value: data.enrollmentsByStatus.withdrawn, className: 'bg-slate-400' },
                    ]}
                  />
                </div>
              </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="surface-card p-5">
                <h2 className="text-base font-semibold">Enrollment trend</h2>
                <p className="mt-1 text-sm text-ink-muted">New enrollments by month (UTC), using enrolled_at.</p>
                <div className="mt-4">
                  <BarChart
                    emptyMessage="No enrollments in this period yet."
                    points={data.enrollmentTrend.map((point) => ({
                      ...point,
                      label: formatMonth(point.month),
                    }))}
                  />
                </div>
              </section>
              <section className="surface-card p-5">
                <h2 className="text-base font-semibold">Student registrations</h2>
                <p className="mt-1 text-sm text-ink-muted">New student accounts by created_at month (UTC).</p>
                <div className="mt-4">
                  <BarChart
                    emptyMessage="No student registrations in this period yet."
                    points={data.studentRegistrationTrend.map((point) => ({
                      ...point,
                      label: formatMonth(point.month),
                    }))}
                  />
                </div>
              </section>
            </div>

            <section className="surface-card p-5">
              <h2 className="text-base font-semibold">Learning progress summary</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Based on stored progress percentages for non-withdrawn enrollments in the period. Lesson-level completion is not tracked in this platform.
              </p>
              <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <li className="rounded-lg bg-slate-50 px-3 py-3">
                  Tracked records
                  <span className="mt-1 block text-xl font-semibold tabular-nums">{data.progress.tracked}</span>
                </li>
                <li className="rounded-lg bg-slate-50 px-3 py-3">
                  Average progress
                  <span className="mt-1 block text-xl font-semibold tabular-nums">{data.progress.averageProgress}%</span>
                </li>
                <li className="rounded-lg bg-slate-50 px-3 py-3">
                  Below 40%
                  <span className="mt-1 block text-xl font-semibold tabular-nums">{data.progress.belowForty}</span>
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Course enrollment report</h2>
                  <p className="text-sm text-ink-muted">Ranked by enrollments in the selected period (withdrawn excluded).</p>
                </div>
              </div>
              {data.courseRows.length ? (
                <div className="table-wrap overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Course</th>
                        <th scope="col">Category</th>
                        <th scope="col">Status</th>
                        <th scope="col">Enrollments</th>
                        <th scope="col">Completed</th>
                        <th scope="col">Average progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.courseRows.map((row) => (
                        <tr key={row.id}>
                          <td className="font-semibold text-ink">{row.title}</td>
                          <td>{row.category}</td>
                          <td><StatusBadge status={row.courseStatus} /></td>
                          <td className="tabular-nums">{row.enrollments}</td>
                          <td className="tabular-nums">{row.completed}</td>
                          <td><ProgressBar value={row.averageProgress} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No courses" message="No course rows matched the current filters." />
              )}
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="surface-card p-5">
                <h2 className="text-base font-semibold">Most enrolled courses</h2>
                <p className="mt-1 text-sm text-ink-muted">Top courses by enrollment count in the period.</p>
                {data.topCourses.length ? (
                  <ul className="mt-4 space-y-3">
                    {data.topCourses.map((row, index) => (
                      <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0">
                          <span className="mr-2 tabular-nums text-ink-muted">{index + 1}.</span>
                          <span className="font-semibold text-ink">{row.title}</span>
                        </span>
                        <span className="shrink-0 tabular-nums font-semibold">{row.enrollments}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-muted">No enrollments in this period.</p>
                )}
              </section>
              <section className="surface-card p-5">
                <h2 className="text-base font-semibold">Published with no enrollments</h2>
                <p className="mt-1 text-sm text-ink-muted">Published courses with zero non-withdrawn enrollments in the period.</p>
                {data.lowEnrollmentCourses.length ? (
                  <ul className="mt-4 space-y-2 text-sm">
                    {data.lowEnrollmentCourses.map((row) => (
                      <li key={row.id} className="rounded-lg bg-slate-50 px-3 py-2 font-semibold text-ink">
                        {row.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-muted">Every published course has at least one enrollment in this period.</p>
                )}
              </section>
            </div>
          </div>
        ) : null}
      </DataPanel>
    </>
  );
}
