import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useResource } from '../hooks/useResource.js';
import { formatDateTime, formatMonth, statusLabel } from '../lib/format.js';
import {
  Avatar,
  BarChart,
  DashboardSkeleton,
  DataPanel,
  ProgressBar,
} from '../components/ui.jsx';

const ACTION_LABELS = {
  'student.updated': 'Student updated',
  'course.created': 'Course created',
  'course.updated': 'Course updated',
  'course.published': 'Course published',
  'course.unpublished': 'Course unpublished',
  'course.deleted': 'Course unpublished',
  'enrollment.created': 'Enrollment added',
  'enrollment.updated': 'Enrollment updated',
  'enrollment.deleted': 'Enrollment withdrawn',
  'admin.created': 'Administrator added',
  'admin.updated': 'Administrator updated',
  'profile.updated': 'Profile updated',
};

const METRICS = [
  { key: 'students', label: 'Students', detail: 'Accounts on record' },
  { key: 'courses', label: 'Courses', detail: 'Published and draft' },
  { key: 'enrollments', label: 'Enrollments', detail: 'Excluding withdrawn' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const resource = useResource(() => api('/api/v1/dashboard'), []);
  const data = resource.data?.data;
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <DataPanel
      status={resource.status}
      error={resource.error}
      onRetry={resource.reload}
      skeleton={<DashboardSkeleton />}
    >
      {data ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-5">
            <section className="overflow-hidden rounded-xl border border-ink bg-ink text-white shadow-card">
              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Operations</p>
                  <h2 className="mt-2 max-w-xl text-2xl font-semibold leading-snug tracking-tight">
                    Good day, {firstName}. Here is the current academic record.
                  </h2>
                  <p className="mt-2 max-w-lg text-sm text-slate-300">
                    {data.publishedCourses} published and {data.draftCourses} draft courses are in the catalog.
                  </p>
                </div>
                <Link to="/courses" className="inline-flex shrink-0 items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-100">
                  Review courses
                </Link>
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-3">
              {METRICS.map((metric) => (
                <article key={metric.key} className="surface-card border-l-4 border-l-accent p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-ink">{data[metric.key]}</p>
                  <p className="mt-1 text-sm text-ink-muted">{metric.detail}</p>
                </article>
              ))}
            </div>

            <section className="surface-card">
              <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">Needs attention</h2>
                  <p className="mt-1 text-sm text-ink-muted">Active enrollments under 40% progress.</p>
                </div>
                <Link to="/progress" className="text-sm font-semibold text-accent hover:text-accent-hover">View progress</Link>
              </div>
              {data.attention.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-ink-muted">
                        <th className="px-5 py-3 font-semibold">Student</th>
                        <th className="px-5 py-3 font-semibold">Course</th>
                        <th className="px-5 py-3 font-semibold">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.attention.map((row) => (
                        <tr key={`${row.studentName}-${row.courseTitle}`} className="border-t border-line">
                          <td className="px-5 py-3">
                            <span className="flex items-center gap-3 font-semibold text-ink">
                              <Avatar name={row.studentName} size="sm" />
                              {row.studentName}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-ink-muted">{row.courseTitle}</td>
                          <td className="px-5 py-3"><ProgressBar value={row.percent} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-5 py-8 text-sm text-ink-muted">No active enrollments are below 40% right now.</p>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="surface-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Average progress</p>
              <div className="mt-4 flex items-center gap-4">
                <div
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
                  style={{ background: `conic-gradient(#0f766e ${data.averageProgress * 3.6}deg, #e2e8f0 0deg)` }}
                  role="img"
                  aria-label={`Average progress ${data.averageProgress} percent`}
                >
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-semibold tabular-nums">{data.averageProgress}%</span>
                </div>
                <p className="text-sm leading-relaxed text-ink-muted">
                  Mean completion across enrollments that are still active.
                </p>
              </div>
            </section>

            <section className="surface-card p-5">
              <h2 className="text-sm font-semibold">Enrollment trend</h2>
              <p className="mb-4 mt-1 text-xs text-ink-muted">Last six months, withdrawn excluded.</p>
              <BarChart
                emptyMessage="No enrollments in this period yet."
                points={data.enrollmentTrend.map((point) => ({
                  ...point,
                  label: formatMonth(point.month),
                }))}
              />
            </section>

            <section className="surface-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent activity</h2>
                <Link to="/reports" className="text-xs font-semibold text-accent hover:text-accent-hover">Reports</Link>
              </div>
              {data.recentActivity.length ? (
                <ul className="divide-y divide-line">
                  {data.recentActivity.slice(0, 4).map((item) => (
                    <li key={item.id} className="py-3 text-sm first:pt-0 last:pb-0">
                      <p className="font-semibold text-ink">{ACTION_LABELS[item.action] || statusLabel(item.action)}</p>
                      <p className="text-ink-muted">{item.actorName || 'System'} · {formatDateTime(item.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">No administrative activity recorded yet.</p>
              )}
            </section>
          </aside>
        </div>
      ) : null}
    </DataPanel>
  );
}
